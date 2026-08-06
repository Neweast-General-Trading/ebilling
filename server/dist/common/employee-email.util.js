"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmployeeEmail = normalizeEmployeeEmail;
exports.employeeEmailsMatch = employeeEmailsMatch;
exports.collectActorEmails = collectActorEmails;
exports.actorOwnsEmployeeEmail = actorOwnsEmployeeEmail;
const NEWEAST_DOMAINS = new Set(['neweast.co', 'neweast.com']);
function normalizeEmployeeEmail(email) {
    return email?.trim().toLowerCase() || '';
}
function emailLocalPart(email) {
    const at = email.indexOf('@');
    if (at <= 0)
        return null;
    return email.slice(0, at);
}
function emailDomain(email) {
    const at = email.indexOf('@');
    if (at <= 0 || at >= email.length - 1)
        return null;
    return email.slice(at + 1);
}
function employeeEmailsMatch(storedEmail, actorEmail) {
    const stored = normalizeEmployeeEmail(storedEmail);
    const actor = normalizeEmployeeEmail(actorEmail);
    if (!stored || !actor)
        return false;
    if (stored === actor)
        return true;
    const storedLocal = emailLocalPart(stored);
    const actorLocal = emailLocalPart(actor);
    const storedDomain = emailDomain(stored);
    const actorDomain = emailDomain(actor);
    if (!storedLocal || !actorLocal || storedLocal !== actorLocal) {
        return false;
    }
    return (!!storedDomain &&
        !!actorDomain &&
        NEWEAST_DOMAINS.has(storedDomain) &&
        NEWEAST_DOMAINS.has(actorDomain));
}
function collectActorEmails(actorEmail, rawUser) {
    const emails = new Set();
    const add = (value) => {
        const normalized = normalizeEmployeeEmail(value);
        if (normalized && normalized !== 'unknown') {
            emails.add(normalized);
        }
    };
    add(actorEmail);
    if (rawUser && typeof rawUser === 'object') {
        const record = rawUser;
        for (const key of ['email', 'preferred_username', 'upn', 'username']) {
            const value = record[key];
            if (typeof value === 'string')
                add(value);
        }
    }
    return [...emails];
}
function actorOwnsEmployeeEmail(storedEmail, actorEmail, rawUser) {
    const candidates = collectActorEmails(actorEmail, rawUser);
    if (!candidates.length) {
        candidates.push(...collectActorEmails(null, rawUser));
    }
    return candidates.some((candidate) => employeeEmailsMatch(storedEmail, candidate));
}
//# sourceMappingURL=employee-email.util.js.map