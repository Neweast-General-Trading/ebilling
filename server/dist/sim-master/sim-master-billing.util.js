"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBilling = calculateBilling;
function calculateBilling(packageLimit, additionalAmount = 0) {
    const limit = Number(packageLimit) || 0;
    const additional = Number(additionalAmount) || 0;
    const vatAmount = round2(limit * 0.05);
    const totalAmount = round2(limit + vatAmount + additional);
    return {
        packageLimit: limit,
        vatAmount,
        additionalAmount: additional,
        totalAmount,
    };
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
//# sourceMappingURL=sim-master-billing.util.js.map