"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROVAL_FROZEN_MESSAGE = void 0;
exports.isExcessApprovalFrozen = isExcessApprovalFrozen;
exports.assertExcessApprovalNotFrozen = assertExcessApprovalNotFrozen;
exports.getApprovalFreezeInfo = getApprovalFreezeInfo;
const common_1 = require("@nestjs/common");
const APPROVAL_FROZEN_MESSAGE = 'Excess approvals are closed from the 17th of each month until month-end. No approve or reject actions are allowed during this period.';
exports.APPROVAL_FROZEN_MESSAGE = APPROVAL_FROZEN_MESSAGE;
function getDubaiDayOfMonth(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        day: 'numeric',
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === 'day')?.value || 0);
}
function isExcessApprovalFrozen(date = new Date()) {
    const day = getDubaiDayOfMonth(date);
    return day >= 17;
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
