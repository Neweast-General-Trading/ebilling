"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthActor = getAuthActor;
function getAuthActor(user) {
    if (!user || typeof user !== 'object') {
        return { email: 'unknown', name: null };
    }
    const record = user;
    const email = (record.email ||
        record.preferred_username ||
        'unknown').trim();
    const name = record.name?.trim() ||
        [record.given_name, record.family_name]
            .filter(Boolean)
            .join(' ')
            .trim() ||
        null;
    return { email, name: name || null };
}
//# sourceMappingURL=auth-user.util.js.map