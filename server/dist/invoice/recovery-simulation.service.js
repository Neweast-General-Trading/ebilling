"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoverySimulationService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");

const SIM_REQUESTER = 'sakour@neweast.co';
const SIM_APPROVER = 'olga@neweast.co';
const requests = new Map();
let nextId = 1;

function normalizeActorEmail(email) {
    return (0, ebilling_admin_access_1.normalizeEmail)(email);
}
function isSimulationRequester(email) {
    return normalizeActorEmail(email) === SIM_REQUESTER;
}
function isSimulationApprover(email) {
    return normalizeActorEmail(email) === SIM_APPROVER;
}
function snapshotFromRow(row) {
    return {
        invoiceId: row.id,
        co: row.co,
        displayName: row.display_name,
        personNumber: row.person_number,
        phoneNumber: row.phone_number,
        email: row.email,
        monthLabel: row.month_key,
        personalUsage: Number(row.personal_usage ?? 0),
        invoiceCode: row.invoice_code,
    };
}

let RecoverySimulationService = class RecoverySimulationService {
    db;
    constructor(db) {
        this.db = db;
    }
    getRole(email) {
        if (isSimulationRequester(email))
            return 'requester';
        if (isSimulationApprover(email))
            return 'approver';
        return null;
    }
    assertRequester(email) {
        if (!isSimulationRequester(email)) {
            throw new common_1.ForbiddenException('Recovery simulation is only available for the configured requester account');
        }
    }
    assertApprover(email) {
        if (!isSimulationApprover(email)) {
            throw new common_1.ForbiddenException('Recovery simulation approval is only available for the configured approver account');
        }
    }
    async loadInvoice(co, invoiceId) {
        const { rows } = await this.db.query(`SELECT i.*, e.co, e.person_number, e.display_name, e.phone_number, e.email,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (row.approval_status !== 'ready_for_recovery') {
            throw new common_1.BadRequestException('Invoice is not ready for recovery');
        }
        return row;
    }
    findActiveRequestForInvoice(invoiceId) {
        for (const request of requests.values()) {
            if (request.invoiceId === invoiceId && request.status === 'pending') {
                return request;
            }
        }
        return null;
    }
    findLatestRequestForInvoice(invoiceId) {
        let latest = null;
        for (const request of requests.values()) {
            if (request.invoiceId !== invoiceId)
                continue;
            if (!latest || new Date(request.requestedAt).getTime() > new Date(latest.requestedAt).getTime()) {
                latest = request;
            }
        }
        return latest;
    }
    getOverlayForRequester(co) {
        const byInvoiceId = {};
        for (const request of requests.values()) {
            if (request.co !== co)
                continue;
            byInvoiceId[String(request.invoiceId)] = {
                requestId: request.id,
                status: request.status,
                rejectReason: request.rejectReason ?? null,
                requestedAt: request.requestedAt,
                decidedAt: request.decidedAt ?? null,
            };
        }
        return { simulation: true, byInvoiceId };
    }
    listPendingForApprover(co) {
        return [...requests.values()]
            .filter((request) => request.co === co && request.status === 'pending')
            .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
    }
    async createRequest(co, invoiceId, actorEmail) {
        this.assertRequester(actorEmail);
        const row = await this.loadInvoice(co, invoiceId);
        const existing = this.findActiveRequestForInvoice(invoiceId);
        if (existing) {
            throw new common_1.BadRequestException('A recovery simulation request is already pending for this invoice');
        }
        const latest = this.findLatestRequestForInvoice(invoiceId);
        if (latest?.status === 'approved') {
            throw new common_1.BadRequestException('This invoice already completed recovery simulation');
        }
        const request = {
            id: String(nextId++),
            ...snapshotFromRow(row),
            status: 'pending',
            requestedBy: normalizeActorEmail(actorEmail),
            requestedAt: new Date().toISOString(),
            rejectReason: null,
            decidedAt: null,
            decidedBy: null,
            oracleSimulated: false,
        };
        requests.set(request.id, request);
        return request;
    }
    getRequestOrThrow(requestId) {
        const request = requests.get(String(requestId));
        if (!request) {
            throw new common_1.NotFoundException('Recovery simulation request not found');
        }
        return request;
    }
    async approveRequest(co, requestId, actorEmail) {
        this.assertApprover(actorEmail);
        const request = this.getRequestOrThrow(requestId);
        if (request.co !== co) {
            throw new common_1.NotFoundException('Recovery simulation request not found');
        }
        if (request.status !== 'pending') {
            throw new common_1.BadRequestException('Recovery simulation request is no longer pending');
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
        request.status = 'approved';
        request.decidedAt = new Date().toISOString();
        request.decidedBy = normalizeActorEmail(actorEmail);
        request.oracleSimulated = true;
        request.oracleResult = {
            simulated: true,
            action: 'recovery_done',
            message: 'Oracle recovery simulated successfully (no production data changed)',
        };
        return request;
    }
    async rejectRequest(co, requestId, reason, actorEmail) {
        this.assertApprover(actorEmail);
        const trimmedReason = String(reason || '').trim();
        if (!trimmedReason) {
            throw new common_1.BadRequestException('Reject reason is required');
        }
        const request = this.getRequestOrThrow(requestId);
        if (request.co !== co) {
            throw new common_1.NotFoundException('Recovery simulation request not found');
        }
        if (request.status !== 'pending') {
            throw new common_1.BadRequestException('Recovery simulation request is no longer pending');
        }
        request.status = 'rejected';
        request.rejectReason = trimmedReason;
        request.decidedAt = new Date().toISOString();
        request.decidedBy = normalizeActorEmail(actorEmail);
        return request;
    }
};
exports.RecoverySimulationService = RecoverySimulationService;
exports.RecoverySimulationService = RecoverySimulationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RecoverySimulationService);
