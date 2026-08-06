"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractJsonObject = extractJsonObject;
function extractJsonObject(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text.trim();
    try {
        return JSON.parse(candidate);
    }
    catch {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(candidate.slice(start, end + 1));
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
//# sourceMappingURL=report-json.util.js.map