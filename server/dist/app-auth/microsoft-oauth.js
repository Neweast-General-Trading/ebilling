"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMicrosoftLoginUrl = exports.consumeMicrosoftLogin = exports.storeMicrosoftLogin = void 0;
const crypto_1 = require("crypto");
const axios_1 = __importDefault(require("axios"));
const pendingLogins = new Map();
const TENANT_ID = process.env.AZURE_TENANT_ID || '49398592-1c41-4c6f-b59c-7efea4675def';
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '1b7c74bc-8564-4585-8f4c-40b51f2d6d60';
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const REDIRECT_URI = (process.env.AZURE_REDIRECT_URI || 'https://mis.neweast.cloud/ebilling/api/auth/microsoft/callback').replace(/\/$/, '');
const SCOPES = (process.env.AZURE_SCOPES || 'openid profile email User.Read').split(/\s+/).filter(Boolean);
function base64UrlEncode(buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}
function createPkcePair() {
    const verifier = base64UrlEncode((0, crypto_1.randomBytes)(32));
    const challenge = base64UrlEncode((0, crypto_1.createHash)('sha256').update(verifier).digest());
    return { verifier, challenge };
}
function cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of pendingLogins.entries()) {
        if (value.expiresAt <= now) {
            pendingLogins.delete(key);
        }
    }
}
function storeMicrosoftLogin(returnTo) {
    cleanupExpired();
    const state = base64UrlEncode((0, crypto_1.randomBytes)(24));
    const { verifier, challenge } = createPkcePair();
    pendingLogins.set(state, {
        verifier,
        returnTo: returnTo || process.env.CLIENT_URL || 'https://ebilling.neweast.cloud/login/',
        expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return { state, challenge };
}
exports.storeMicrosoftLogin = storeMicrosoftLogin;
function consumeMicrosoftLogin(state) {
    cleanupExpired();
    const entry = pendingLogins.get(state);
    if (!entry) {
        return null;
    }
    pendingLogins.delete(state);
    return entry;
}
exports.consumeMicrosoftLogin = consumeMicrosoftLogin;
function buildMicrosoftLoginUrl(returnTo) {
    const { state, challenge } = storeMicrosoftLogin(returnTo);
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        response_mode: 'query',
        scope: SCOPES.join(' '),
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
    });
    return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}
exports.buildMicrosoftLoginUrl = buildMicrosoftLoginUrl;
async function exchangeCodeForToken(code, verifier) {
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
        scope: SCOPES.join(' '),
    });
    if (CLIENT_SECRET) {
        body.set('client_secret', CLIENT_SECRET);
    }
    const { data } = await axios_1.default.post(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!data?.access_token) {
        throw new Error('Microsoft did not return an access token');
    }
    return data.access_token;
}
async function completeMicrosoftLogin(code, state) {
    const pending = consumeMicrosoftLogin(state);
    if (!pending) {
        throw new Error('Login session expired — try again');
    }
    const accessToken = await exchangeCodeForToken(code, pending.verifier);
    return { accessToken, returnTo: pending.returnTo };
}
exports.completeMicrosoftLogin = completeMicrosoftLogin;
