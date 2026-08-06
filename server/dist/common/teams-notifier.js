"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTeamsMessageSafe = sendTeamsMessageSafe;
async function sendTeamsMessageSafe(payload) {
    const teamsApi = process.env.TEAMS_API?.trim();
    if (!teamsApi || !/^https?:\/\//i.test(teamsApi)) {
        return { sent: false, skipped: true, reason: 'TEAMS_API not configured' };
    }
    try {
        const url = new URL(teamsApi);
        url.searchParams.set('Name', payload.name || '');
        url.searchParams.set('MailID', payload.MailID || '');
        url.searchParams.set('Desc', payload.Desc || '');
        const response = await fetch(url.toString(), { method: 'POST' });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            return {
                sent: false,
                skipped: false,
                reason: `Teams API ${response.status}: ${body.slice(0, 200)}`,
            };
        }
        return { sent: true, skipped: false };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { sent: false, skipped: false, reason: message };
    }
}
