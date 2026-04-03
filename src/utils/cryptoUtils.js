import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY =
    process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

/** AES-encrypt any JS value → base64 string */
export function encryptData(data) {
    const json = JSON.stringify(data);
    return CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString();
}

/** SHA-256 HMAC for integrity */
export function createHash(data) {
    const json = JSON.stringify(data);
    return CryptoJS.SHA256(json + ENCRYPTION_KEY).toString();
}

/** Decrypt + verify a server response */
export function decryptResponse(encryptedData, hash) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const raw   = bytes.toString(CryptoJS.enc.Utf8);
    if (!raw) throw new Error('Decryption produced empty result');

    const parsed = JSON.parse(raw);

    const expected = CryptoJS.SHA256(JSON.stringify(parsed) + ENCRYPTION_KEY).toString();
    if (expected !== hash) throw new Error('Response integrity check failed');

    return parsed;
}

/**
 * Wrap any outgoing payload so the server's decryptRequest middleware can
 * verify it:   { encrypted, hash }
 *
 * Extra fields can be merged in via `extra` – useful for clientVersion, etc.
 */
export function buildEncryptedPayload(data, extra = {}) {
    const payload = { ...data, timestamp: Date.now() };
    return {
        encrypted: encryptData(payload),
        hash:      createHash(payload),
        ...extra,
    };
}

/**
 * For GET requests the payload goes in query-params.
 * Returns a plain object ready for axios `params:`.
 */
export function buildEncryptedParams(data = {}) {
    const payload = { ...data, timestamp: Date.now() };
    return {
        encrypted: encryptData(payload),
        hash:      createHash(payload),
    };
}