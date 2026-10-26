"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROVAL_FROZEN_MESSAGE = void 0;
exports.isExcessApprovalFrozen = isExcessApprovalFrozen;
exports.assertExcessApprovalNotFrozen = assertExcessApprovalNotFrozen;
exports.getApprovalFreezeInfo = getApprovalFreezeInfo;
const common_1 = require("@nestjs/common");
const APPROVAL_FROZEN_MESSAGE = 'Excess approvals are closed from the 18th at 00:00 Asia/Dubai until month-end (day 17 remains open until 23:59). Pending requests will not be processed with this month\'s salary deductions and will carry forward to the next billing cycle.';
exports.APPROVAL_FROZEN_MESSAGE = APPROVAL_FROZEN_MESSAGE;
function getDubaiDayOfMonth(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        day: 'numeric',
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === 'day')?.value || 0);
}
/** Freeze starts day 18 00:00 Dubai — day 17 stays open until 23:59. */
function isExcessApprovalFrozen(date = new Date()) {
    const day = getDubaiDayOfMonth(date);
    return day >= 18;
}
function assertExcessApprovalNotFrozen() {
    if (isExcessApprovalFrozen()) {
        throw new common_1.BadRequestException(APPROVAL_FROZEN_MESSAGE);
    }
}
function getApprovalFreezeInfo(date = new Date()) {
    const frozen = isExcessApprovalFrozen(date);
    return {
        frozen,
        message: frozen ? APPROVAL_FROZEN_MESSAGE : null,
    };
}
//# sourceMappingURL=approval-freeze.util.js.map
