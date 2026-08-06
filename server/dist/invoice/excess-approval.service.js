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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ExcessApprovalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcessApprovalService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
const mail_config_1 = require("../config/mail.config");
const excess_approval_email_template_1 = require("../notifications/excess-approval-email.template");
const invoice_billing_util_1 = require("./invoice-billing.util");
const invoice_service_1 = require("./invoice.service");
const teams_notifier_1 = require("../common/teams-notifier");
const recovery_teams_message_1 = require("./recovery-teams-message");
const jwt = require("jsonwebtoken");
const FINANCE_DEDUCTION_TO = 'sona.jacob@neweast.co';
const FINANCE_DEDUCTION_CC = ['info.hq@neweast.co', 'end.bill@neweast.co', 'Vinod.Kumar@neweast.co'];
const FINANCE_DEDUCTION_BCC = ['sakour@neweast.co'];
const ORACLE_IT_HELP_TO = 'it.helpdesk@neweast.co';
const ORACLE_IT_HELP_CC = ['Vinod.Kumar@neweast.co', 'sakour@neweast.co'];
const APPROVAL_AUDIT_CC = ['info.hq@neweast.co'];
const APPROVAL_AUDIT_BCC = ['sakour@neweast.co'];
function resolveMailList(emails, excludeDeliverTo) {
    const exclude = excludeDeliverTo?.trim().toLowerCase();
    return emails
        .map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo)
        .filter((address) => !exclude || address.trim().toLowerCase() !== exclude);
}
function normalizeEmail(email) {
    return (0, ebilling_admin_access_1.normalizeEmail)(email);
}
function publicBaseUrl() {
    return (process.env.EBILLING_PUBLIC_URL?.trim() ||
        process.env.PUBLIC_EBILLING_URL?.trim() ||
        'https://ebilling.neweast.cloud').replace(/\/$/, '');
}
function mapQueueRow(row) {
    const month = String(row.month_key || '').slice(0, 7);
    const packageTotal = Number(row.package_total) || 0;
    const invoiceTotal = Number(row.invoice_total) || 0;
    const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
    return {
        requestId: String(row.request_id),
        invoiceId: String(row.invoice_id),
        employee: row.display_name || row.phone_number || '—',
        month,
        monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
        packageTotal,
        invoiceTotal,
        invoiceCode: row.invoice_code || '—',
        excess: exceededAmount,
        officialUsage: Number(row.official_usage ?? 0),
        personalUsage: Number(row.personal_usage ?? 0),
        reference: row.invoice_code || '—',
        remarks: row.employee_remarks?.trim() || row.remarks?.trim() || '—',
        currentLevel: Number(row.current_level ?? 1),
    };
}
let ExcessApprovalService = ExcessApprovalService_1 = class ExcessApprovalService {
    db;
    invoiceService;
    notifications;
    logger = new common_1.Logger(ExcessApprovalService_1.name);
    constructor(db, invoiceService) {
        this.db = db;
        this.invoiceService = invoiceService;
    }
    setNotifications(notifications) {
        this.notifications = notifications;
    }
    assertSuperAdmin(email) {
        if (!(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email)) {
            throw new common_1.ForbiddenException('Excess approval settings require super admin access');
        }
    }
    assertCanSendExcessApproval(actor) {
        const email = (0, ebilling_admin_access_1.normalizeEmail)(actor?.email);
        if (!(0, ebilling_admin_access_1.canSendExcessApprovalToMatrix)(email)) {
            throw new common_1.ForbiddenException('You do not have permission to send excess approval requests');
        }
    }
    resolveUsageForMatrix(gridRow) {
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(Number(gridRow.invoice_total) || 0, Number(gridRow.package_total) || 0);
        if (exceededAmount <= 0) {
            throw new common_1.BadRequestException('Invoice has no excess');
        }
        let personal = gridRow.personal_usage != null ? Number(gridRow.personal_usage) : null;
        let official = gridRow.official_usage != null ? Number(gridRow.official_usage) : null;
        if (personal == null && official == null) {
            return { officialUsage: exceededAmount, personalUsage: 0, exceededAmount };
        }
        personal = personal ?? 0;
        official = official ?? Math.max(0, exceededAmount - personal);
        if (Math.abs(official + personal - exceededAmount) > 0.01) {
            throw new common_1.BadRequestException(`Official + personal must equal excess (AED ${exceededAmount.toFixed(2)}) for ${gridRow.phone_number || gridRow.display_name || 'invoice'}`);
        }
        return { officialUsage: official, personalUsage: personal, exceededAmount };
    }
    isEligibleForMatrixSend(gridRow) {
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(Number(gridRow.invoice_total) || 0, Number(gridRow.package_total) || 0);
        if (exceededAmount <= 0) {
            return false;
        }
        return String(gridRow.approval_status || '') !== 'pending_excess_approval';
    }
    async sendInvoiceToMatrix(co, invoiceId, actor, options = {}) {
        if (!this.invoiceService) {
            throw new common_1.InternalServerErrorException('Invoice service not available');
        }
        const gridRow = await this.invoiceService.getGridRowByInvoiceId(co, invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (!(await this.hasConfiguredMatrix(co))) {
            throw new common_1.BadRequestException('Excess approval matrix is not configured');
        }
        if (!this.isEligibleForMatrixSend(gridRow)) {
            if (gridRow.approval_status === 'pending_excess_approval') {
                throw new common_1.BadRequestException('Invoice is already pending excess approval');
            }
            throw new common_1.BadRequestException('Invoice has no excess');
        }
        const { officialUsage, personalUsage } = this.resolveUsageForMatrix(gridRow);
        const employeeRemarks = gridRow.employee_remarks?.trim() || gridRow.remarks?.trim() || null;
        await this.db.query(`UPDATE invoices
       SET personal_usage = $1,
           official_usage = $2,
           approval_submitted_at = COALESCE(approval_submitted_at, NOW())
       WHERE id = $3`, [personalUsage, officialUsage, invoiceId]);
        await this.startWorkflow(co, invoiceId, officialUsage, personalUsage, employeeRemarks, gridRow, options);
        const updatedRow = await this.invoiceService.getGridRowByInvoiceId(co, invoiceId);
        if (!updatedRow) {
            throw new common_1.NotFoundException('Invoice row not found after update');
        }
        return { row: updatedRow };
    }
    async sendBulkToMatrix(co, invoiceIds, actor) {
        this.assertCanSendExcessApproval(actor);
        if (!(await this.hasConfiguredMatrix(co))) {
            throw new common_1.BadRequestException('Excess approval matrix is not configured. Open Excess approval settings first.');
        }
        const uniqueIds = [...new Set((invoiceIds || []).map((id) => String(id)).filter(Boolean))];
        if (!uniqueIds.length) {
            throw new common_1.BadRequestException('invoiceIds is required');
        }
        const results = [];
        for (const invoiceId of uniqueIds) {
            try {
                const { row } = await this.sendInvoiceToMatrix(co, invoiceId, actor, { skipNotify: true });
                results.push({ invoiceId, success: true, row });
            }
            catch (error) {
                const message = error instanceof common_1.BadRequestException ||
                    error instanceof common_1.NotFoundException ||
                    error instanceof common_1.ForbiddenException
                    ? error.message
                    : error instanceof Error
                        ? error.message
                        : 'Could not send to excess approval';
                results.push({ invoiceId, success: false, error: message });
            }
        }
        const sent = results.filter((item) => item.success).length;
        if (sent > 0) {
            await this.notifyLevelApprovers(co, 1, { newRequestsCount: sent });
        }
        return {
            sent,
            failed: results.filter((item) => !item.success).length,
            results,
        };
    }
    async getSettings(co) {
        const { rows: levels } = await this.db.query(`SELECT id, level_order FROM excess_approval_levels WHERE co = $1 ORDER BY level_order ASC`, [co]);
        const levelIds = levels.map((l) => l.id);
        let approvers = [];
        if (levelIds.length) {
            const { rows } = await this.db.query(`SELECT level_id, email FROM excess_approval_level_approvers WHERE level_id = ANY($1::int[]) ORDER BY email ASC`, [levelIds]);
            approvers = rows;
        }
        return {
            levels: levels.map((level) => ({
                id: String(level.id),
                levelOrder: Number(level.level_order),
                approvers: approvers
                    .filter((a) => a.level_id === level.id)
                    .map((a) => (0, ebilling_admin_access_1.formatDisplayEmail)(String(a.email))),
            })),
        };
    }
    async saveSettings(co, payload, actorEmail) {
        const levels = Array.isArray(payload?.levels) ? payload.levels : [];
        if (!levels.length) {
            await this.db.query(`DELETE FROM excess_approval_levels WHERE co = $1`, [co]);
            return this.getSettings(co);
        }
        await this.db.withTransaction(async (client) => {
            await client.query(`DELETE FROM excess_approval_levels WHERE co = $1`, [co]);
            for (let i = 0; i < levels.length; i++) {
                const levelOrder = i + 1;
                const emails = Array.isArray(levels[i]?.approvers) ? levels[i].approvers : [];
                const uniqueEmails = [...new Set(emails.map((e) => normalizeEmail(String(e))).filter(Boolean))];
                if (!uniqueEmails.length) {
                    throw new common_1.BadRequestException(`Level ${levelOrder} must have at least one approver email`);
                }
                const inserted = await client.query(`INSERT INTO excess_approval_levels (co, level_order) VALUES ($1, $2) RETURNING id`, [co, levelOrder]);
                const levelId = inserted.rows[0].id;
                for (const email of uniqueEmails) {
                    if (!(0, ebilling_admin_access_1.isCorporateEbillingEmail)(email)) {
                        throw new common_1.BadRequestException(`Approver email must be @neweast.co or @neweast.com (${email})`);
                    }
                    await client.query(`INSERT INTO excess_approval_level_approvers (level_id, email) VALUES ($1, $2)`, [levelId, email]);
                    await client.query(`INSERT INTO excess_approval_approver_access (co, email, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (co, email) DO UPDATE SET updated_at = NOW()`, [co, email]);
                }
            }
        });
        return this.getSettings(co);
    }
    async hasConfiguredMatrix(co) {
        const { rows } = await this.db.query(`SELECT 1 FROM excess_approval_levels WHERE co = $1 LIMIT 1`, [co]);
        return rows.length > 0;
    }
    async getMaxLevel(co) {
        const { rows } = await this.db.query(`SELECT COALESCE(MAX(level_order), 0)::int AS max_level FROM excess_approval_levels WHERE co = $1`, [co]);
        return Number(rows[0]?.max_level ?? 0);
    }
    async getLevelApprovers(co, levelOrder) {
        const { rows } = await this.db.query(`SELECT a.email
       FROM excess_approval_level_approvers a
       INNER JOIN excess_approval_levels l ON l.id = a.level_id
       WHERE l.co = $1 AND l.level_order = $2
       ORDER BY a.email ASC`, [co, levelOrder]);
        return rows.map((r) => normalizeEmail(String(r.email))).filter(Boolean);
    }
    async getApproverAccessToken(co, email) {
        const normalized = normalizeEmail(email);
        const { rows } = await this.db.query(`SELECT access_token FROM excess_approval_approver_access WHERE co = $1 AND email = $2`, [co, normalized]);
        return rows[0]?.access_token ? String(rows[0].access_token) : null;
    }
    async resolveAccessContext(token) {
        const { rows } = await this.db.query(`SELECT co, email FROM excess_approval_approver_access WHERE access_token = $1::uuid`, [token]);
        const row = rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invalid approval link');
        }
        return { co: String(row.co), email: normalizeEmail(String(row.email)) };
    }
    async getApproverLevel(co, email) {
        const { rows } = await this.db.query(`SELECT l.level_order
       FROM excess_approval_level_approvers a
       INNER JOIN excess_approval_levels l ON l.id = a.level_id
       WHERE l.co = $1 AND LOWER(a.email) = LOWER($2)
       ORDER BY l.level_order ASC`, [co, email]);
        return rows.map((r) => Number(r.level_order));
    }
    parseOptionalViewerEmail(authorization) {
        if (!authorization?.startsWith('Bearer '))
            return null;
        try {
            const secret = process.env.APP_JWT_SECRET;
            if (!secret)
                return null;
            const decoded = jwt.verify(authorization.split(' ')[1], secret);
            return normalizeEmail(decoded?.email || decoded?.preferred_username);
        }
        catch {
            return null;
        }
    }
    async assertCanActAsTokenOwner(token, viewerEmail) {
        const { co, email } = await this.resolveAccessContext(token);
        const viewer = normalizeEmail(viewerEmail);
        if (viewer && viewer !== email) {
            throw new common_1.ForbiddenException('This approval link is read-only for your account');
        }
        return { co, email };
    }
    async listQueueForToken(token, viewerEmail) {
        const { co, email } = await this.resolveAccessContext(token);
        const approverLevels = await this.getApproverLevel(co, email);
        if (!approverLevels.length) {
            return { co, approverEmail: email, levelOrder: null, totalLevels: 0, rows: [], canAct: false, readOnly: true };
        }
        const viewer = normalizeEmail(viewerEmail);
        const canAct = !viewer || viewer === email;
        const totalLevels = await this.getMaxLevel(co);
        const { rows } = await this.db.query(`SELECT
        ear.id AS request_id,
        ear.invoice_id,
        ear.current_level,
        ear.official_usage,
        ear.personal_usage,
        i.invoice_code,
        i.amount_due AS invoice_total,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        e.display_name,
        e.phone_number,
        r.employee_remarks,
        r.remarks
       FROM excess_approval_requests ear
       INNER JOIN invoices i ON i.id = ear.invoice_id
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       WHERE ear.co = $1
         AND ear.status = 'pending'
         AND ear.current_level = ANY($2::int[])
       ORDER BY ear.submitted_at ASC`, [co, approverLevels]);
        const levelOrder = approverLevels.length === 1 ? approverLevels[0] : null;
        return {
            co,
            approverEmail: email,
            levelOrder,
            totalLevels,
            rows: rows.map(mapQueueRow),
            canAct,
            readOnly: !canAct,
        };
    }
    async notifyLevelApprovers(co, levelOrder, context) {
        const approvers = await this.getLevelApprovers(co, levelOrder);
        const totalLevels = await this.getMaxLevel(co);
        const { rows } = await this.db.query(`SELECT COUNT(*)::int AS cnt FROM excess_approval_requests
       WHERE co = $1 AND status = 'pending' AND current_level = $2`, [co, levelOrder]);
        const pendingCount = Number(rows[0]?.cnt ?? 0);
        if (!pendingCount || !approvers.length)
            return;
        for (const email of approvers) {
            const accessToken = await this.getApproverAccessToken(co, email);
            const approvalUrl = (0, recovery_teams_message_1.buildExcessApprovalRequestUrl)(co, accessToken);
            const { subject, html } = (0, excess_approval_email_template_1.buildExcessApproverNotificationEmail)({
                approverName: (0, ebilling_admin_access_1.formatDisplayEmail)(email),
                levelOrder,
                totalLevels,
                pendingCount,
                approvalUrl,
                newRequestsCount: context?.newRequestsCount ?? null,
                co,
            });
            const { deliverTo } = (0, mail_config_1.resolveMailRecipient)(email);
            await (0, mail_config_1.sendMail)({
                to: deliverTo,
                cc: resolveMailList(APPROVAL_AUDIT_CC, deliverTo),
                bcc: resolveMailList(APPROVAL_AUDIT_BCC, deliverTo),
                subject,
                html,
            });
            const teamsDesc = (0, recovery_teams_message_1.buildExcessApprovalRequestTeamsMessage)({
                co,
                approverEmail: (0, ebilling_admin_access_1.formatDisplayEmail)(email),
                levelOrder,
                totalLevels,
                pendingCount,
                employeeName: context?.employeeName ?? null,
                monthLabel: context?.monthLabel ?? null,
                excessAmount: context?.excessAmount ?? null,
                accessToken,
            });
            await (0, teams_notifier_1.sendTeamsMessageSafe)({
                name: `Excess approval L${levelOrder}`,
                MailID: email,
                Desc: teamsDesc,
            });
        }
    }
    async resetWorkflow(co, invoiceId) {
        await this.db.query(`DELETE FROM excess_approval_level_decisions
       WHERE request_id IN (
         SELECT id FROM excess_approval_requests WHERE invoice_id = $1 AND co = $2
       )`, [invoiceId, co]);
        await this.db.query(`DELETE FROM excess_approval_requests WHERE invoice_id = $1 AND co = $2`, [invoiceId, co]);
    }
    async startWorkflow(co, invoiceId, officialUsage, personalUsage, employeeRemarks, gridRow, options = {}) {
        const maxLevel = await this.getMaxLevel(co);
        if (maxLevel <= 0) {
            return { usedMatrix: false };
        }
        await this.db.query(`INSERT INTO excess_approval_requests
       (invoice_id, co, status, current_level, official_usage, personal_usage, employee_remarks)
       VALUES ($1, $2, 'pending', 1, $3, $4, $5)
       ON CONFLICT (invoice_id) DO UPDATE SET
         status = 'pending',
         current_level = 1,
         official_usage = EXCLUDED.official_usage,
         personal_usage = EXCLUDED.personal_usage,
         employee_remarks = EXCLUDED.employee_remarks,
         submitted_at = NOW(),
         rejected_by = NULL,
         reject_reason = NULL,
         rejected_at = NULL,
         completed_at = NULL,
         oracle_recovery_ref = NULL`, [invoiceId, co, officialUsage, personalUsage, employeeRemarks]);
        await this.db.query(`UPDATE invoices SET approval_status = 'pending_excess_approval' WHERE id = $1`, [invoiceId]);
        if (!options.skipNotify) {
            await this.notifyLevelApprovers(co, 1, {
                employeeName: gridRow?.display_name ?? null,
                monthLabel: gridRow?.month_label ?? gridRow?.month ?? null,
                excessAmount: gridRow?.exceeded_amount ?? null,
                newRequestsCount: 1,
            });
        }
        return { usedMatrix: true, maxLevel };
    }
    async recordDecision(requestId, levelOrder, approverEmail, action, rejectReason) {
        await this.db.query(`INSERT INTO excess_approval_level_decisions
       (request_id, level_order, approver_email, action, reject_reason)
       VALUES ($1, $2, $3, $4, $5)`, [requestId, levelOrder, approverEmail, action, rejectReason || null]);
    }
    async completeApproval(co, requestId, approverEmail) {
        const { rows } = await this.db.query(`SELECT ear.*, i.id AS inv_id,
        i.approval_status AS inv_approval_status,
        i.recovery_status AS inv_recovery_status,
        i.oracle_recovery_ref AS inv_oracle_recovery_ref,
        e.person_number, e.display_name, e.phone_number, e.email,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.invoice_code, i.amount_due AS invoice_total,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total
       FROM excess_approval_requests ear
       INNER JOIN invoices i ON i.id = ear.invoice_id
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE ear.id = $1 AND ear.co = $2`, [requestId, co]);
        const req = rows[0];
        if (!req) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        if (req.status === 'approved') {
            const gridRow = await this.invoiceService.getGridRowByInvoiceId(co, String(req.invoice_id));
            return {
                gridRow,
                finalStatus: Number(req.personal_usage ?? 0) > 0 ? 'recovery_sent' : 'confirmed_by_user',
                oracleResult: req.oracle_recovery_ref ?? req.inv_oracle_recovery_ref ?? null,
            };
        }
        const personalUsage = Number(req.personal_usage ?? 0);
        const officialUsage = Number(req.official_usage ?? 0);
        const invoiceId = String(req.invoice_id);
        if (personalUsage <= 0) {
            await this.db.query(`UPDATE invoices
         SET approval_status = 'confirmed_by_user',
             personal_usage = $1,
             official_usage = $2,
             recovery_status = NULL,
             recovery_last_error = NULL,
             approval_submitted_at = COALESCE(approval_submitted_at, NOW())
         WHERE id = $3`, [personalUsage, officialUsage, invoiceId]);
            await this.db.query(`UPDATE excess_approval_requests
       SET status = 'approved', completed_at = NOW(), oracle_recovery_ref = NULL
       WHERE id = $1`, [requestId]);
            const gridRow = await this.invoiceService.getGridRowByInvoiceId(co, invoiceId);
            return {
                gridRow,
                finalStatus: 'confirmed_by_user',
                oracleResult: null,
                skippedOracle: true,
            };
        }
        let oracleResult = null;
        let finalStatus = 'ready_for_recovery';
        let manualOracle = false;
        if (!this.invoiceService) {
            throw new common_1.InternalServerErrorException('Invoice service not available');
        }
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(Number(req.invoice_total), Number(req.package_total));
        const monthLabel = (0, invoice_billing_util_1.formatBillingMonthLabel)(String(req.month_key || '').slice(0, 7));
        let approverDecisions = [];
        try {
            const { rows: decisionRows } = await this.db.query(`SELECT level_order, approver_email, decided_at
           FROM excess_approval_level_decisions
           WHERE request_id = $1 AND action = 'approved'
           ORDER BY level_order ASC, decided_at ASC`, [requestId]);
            approverDecisions = decisionRows;
        }
        catch (err) {
            console.error(`[ExcessApproval] Failed to load approver decisions for request ${requestId}:`, err);
        }
        const approverPayload = approverDecisions.map((row) => ({
            levelOrder: Number(row.level_order),
            approverEmail: String(row.approver_email),
            decidedAt: row.decided_at,
        }));
        await this.db.query(`UPDATE invoices
         SET personal_usage = $1,
             official_usage = $2,
             approval_submitted_at = COALESCE(approval_submitted_at, NOW())
         WHERE id = $3`, [personalUsage, officialUsage, invoiceId]);
        await this.db.query(`UPDATE excess_approval_requests
       SET status = 'approved', completed_at = NOW(), oracle_recovery_ref = NULL
       WHERE id = $1`, [requestId]);
        const alreadySent = req.inv_approval_status === 'recovery_sent' &&
            (req.inv_recovery_status === 'sent' || req.inv_recovery_status === 'processing') &&
            req.inv_oracle_recovery_ref;
        if (alreadySent) {
            oracleResult = req.inv_oracle_recovery_ref;
            finalStatus = 'recovery_sent';
            const oracleRefJson = typeof oracleResult === 'string' ? oracleResult : JSON.stringify(oracleResult);
            await this.db.query(`UPDATE excess_approval_requests SET oracle_recovery_ref = $2::jsonb WHERE id = $1`, [requestId, oracleRefJson]);
        }
        else {
            await this.db.query(`UPDATE invoices
           SET approval_status = 'ready_for_recovery',
               recovery_status = 'pending',
               recovery_last_error = NULL
           WHERE id = $1`, [invoiceId]);
            const eligibility = await this.invoiceService.assessOracleOdEligibility(co, invoiceId, personalUsage);
            if (eligibility.eligible) {
                const push = await this.invoiceService.tryPushRecoveryFromWorkflow(co, invoiceId, {
                    email: approverEmail,
                    name: (0, ebilling_admin_access_1.formatDisplayEmail)(approverEmail),
                });
                if (push.success) {
                    oracleResult = push.oracle;
                    finalStatus = 'recovery_sent';
                    const oracleRefJson = oracleResult
                        ? (typeof oracleResult === 'string' ? oracleResult : JSON.stringify(oracleResult))
                        : null;
                    await this.db.query(`UPDATE excess_approval_requests SET oracle_recovery_ref = $2::jsonb WHERE id = $1`, [requestId, oracleRefJson]);
                    try {
                        await this.sendFinanceNotification({
                            gridRow: push.row || (await this.invoiceService.getGridRowByInvoiceId(co, invoiceId)),
                            exceededAmount,
                            officialUsage,
                            personalUsage,
                            oracleResult,
                            approverEmail,
                        });
                    }
                    catch (err) {
                        console.error(`[ExcessApproval] Finance notification failed for request ${requestId}:`, err);
                    }
                    try {
                        await this.sendApproversCompletionEmail({
                            requestId,
                            invoiceCode: req.invoice_code,
                            employeeName: req.display_name,
                            phoneNumber: req.phone_number,
                            monthLabel,
                            personalUsage,
                            officialUsage,
                            exceededAmount,
                            oracleResult,
                            approverEmail,
                            approvers: approverPayload,
                        });
                    }
                    catch (err) {
                        console.error(`[ExcessApproval] Approver completion email failed for request ${requestId}:`, err);
                    }
                    try {
                        await this.invoiceService.sendEmployeeDeductionConfirmationEmail(co, invoiceId);
                    }
                    catch (err) {
                        console.error(`[ExcessApproval] Employee deduction email failed for request ${requestId}:`, err);
                    }
                }
                else {
                    manualOracle = true;
                    finalStatus = 'ready_for_recovery';
                    await this.db.query(`UPDATE invoices
             SET recovery_status = 'failed',
                 recovery_last_error = $1,
                 recovery_last_attempt_at = NOW()
             WHERE id = $2`, [push.error || 'Oracle recovery push failed', invoiceId]);
                    try {
                        await this.sendOracleManualRequiredEmail({
                            requestId,
                            invoiceCode: req.invoice_code,
                            employeeName: req.display_name,
                            phoneNumber: req.phone_number,
                            personNumber: eligibility.personNumber || req.person_number,
                            monthLabel,
                            exceededAmount,
                            officialUsage,
                            personalUsage,
                            approverEmail,
                            oracleError: push.error || 'Oracle recovery push failed after eligibility check',
                            approvers: approverPayload,
                        });
                    }
                    catch (err) {
                        console.error(`[ExcessApproval] Manual Oracle email failed for request ${requestId}:`, err);
                    }
                }
            }
            else {
                manualOracle = true;
                finalStatus = 'ready_for_recovery';
                const manualReason = eligibility.reason ||
                    'Other Deduction field is not eligible or does not match Oracle for this employee';
                await this.db.query(`UPDATE invoices
           SET recovery_status = 'failed',
               recovery_last_error = $1,
               recovery_last_attempt_at = NOW()
           WHERE id = $2`, [manualReason, invoiceId]);
                try {
                    await this.sendOracleManualRequiredEmail({
                        requestId,
                        invoiceCode: req.invoice_code,
                        employeeName: req.display_name,
                        phoneNumber: req.phone_number,
                        personNumber: eligibility.personNumber || req.person_number,
                        monthLabel,
                        exceededAmount,
                        officialUsage,
                        personalUsage,
                        approverEmail,
                        oracleError: manualReason,
                        approvers: approverPayload,
                    });
                }
                catch (err) {
                    console.error(`[ExcessApproval] Manual Oracle email failed for request ${requestId}:`, err);
                }
            }
        }
        if (alreadySent) {
            try {
                await this.sendFinanceNotification({
                    gridRow: await this.invoiceService.getGridRowByInvoiceId(co, invoiceId),
                    exceededAmount,
                    officialUsage,
                    personalUsage,
                    oracleResult,
                    approverEmail,
                });
            }
            catch (err) {
                console.error(`[ExcessApproval] Finance notification failed for request ${requestId}:`, err);
            }
            try {
                await this.sendApproversCompletionEmail({
                    requestId,
                    invoiceCode: req.invoice_code,
                    employeeName: req.display_name,
                    phoneNumber: req.phone_number,
                    monthLabel,
                    personalUsage,
                    officialUsage,
                    exceededAmount,
                    oracleResult,
                    approverEmail,
                    approvers: approverPayload,
                });
            }
            catch (err) {
                console.error(`[ExcessApproval] Approver completion email failed for request ${requestId}:`, err);
            }
            try {
                await this.invoiceService.sendEmployeeDeductionConfirmationEmail(co, invoiceId);
            }
            catch (err) {
                console.error(`[ExcessApproval] Employee deduction email failed for request ${requestId}:`, err);
            }
        }
        const gridRow = await this.invoiceService.getGridRowByInvoiceId(co, invoiceId);
        return { gridRow, finalStatus, oracleResult, manualOracle, skippedOracle: false };
    }
    async sendApproversCompletionEmail(params) {
        const entryId = (0, invoice_billing_util_1.extractOracleEntryId)(params.oracleResult);
        const { subject, html } = (0, excess_approval_email_template_1.buildExcessCompletedApproversEmail)({
            requestId: params.requestId,
            invoiceCode: params.invoiceCode,
            employeeName: params.employeeName,
            phoneNumber: params.phoneNumber,
            monthLabel: params.monthLabel,
            personalUsage: params.personalUsage,
            officialUsage: params.officialUsage,
            exceededAmount: params.exceededAmount,
            oracleEntryId: entryId ? String(entryId) : null,
            finalApproverEmail: params.approverEmail,
            approvers: params.approvers || [],
        });
        const { deliverTo: to } = (0, mail_config_1.resolveMailRecipient)('info.hq@neweast.co');
        const cc = resolveMailList(APPROVAL_AUDIT_CC, to);
        const bcc = resolveMailList(APPROVAL_AUDIT_BCC, to);
        await (0, mail_config_1.sendMail)({ to, cc, bcc, subject, html });
    }
    async sendFinanceNotification(params) {
        const entryId = (0, invoice_billing_util_1.extractOracleEntryId)(params.oracleResult);
        const { subject, html } = (0, excess_approval_email_template_1.buildExcessApprovedFinanceEmail)({
            employeeName: params.gridRow?.display_name || 'Employee',
            phoneNumber: params.gridRow?.phone_number,
            monthLabel: params.gridRow?.month_label || params.gridRow?.month,
            invoiceCode: params.gridRow?.invoice_code,
            exceededAmount: params.exceededAmount,
            officialUsage: params.officialUsage,
            personalUsage: params.personalUsage,
            oracleEntryId: entryId ? String(entryId) : '—',
            approverEmail: params.approverEmail,
        });
        const { deliverTo } = (0, mail_config_1.resolveMailRecipient)(FINANCE_DEDUCTION_TO);
        const cc = FINANCE_DEDUCTION_CC.map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo);
        const bcc = FINANCE_DEDUCTION_BCC.map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo);
        await (0, mail_config_1.sendMail)({
            to: deliverTo,
            cc,
            bcc,
            subject,
            html,
        });
    }
    async sendOracleManualRequiredEmail(params) {
        const { subject, html } = (0, excess_approval_email_template_1.buildExcessOracleManualRequiredEmail)({
            employeeName: params.employeeName,
            phoneNumber: params.phoneNumber,
            personNumber: params.personNumber,
            monthLabel: params.monthLabel,
            invoiceCode: params.invoiceCode,
            exceededAmount: params.exceededAmount,
            officialUsage: params.officialUsage,
            personalUsage: params.personalUsage,
            approverEmail: params.approverEmail,
            oracleError: params.oracleError,
            approvers: params.approvers || [],
        });
        const { deliverTo } = (0, mail_config_1.resolveMailRecipient)(FINANCE_DEDUCTION_TO);
        const cc = FINANCE_DEDUCTION_CC.map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo);
        const bcc = FINANCE_DEDUCTION_BCC.map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo);
        await (0, mail_config_1.sendMail)({
            to: deliverTo,
            cc,
            bcc,
            subject,
            html,
        });
    }
    async rejectRequest(co, requestId, approverEmail, reason) {
        const trimmed = reason?.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Rejection reason is required');
        }
        await this.db.query(`UPDATE excess_approval_requests
       SET status = 'rejected',
           rejected_by = $2,
           reject_reason = $3,
           rejected_at = NOW(),
           completed_at = NOW()
       WHERE id = $1 AND co = $4 AND status = 'pending'`, [requestId, approverEmail, trimmed, co]);
        const { rows } = await this.db.query(`SELECT invoice_id FROM excess_approval_requests WHERE id = $1`, [requestId]);
        const invoiceId = rows[0]?.invoice_id;
        if (invoiceId) {
            await this.db.query(`UPDATE invoices SET approval_status = 'excess_rejected' WHERE id = $1`, [invoiceId]);
        }
    }
    async approveItems(token, invoiceIds, actorEmailOverride, viewerEmail) {
        await this.assertCanActAsTokenOwner(token, viewerEmail);
        const { co, email } = await this.resolveAccessContext(token);
        const approverEmail = actorEmailOverride || email;
        const approverLevels = await this.getApproverLevel(co, approverEmail);
        if (!approverLevels.length) {
            throw new common_1.ForbiddenException('You are not configured as an excess approver');
        }
        const ids = [...new Set((invoiceIds || []).map((id) => String(id)))];
        if (!ids.length) {
            throw new common_1.BadRequestException('Select at least one invoice');
        }
        const results = [];
        for (const invoiceId of ids) {
            const { rows } = await this.db.query(`SELECT ear.*
         FROM excess_approval_requests ear
         WHERE ear.co = $1 AND ear.invoice_id = $2 AND ear.status = 'pending'`, [co, invoiceId]);
            const req = rows[0];
            if (!req || !approverLevels.includes(Number(req.current_level))) {
                continue;
            }
            await this.recordDecision(req.id, req.current_level, approverEmail, 'approved', null);
            const maxLevel = await this.getMaxLevel(co);
            if (Number(req.current_level) < maxLevel) {
                const nextLevel = Number(req.current_level) + 1;
                await this.db.query(`UPDATE excess_approval_requests SET current_level = $2 WHERE id = $1`, [req.id, nextLevel]);
                await this.notifyLevelApprovers(co, nextLevel, {
                    employeeName: null,
                    monthLabel: null,
                    excessAmount: null,
                });
                results.push({ invoiceId, status: 'advanced', nextLevel });
            }
            else {
                try {
                    const completed = await this.completeApproval(co, req.id, approverEmail);
                    results.push({
                        invoiceId,
                        status: 'completed',
                        row: completed.gridRow,
                        skippedOracle: !!completed.skippedOracle,
                        manualOracle: !!completed.manualOracle,
                    });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Excess approval failed for invoice ${invoiceId}: ${message}`);
                    results.push({ invoiceId, status: 'failed', error: message });
                }
            }
        }
        return { results };
    }
    async rejectItems(token, invoiceIds, reason, viewerEmail) {
        await this.assertCanActAsTokenOwner(token, viewerEmail);
        const { co, email } = await this.resolveAccessContext(token);
        const approverLevels = await this.getApproverLevel(co, email);
        const ids = [...new Set((invoiceIds || []).map((id) => String(id)))];
        if (!ids.length) {
            throw new common_1.BadRequestException('Select at least one invoice');
        }
        for (const invoiceId of ids) {
            const { rows } = await this.db.query(`SELECT ear.*
         FROM excess_approval_requests ear
         WHERE ear.co = $1 AND ear.invoice_id = $2 AND ear.status = 'pending'`, [co, invoiceId]);
            const req = rows[0];
            if (!req || !approverLevels.includes(Number(req.current_level)))
                continue;
            await this.recordDecision(req.id, req.current_level, email, 'rejected', reason);
            await this.rejectRequest(co, req.id, email, reason);
        }
        return { success: true };
    }
    async listQueueForActor(co, actorEmail) {
        const email = normalizeEmail(actorEmail);
        if (!email) {
            throw new common_1.BadRequestException('Signed-in email is required');
        }
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        const token = await this.getApproverAccessToken(co, email);
        if (!token) {
            return {
                co,
                approverEmail: email,
                levelOrder: null,
                totalLevels: await this.getMaxLevel(co),
                rows: [],
                approvalUrl: null,
                canAct: false,
                readOnly: true,
            };
        }
        const approverLevels = await this.getApproverLevel(co, email);
        const queue = await this.listQueueForToken(token, email);
        return {
            ...queue,
            approvalUrl: (0, recovery_teams_message_1.buildExcessApprovalRequestUrl)(co, token),
            canAct: approverLevels.length > 0 && queue.canAct === true,
            readOnly: !(approverLevels.length > 0 && queue.canAct === true),
        };
    }
    async approveForActor(co, actorEmail, invoiceIds) {
        const email = normalizeEmail(actorEmail);
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        const token = await this.getApproverAccessToken(co, email);
        if (!token) {
            throw new common_1.ForbiddenException('You are not configured as an excess approver');
        }
        return this.approveItems(token, invoiceIds, undefined, email);
    }
    async rejectForActor(co, actorEmail, invoiceIds, reason) {
        const email = normalizeEmail(actorEmail);
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        const token = await this.getApproverAccessToken(co, email);
        if (!token) {
            throw new common_1.ForbiddenException('You are not configured as an excess approver');
        }
        return this.rejectItems(token, invoiceIds, reason, email);
    }
    parseInvoiceIdList(raw) {
        const values = Array.isArray(raw)
            ? raw
            : String(raw || '').split(',');
        return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
    }
    async assertInvoiceIdsInApprovalWorkflow(co, invoiceIds) {
        const ids = this.parseInvoiceIdList(invoiceIds);
        if (!ids.length) {
            throw new common_1.BadRequestException('invoiceIds is required');
        }
        const { rows } = await this.db.query(`SELECT DISTINCT ear.invoice_id::text AS invoice_id
       FROM excess_approval_requests ear
       WHERE ear.co = $1 AND ear.invoice_id = ANY($2::bigint[])`, [co, ids]);
        const allowed = new Set(rows.map((row) => row.invoice_id));
        const missing = ids.filter((id) => !allowed.has(id));
        if (missing.length) {
            throw new common_1.ForbiddenException('One or more invoices are not part of the approval workflow');
        }
        return ids;
    }
    async getDeductionStatusForInvoices(co, invoiceIds, actorEmail) {
        const email = normalizeEmail(actorEmail);
        if (!email || !(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        const ids = await this.assertInvoiceIdsInApprovalWorkflow(co, invoiceIds);
        if (!this.invoiceService) {
            throw new common_1.InternalServerErrorException('Invoice service not available');
        }
        return this.invoiceService.getOracleOtherDeductionStatusBatch(co, ids);
    }
    async getDeductionStatusForToken(token, invoiceIds, viewerEmail) {
        await this.assertCanActAsTokenOwner(token, viewerEmail);
        const { co } = await this.resolveAccessContext(token);
        const ids = await this.assertInvoiceIdsInApprovalWorkflow(co, invoiceIds);
        if (!this.invoiceService) {
            throw new common_1.InternalServerErrorException('Invoice service not available');
        }
        return this.invoiceService.getOracleOtherDeductionStatusBatch(co, ids);
    }
    async listAllRequestsForAdmin(co, actor) {
        if (!(0, ebilling_admin_access_1.canTrackExcessApprovalRequests)(actor?.email)) {
            throw new common_1.ForbiddenException('You do not have access to view all approval requests');
        }
        return this.listAllRequests(co);
    }
    async listAllRequests(co) {
        const totalLevels = await this.getMaxLevel(co);
        const { rows } = await this.db.query(`SELECT
        ear.id AS request_id,
        ear.invoice_id,
        ear.status AS request_status,
        ear.current_level,
        ear.official_usage,
        ear.personal_usage,
        ear.submitted_at,
        ear.completed_at,
        ear.rejected_by,
        ear.reject_reason,
        i.approval_status,
        i.invoice_code,
        i.amount_due AS invoice_total,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        e.display_name,
        e.phone_number,
        r.employee_remarks,
        r.remarks
       FROM excess_approval_requests ear
       INNER JOIN invoices i ON i.id = ear.invoice_id
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       WHERE ear.co = $1
       ORDER BY ear.submitted_at DESC`, [co]);
        if (!rows.length) {
            return { co, totalLevels, rows: [] };
        }
        const requestIds = rows.map((row) => Number(row.request_id));
        const { rows: levelRows } = await this.db.query(`SELECT l.level_order, a.email
       FROM excess_approval_levels l
       INNER JOIN excess_approval_level_approvers a ON a.level_id = l.id
       WHERE l.co = $1
       ORDER BY l.level_order ASC, a.email ASC`, [co]);
        const { rows: decisionRows } = await this.db.query(`SELECT request_id, level_order, approver_email, action, decided_at
       FROM excess_approval_level_decisions
       WHERE request_id = ANY($1::int[])
       ORDER BY level_order ASC, decided_at ASC`, [requestIds]);
        const levelsByOrder = new Map();
        for (const row of levelRows) {
            const order = Number(row.level_order);
            if (!levelsByOrder.has(order)) {
                levelsByOrder.set(order, []);
            }
            levelsByOrder.get(order).push(normalizeEmail(String(row.email)));
        }
        const decisionsByRequest = new Map();
        for (const row of decisionRows) {
            const key = Number(row.request_id);
            if (!decisionsByRequest.has(key)) {
                decisionsByRequest.set(key, []);
            }
            decisionsByRequest.get(key).push({
                levelOrder: Number(row.level_order),
                approverEmail: normalizeEmail(String(row.approver_email)),
                action: String(row.action || ''),
                decidedAt: row.decided_at,
            });
        }
        const mappedRows = rows.map((row) => {
            const requestId = Number(row.request_id);
            const requestStatus = String(row.request_status || 'pending');
            const currentLevel = Number(row.current_level ?? 1);
            const decisions = decisionsByRequest.get(requestId) || [];
            const levels = [];
            for (let levelOrder = 1; levelOrder <= totalLevels; levelOrder += 1) {
                const approverEmails = levelsByOrder.get(levelOrder) || [];
                const levelDecisions = decisions.filter((item) => item.levelOrder === levelOrder);
                const approvedBy = levelDecisions.find((item) => item.action === 'approved') || null;
                const rejectedBy = levelDecisions.find((item) => item.action === 'rejected') || null;
                let status = 'pending';
                if (requestStatus === 'rejected' && rejectedBy && rejectedBy.levelOrder === levelOrder) {
                    status = 'rejected';
                }
                else if (approvedBy) {
                    status = 'approved';
                }
                else if (requestStatus === 'pending' && currentLevel === levelOrder) {
                    status = 'current';
                }
                else if (requestStatus === 'approved' && levelOrder <= totalLevels) {
                    status = levelOrder < totalLevels || approvedBy ? 'approved' : 'approved';
                }
                levels.push({
                    levelOrder,
                    status,
                    approvers: approverEmails.map((email) => {
                        const decision = levelDecisions.find((item) => item.approverEmail === email) || null;
                        return {
                            email,
                            decision: decision?.action || null,
                            decidedAt: decision?.decidedAt || null,
                        };
                    }),
                    approvedBy: approvedBy?.approverEmail || null,
                    rejectedBy: rejectedBy?.approverEmail || null,
                });
            }
            const queueRow = mapQueueRow(row);
            return {
                ...queueRow,
                requestStatus,
                currentLevel,
                submittedAt: row.submitted_at,
                completedAt: row.completed_at,
                rejectedBy: row.rejected_by || null,
                rejectReason: row.reject_reason || null,
                approvalStatus: String(row.approval_status || ''),
                levels,
            };
        });
        return { co, totalLevels, rows: mappedRows };
    }
    finalStatusLabel(row) {
        if (row.requestStatus === 'rejected') {
            return 'Rejected';
        }
        if (row.requestStatus === 'approved') {
            return 'Approved';
        }
        return row.currentLevel ? `On progress · L${row.currentLevel}` : 'On progress';
    }
    async listHistoryForActor(co, actorEmail) {
        const email = normalizeEmail(actorEmail);
        if (!email) {
            return { co, approverEmail: '', rows: [] };
        }
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        const [all, queue, actorLevels] = await Promise.all([
            this.listAllRequests(co),
            this.listQueueForActor(co, email),
            this.getApproverLevel(co, email),
        ]);
        const pendingIds = new Set((queue.rows || []).map((row) => String(row.invoiceId)));
        const levelSet = new Set(actorLevels);
        const rows = (all.rows || [])
            .filter((row) => {
            if (pendingIds.has(String(row.invoiceId))) {
                return false;
            }
            const acted = (row.levels || []).some((level) => (level.approvers || []).some((approver) => approver.email === email && approver.decision));
            if (acted) {
                return true;
            }
            if (row.requestStatus === 'approved' || row.requestStatus === 'rejected') {
                return levelSet.size > 0;
            }
            if (row.requestStatus === 'pending' && levelSet.size) {
                return actorLevels.some((levelOrder) => {
                    const level = row.levels?.find((item) => item.levelOrder === levelOrder);
                    return level && (level.status === 'approved' || level.status === 'rejected');
                });
            }
            return false;
        })
            .map((row) => {
            let actorLevel = null;
            let actorAction = null;
            let actorDecidedAt = null;
            for (const levelOrder of actorLevels) {
                const level = row.levels?.find((item) => item.levelOrder === levelOrder);
                const mine = level?.approvers?.find((approver) => approver.email === email && approver.decision);
                if (mine) {
                    actorLevel = levelOrder;
                    actorAction = mine.decision;
                    actorDecidedAt = mine.decidedAt;
                    break;
                }
            }
            if (!actorAction) {
                const passedLevel = actorLevels.find((levelOrder) => {
                    const level = row.levels?.find((item) => item.levelOrder === levelOrder);
                    return level && level.status === 'approved';
                });
                if (passedLevel) {
                    actorLevel = passedLevel;
                    actorAction = 'passed';
                    actorDecidedAt = row.completedAt || row.submittedAt;
                }
            }
            return {
                ...row,
                actorLevel,
                actorAction,
                actorDecidedAt,
                finalStatus: this.finalStatusLabel(row),
            };
        })
            .sort((a, b) => new Date(b.actorDecidedAt || b.submittedAt || 0).getTime() - new Date(a.actorDecidedAt || a.submittedAt || 0).getTime());
        return { co, approverEmail: email, rows };
    }
    async listHistoryForToken(token) {
        const { co, email } = await this.resolveAccessContext(token);
        return this.listHistoryForActor(co, email);
    }
};
exports.ExcessApprovalService = ExcessApprovalService;
exports.ExcessApprovalService = ExcessApprovalService = ExcessApprovalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => invoice_service_1.InvoiceService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        invoice_service_1.InvoiceService])
], ExcessApprovalService);
//# sourceMappingURL=excess-approval.service.js.map
