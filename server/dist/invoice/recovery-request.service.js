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
exports.RecoveryRequestService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
const teams_notifier_1 = require("../common/teams-notifier");
const invoice_service_1 = require("./invoice.service");
const recovery_teams_message_1 = require("./recovery-teams-message");

const APPROVER_EMAIL = 'olga@neweast.co';

function normalizeActorEmail(email) {
    return (0, ebilling_admin_access_1.normalizeEmail)(email);
}
function mapRequestRow(row) {
    return {
        id: String(row.id),
        invoiceId: row.invoice_id,
        co: row.co,
        status: row.status,
        displayName: row.display_name,
        personNumber: row.person_number,
        phoneNumber: row.phone_number,
        email: row.employee_email,
        monthLabel: row.month_label,
        personalUsage: Number(row.personal_usage ?? 0),
        invoiceCode: row.invoice_code,
        requestedBy: row.requested_by,
        requestedAt: row.requested_at instanceof Date ? row.requested_at.toISOString() : String(row.requested_at),
        decidedBy: row.decided_by ?? null,
        decidedAt: row.decided_at instanceof Date ? row.decided_at.toISOString() : row.decided_at ? String(row.decided_at) : null,
        rejectReason: row.reject_reason ?? null,
        oracleResult: row.oracle_recovery_ref ?? null,
    };
}
async function notifyTeams(name, mailId, desc) {
    return (0, teams_notifier_1.sendTeamsMessageSafe)({
        name,
        MailID: mailId,
        Desc: desc,
    });
}

let RecoveryRequestService = class RecoveryRequestService {
    db;
    invoiceService;
    logger = new common_1.Logger(RecoveryRequestService.name);
    constructor(db, invoiceService) {
        this.db = db;
        this.invoiceService = invoiceService;
    }
    getRole(email) {
        if ((0, ebilling_admin_access_1.isRecoveryApprover)(email))
            return 'approver';
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email))
            return 'requester';
        return null;
    }
    assertRequester(email) {
        if (!(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email)) {
            throw new common_1.ForbiddenException('Recovery requests are only available for eBilling admin accounts');
        }
    }
    assertApprover(email) {
        if (!(0, ebilling_admin_access_1.isRecoveryApprover)(email)) {
            throw new common_1.ForbiddenException('Recovery approval is only available for the configured approver account');
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
    async findActiveRequestForInvoice(invoiceId) {
        const { rows } = await this.db.query(`SELECT * FROM recovery_requests
       WHERE invoice_id = $1 AND status = 'pending'
       ORDER BY requested_at DESC
       LIMIT 1`, [invoiceId]);
        return rows[0] ? mapRequestRow(rows[0]) : null;
    }
    async findLatestRequestForInvoice(invoiceId) {
        const { rows } = await this.db.query(`SELECT * FROM recovery_requests
       WHERE invoice_id = $1
       ORDER BY requested_at DESC
       LIMIT 1`, [invoiceId]);
        return rows[0] ? mapRequestRow(rows[0]) : null;
    }
    async getOverlayForRequester(co) {
        const { rows } = await this.db.query(`SELECT * FROM recovery_requests
       WHERE co = $1
       ORDER BY requested_at DESC`, [co]);
        const byInvoiceId = {};
        for (const row of rows) {
            const key = String(row.invoice_id);
            if (byInvoiceId[key])
                continue;
            byInvoiceId[key] = {
                requestId: String(row.id),
                status: row.status,
                rejectReason: row.reject_reason ?? null,
                requestedAt: row.requested_at instanceof Date ? row.requested_at.toISOString() : String(row.requested_at),
                decidedAt: row.decided_at instanceof Date ? row.decided_at.toISOString() : row.decided_at ? String(row.decided_at) : null,
            };
        }
        return { role: 'requester', byInvoiceId };
    }
    async listPendingForApprover(co) {
        const { rows } = await this.db.query(`SELECT * FROM recovery_requests
       WHERE co = $1 AND status = 'pending'
       ORDER BY requested_at ASC`, [co]);
        return rows.map(mapRequestRow);
    }
    async getRequestOrThrow(requestId) {
        const { rows } = await this.db.query(`SELECT * FROM recovery_requests WHERE id = $1`, [requestId]);
        const row = rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Recovery request not found');
        }
        return row;
    }
    async createRequest(co, invoiceId, actor) {
        const actorEmail = normalizeActorEmail(actor?.email);
        this.assertRequester(actorEmail);
        const row = await this.loadInvoice(co, invoiceId);
        const existing = await this.findActiveRequestForInvoice(invoiceId);
        if (existing) {
            throw new common_1.BadRequestException('A recovery request is already pending for this invoice');
        }
        const latest = await this.findLatestRequestForInvoice(invoiceId);
        if (latest?.status === 'approved') {
            throw new common_1.BadRequestException('This invoice already has an approved recovery request');
        }
        const { rows } = await this.db.query(`INSERT INTO recovery_requests (
          invoice_id, co, status, requested_by,
          display_name, person_number, phone_number, employee_email,
          month_label, personal_usage, invoice_code
        ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`, [
            invoiceId,
            co,
            actorEmail,
            row.display_name,
            row.person_number,
            row.phone_number,
            row.email,
            row.month_key,
            Number(row.personal_usage ?? 0),
            row.invoice_code,
        ]);
        const request = mapRequestRow(rows[0]);
        const requesterLabel = (0, ebilling_admin_access_1.formatDisplayEmail)(actorEmail);
        const amount = Number(row.personal_usage ?? 0).toFixed(2);
        const teamsMessage = (0, recovery_teams_message_1.buildRecoveryRequestTeamsMessage)({
            co,
            requestId: request.id,
            displayName: row.display_name || row.phone_number,
            personNumber: row.person_number,
            phoneNumber: row.phone_number,
            monthLabel: row.month_key,
            amount,
            requestedBy: requesterLabel,
        });
        const teamsResult = await notifyTeams('Olga', APPROVER_EMAIL, teamsMessage);
        if (!teamsResult.sent && !teamsResult.skipped) {
            this.logger.warn(`Teams notify approver failed: ${teamsResult.reason}`);
        }
        return request;
    }
    async approveRequest(co, requestId, actor) {
        const actorEmail = normalizeActorEmail(actor?.email);
        this.assertApprover(actorEmail);
        const row = await this.getRequestOrThrow(requestId);
        if (row.co !== co) {
            throw new common_1.NotFoundException('Recovery request not found');
        }
        if (row.status !== 'pending') {
            throw new common_1.BadRequestException('Recovery request is no longer pending');
        }
        let oraclePayload;
        try {
            const result = await this.invoiceService.pushRecoveryFromWorkflow(co, row.invoice_id, actor);
            oraclePayload = result.oracle;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new common_1.BadRequestException(message);
        }
        const { rows } = await this.db.query(`UPDATE recovery_requests
       SET status = 'approved',
           decided_by = $2,
           decided_at = NOW(),
           oracle_recovery_ref = $3::jsonb
       WHERE id = $1
       RETURNING *`, [requestId, actorEmail, JSON.stringify(oraclePayload)]);
        const request = mapRequestRow(rows[0]);
        const requesterEmail = row.requested_by;
        const requesterName = requesterEmail.split('@')[0] || 'User';
        const amount = Number(row.personal_usage ?? 0).toFixed(2);
        const teamsMessage = (0, recovery_teams_message_1.buildRecoveryApprovedTeamsMessage)({
            co,
            requestId: String(requestId),
            invoiceId: row.invoice_id,
            displayName: row.display_name || row.phone_number,
            personNumber: row.person_number,
            phoneNumber: row.phone_number,
            monthLabel: row.month_label,
            amount,
            approvedBy: (0, ebilling_admin_access_1.formatDisplayEmail)(actorEmail),
        });
        const teamsResult = await notifyTeams((0, ebilling_admin_access_1.formatDisplayEmail)(requesterName), requesterEmail, teamsMessage);
        if (!teamsResult.sent && !teamsResult.skipped) {
            this.logger.warn(`Teams notify requester (approve) failed: ${teamsResult.reason}`);
        }
        return {
            ...request,
            oracleSent: true,
            message: 'Recovery sent to Oracle successfully',
        };
    }
    async rejectRequest(co, requestId, reason, actor) {
        const actorEmail = normalizeActorEmail(actor?.email);
        this.assertApprover(actorEmail);
        const trimmedReason = String(reason || '').trim();
        if (!trimmedReason) {
            throw new common_1.BadRequestException('Reject reason is required');
        }
        const row = await this.getRequestOrThrow(requestId);
        if (row.co !== co) {
            throw new common_1.NotFoundException('Recovery request not found');
        }
        if (row.status !== 'pending') {
            throw new common_1.BadRequestException('Recovery request is no longer pending');
        }
        const { rows } = await this.db.query(`UPDATE recovery_requests
       SET status = 'rejected',
           reject_reason = $2,
           decided_by = $3,
           decided_at = NOW()
       WHERE id = $1
       RETURNING *`, [requestId, trimmedReason, actorEmail]);
        const request = mapRequestRow(rows[0]);
        const requesterEmail = row.requested_by;
        const requesterName = requesterEmail.split('@')[0] || 'User';
        const amount = Number(row.personal_usage ?? 0).toFixed(2);
        const teamsMessage = (0, recovery_teams_message_1.buildRecoveryRejectedTeamsMessage)({
            co,
            requestId: String(requestId),
            invoiceId: row.invoice_id,
            displayName: row.display_name || row.phone_number,
            personNumber: row.person_number,
            phoneNumber: row.phone_number,
            monthLabel: row.month_label,
            amount,
            rejectedBy: (0, ebilling_admin_access_1.formatDisplayEmail)(actorEmail),
            reason: trimmedReason,
        });
        const teamsResult = await notifyTeams((0, ebilling_admin_access_1.formatDisplayEmail)(requesterName), requesterEmail, teamsMessage);
        if (!teamsResult.sent && !teamsResult.skipped) {
            this.logger.warn(`Teams notify requester (reject) failed: ${teamsResult.reason}`);
        }
        return request;
    }
};
exports.RecoveryRequestService = RecoveryRequestService;
exports.RecoveryRequestService = RecoveryRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        invoice_service_1.InvoiceService])
], RecoveryRequestService);
