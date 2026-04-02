require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../public")));

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const MONGO_URI = process.env.MONGO_URI || "";
const PORT = process.env.PORT || 3000;
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
    .split(",").map((s) => parseInt(s.trim())).filter(Boolean);

// ─── MODELS ────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    username: String,
    lastSeen: { type: Date, default: Date.now },
    unread: { type: Number, default: 0 },
});

const msgSchema = new mongoose.Schema({
    userId: Number,
    fromAdmin: { type: Boolean, default: false },
    text: String,
    type: { type: String, default: "text" },
    fileId: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number,
    caption: String,
    telegramMsgId: Number,
    timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", msgSchema);

// ─── FILE URL CACHE ────────────────────────────────────────────────
const fileUrlCache = {};

async function getFileUrl(fileId) {
    if (!fileId || !BOT_TOKEN) return null;
    if (fileUrlCache[fileId]) return fileUrlCache[fileId];
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
        const data = await res.json();
        if (data.ok) {
            const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
            fileUrlCache[fileId] = url;
            return url;
        }
    } catch (e) { console.error("getFile error:", e.message); }
    return null;
}

// ─── PARSE INCOMING MESSAGE ────────────────────────────────────────
function parseMsg(msg) {
    let type = "text", fileId = null, fileName = null;
    let fileSize = null, mimeType = null, duration = null;
    let caption = msg.caption || null;
    let text = msg.text || null;

    if (msg.photo) {
        type = "photo";
        const p = msg.photo[msg.photo.length - 1];
        fileId = p.file_id; fileSize = p.file_size;
    } else if (msg.video) {
        type = "video"; fileId = msg.video.file_id;
        fileSize = msg.video.file_size; mimeType = msg.video.mime_type;
        duration = msg.video.duration;
    } else if (msg.voice) {
        type = "voice"; fileId = msg.voice.file_id;
        fileSize = msg.voice.file_size; duration = msg.voice.duration;
        mimeType = "audio/ogg";
    } else if (msg.audio) {
        type = "audio"; fileId = msg.audio.file_id;
        fileSize = msg.audio.file_size; duration = msg.audio.duration;
        mimeType = msg.audio.mime_type;
        fileName = msg.audio.file_name || msg.audio.title || "Audio";
    } else if (msg.sticker) {
        type = "sticker"; fileId = msg.sticker.file_id;
    } else if (msg.document) {
        type = "document"; fileId = msg.document.file_id;
        fileName = msg.document.file_name;
        fileSize = msg.document.file_size;
        mimeType = msg.document.mime_type;
    } else if (msg.video_note) {
        type = "video_note"; fileId = msg.video_note.file_id;
        duration = msg.video_note.duration;
    }

    return { type, fileId, fileName, fileSize, mimeType, duration, caption, text };
}

// ─── BOT ───────────────────────────────────────────────────────────
let bot = null;

function initBot() {
    if (!BOT_TOKEN) { console.warn("⚠️  BOT_TOKEN not set"); return; }
    bot = new TelegramBot(BOT_TOKEN, { polling: true });

    bot.onText(/\/start/, async (msg) => {
        const uid = msg.from.id;
        const firstName = msg.from.first_name || "User";

        // Save/update user
        await User.findByIdAndUpdate(uid,
            { name: firstName, username: msg.from.username || "", lastSeen: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const welcomeText =
            `⚡ *Welcome to Battle Destroyer, ${firstName}!* ⚡\n\n` +
            `🔥 *The Best Service on Telegram!*\n` +
            `Trusted by thousands — we deliver power, speed & results.\n\n` +
            `👇 Use the buttons below to explore our plans and community.`;

        await bot.sendMessage(uid, welcomeText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💰 View Plans", callback_data: "show_price" }],
                    [{ text: "📢 Community", url: "https://t.me/BattleDestroyerDDOS" }],
                    [{ text: "✅ Proof Channel", url: "https://t.me/BDSellingProof" }],
                ],
            },
        });
    });

    // ─── PRICE LIST HELPER ─────────────────────────────────────────────
    const plans = [
        { label: 'Weekly', days: 7, price: 850 },
        { label: 'Monthly', days: 30, price: 1800 },
        { label: 'Season', days: 60, price: 2500 },
    ];

    function buildPriceText() {
        const rows = plans.map(p =>
            `🗓 *${p.label} Plan* — ${p.days} Days\n` +
            `   💰 Price: ₹${p.price}`
        ).join('\n\n');

        return (
            `🏷️ *Battle Destroyer — Plans & Pricing*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            rows +
            `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
            `📩 DM us to purchase a plan.`
        );
    }

    const priceButtons = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📢 Community", url: "https://t.me/BattleDestroyerDDOS" }],
                [{ text: "✅ Proof Channel", url: "https://t.me/BDSellingProof" }],
            ],
        },
    };

    // ─── /price COMMAND ────────────────────────────────────────────────
    bot.onText(/\/price/, async (msg) => {
        await bot.sendMessage(msg.from.id, buildPriceText(), {
            parse_mode: "Markdown",
            ...priceButtons,
        });
    });

    // ─── CALLBACK: "show_price" button from /start ─────────────────────
    bot.on("callback_query", async (query) => {
        if (query.data === "show_price") {
            await bot.answerCallbackQuery(query.id);
            await bot.sendMessage(query.from.id, buildPriceText(), {
                parse_mode: "Markdown",
                ...priceButtons,
            });
        }
    });

    bot.on("message", async (msg) => {
        const uid = msg.from.id;
        if (ADMIN_IDS.includes(uid)) return;

        await User.findByIdAndUpdate(uid,
            { name: msg.from.first_name || "Unknown", username: msg.from.username || "", lastSeen: new Date(), $inc: { unread: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const parsed = parseMsg(msg);
        const saved = await Message.create({ userId: uid, fromAdmin: false, ...parsed, telegramMsgId: msg.message_id });

        let fileUrl = null;
        if (parsed.fileId) fileUrl = await getFileUrl(parsed.fileId);

        try {
            const s = await bot.sendMessage(uid, "✅ Message received!");
            setTimeout(() => bot.deleteMessage(uid, s.message_id).catch(() => { }), 3000);
        } catch (_) { }

        io.emit("new_message", { _id: saved._id, userId: uid, fromAdmin: false, ...parsed, fileUrl, timestamp: saved.timestamp });
        io.emit("user_update", { _id: uid, name: msg.from.first_name || "Unknown", username: msg.from.username || "", lastSeen: new Date() });
    });

    bot.on("polling_error", (err) => console.error("Polling error:", err.message));
    console.log("🤖 Telegram bot started");
}

// ─── START ─────────────────────────────────────────────────────────
async function start() {
    if (MONGO_URI) {
        try {
            await mongoose.connect(MONGO_URI, { tls: true, tlsAllowInvalidCertificates: true });
            console.log("✅ MongoDB connected");
        } catch (e) { console.error("❌ MongoDB:", e.message); }
    }
    initBot();
    server.listen(PORT, () => console.log(`🌐 http://localhost:${PORT}`));
}

// ─── API ───────────────────────────────────────────────────────────
app.get("/api/users", async (req, res) => {
    try { res.json(await User.find().sort({ lastSeen: -1 })); }
    catch (e) { res.json([]); }
});

app.get("/api/messages/:userId", async (req, res) => {
    try {
        const msgs = await Message.find({ userId: parseInt(req.params.userId) }).sort({ timestamp: 1 }).limit(200);
        const enriched = await Promise.all(msgs.map(async (m) => {
            const obj = m.toObject();
            if (obj.fileId) obj.fileUrl = await getFileUrl(obj.fileId);
            return obj;
        }));
        res.json(enriched);
        await User.findByIdAndUpdate(parseInt(req.params.userId), { unread: 0 });
        io.emit("clear_unread", { userId: parseInt(req.params.userId) });
    } catch (e) { res.json([]); }
});

// File proxy — keeps bot token server-side
app.get("/api/file/:fileId", async (req, res) => {
    try {
        const url = await getFileUrl(req.params.fileId);
        if (!url) return res.status(404).send("Not found");
        // Stream the file through our server
        const response = await fetch(url);
        const ct = response.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", ct);
        res.setHeader("Cache-Control", "public, max-age=86400");
        const buf = await response.arrayBuffer();
        res.send(Buffer.from(buf));
    } catch (e) { res.status(500).send("Error"); }
});

app.post("/api/reply", async (req, res) => {
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ error: "Missing" });
    try {
        if (bot) await bot.sendMessage(userId, text);
        const saved = await Message.create({ userId, fromAdmin: true, text, type: "text", timestamp: new Date() });
        io.emit("new_message", { _id: saved._id, userId, fromAdmin: true, text, type: "text", timestamp: saved.timestamp });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── BROADCAST with media support ─────────────────────────────────
app.post("/api/broadcast", async (req, res) => {
    const { text, caption, mediaType, mediaBase64, mediaMime, fileName, buttons } = req.body;
    if (!text && !mediaBase64) return res.status(400).json({ error: "No content" });

    const inlineKb = buttons && buttons.length > 0
        ? { reply_markup: { inline_keyboard: buttons.map((b) => [{ text: b.name, url: b.url }]) } }
        : {};

    try {
        const users = await User.find();
        let ok = 0, fail = 0;
        let tmpFile = null;

        // Write media to temp file if provided
        if (mediaBase64) {
            const ext = mediaMime ? mediaMime.split("/")[1].split(";")[0] : "bin";
            tmpFile = path.join(os.tmpdir(), `bc_${Date.now()}.${ext}`);
            fs.writeFileSync(tmpFile, Buffer.from(mediaBase64, "base64"));
        }

        for (const u of users) {
            if (ADMIN_IDS.includes(u._id)) continue;
            try {
                if (tmpFile) {
                    const opts = { caption: caption || text || "", ...inlineKb };
                    if (mediaType === "photo") await bot.sendPhoto(u._id, fs.createReadStream(tmpFile), opts);
                    else if (mediaType === "video") await bot.sendVideo(u._id, fs.createReadStream(tmpFile), opts);
                    else if (mediaType === "audio") await bot.sendAudio(u._id, fs.createReadStream(tmpFile), opts);
                    else if (mediaType === "voice") await bot.sendVoice(u._id, fs.createReadStream(tmpFile), opts);
                    else await bot.sendDocument(u._id, fs.createReadStream(tmpFile), { ...opts, filename: fileName || "file" });
                } else {
                    await bot.sendMessage(u._id, text, { parse_mode: "HTML", ...inlineKb });
                }
                ok++;
            } catch (_) { fail++; }
            await new Promise((r) => setTimeout(r, 100));
        }

        if (tmpFile) try { fs.unlinkSync(tmpFile); } catch (_) { }

        // Store broadcast record
        const broadcastText = caption || text || `[${mediaType} broadcast]`;
        for (const u of users) {
            if (ADMIN_IDS.includes(u._id)) continue;
            await Message.create({ userId: u._id, fromAdmin: true, text: broadcastText, type: mediaType || "text", timestamp: new Date() });
        }

        io.emit("broadcast_done", { ok, fail, total: ok + fail });
        res.json({ ok, fail, total: ok + fail });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMessages = await Message.countDocuments();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayUsers = await User.countDocuments({ lastSeen: { $gte: today } });
        res.json({ totalUsers, totalMessages, todayUsers });
    } catch (e) { res.json({ totalUsers: 0, totalMessages: 0, todayUsers: 0 }); }
});

io.on("connection", (socket) => console.log("🔌 Connected:", socket.id));

start();