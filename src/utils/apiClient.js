/**
 * apiClient.js
 *
 * Drop-in axios instance that:
 *  • attaches the Bearer token automatically
 *  • wraps every request  in { encrypted, hash, timestamp }
 *  • unwraps every response from { encrypted, hash } → plain JS object
 *
 * Usage:
 *   import api from '../utils/apiClient';
 *   const user = await api.get('/api/panel/me');          // returns plain object
 *   const res  = await api.post('/api/panel/attack', data); // plain object
 */

import axios from 'axios';
import {
    decryptResponse,
    buildEncryptedPayload,
    buildEncryptedParams,
} from './cryptoUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({ baseURL: API_URL });

/* ─── REQUEST interceptor ───────────────────────────────────── */
apiClient.interceptors.request.use((config) => {
    // Attach auth token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get' || config.method === 'delete') {
        // Merge any existing params into the encrypted envelope
        config.params = buildEncryptedParams(config.params ?? {});
    } else {
        // POST / PUT / PATCH – merge body data into encrypted envelope
        const extra = config._extra ?? {};          // e.g. { clientVersion: '1.0.0' }
        config.data  = buildEncryptedPayload(config.data ?? {}, extra);
    }

    return config;
});

/* ─── RESPONSE interceptor ──────────────────────────────────── */
apiClient.interceptors.response.use(
    (response) => {
        const { encrypted, hash } = response.data ?? {};
        if (encrypted && hash) {
            // Replace the raw axios response data with the decrypted payload
            response.data = decryptResponse(encrypted, hash);
        }
        return response;
    },
    (error) => {
        // Try to decrypt error responses too
        const errData = error.response?.data;
        if (errData?.encrypted && errData?.hash) {
            try {
                const decrypted = decryptResponse(errData.encrypted, errData.hash);
                // Attach a clean `message` so callers can do: err.decrypted.message
                error.decrypted = decrypted;
                error.message   = decrypted.message || error.message;
            } catch {
                // leave error as-is if decryption fails
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

/* ─── convenience re-export so callers can pass captcha inline ─ */
/**
 * Pass a `captchaData` object returned by your CaptchaWidget into a POST body.
 * The interceptor will include it inside the encrypted envelope automatically.
 *
 * Example:
 *   await api.post('/api/panel/attack', {
 *       ip, port, duration, captchaData
 *   }, { _extra: { clientVersion: '1.0.0' } });
 */