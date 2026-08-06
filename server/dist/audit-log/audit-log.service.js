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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
let AuditLogService = class AuditLogService {
    db;
    constructor(db) {
        this.db = db;
    }
    async log(input) {
        await this.db.query(`INSERT INTO ebilling_audit_logs (
        co, actor_email, actor_name, action, entity_type, entity_id, summary, details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [
            input.co,
            input.actorEmail.trim(),
            input.actorName?.trim() || null,
            input.action,
            input.entityType || null,
            input.entityId != null ? String(input.entityId) : null,
            input.summary,
            input.details ? JSON.stringify(input.details) : null,
        ]);
    }
    mapRow(row) {
        const actorEmail = String(row.actor_email || '');
        const actorName = row.actor_name ?? null;
        return {
            id: row.id,
            co: String(row.co),
            actorEmail,
            actorName,
            actorLabel: actorName || (0, ebilling_admin_access_1.formatDisplayEmail)(actorEmail),
            action: String(row.action),
            entityType: row.entity_type ?? null,
            entityId: row.entity_id ?? null,
            summary: String(row.summary),
            details: row.details ?? null,
            createdAt: String(row.created_at),
        };
    }
    async getOverview(co, days = 30) {
        const sinceDays = Math.min(Math.max(days, 1), 365);
        const totals = await this.db.query(`SELECT
        COUNT(*)::text AS total_events,
        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('day', NOW())
        )::text AS events_today,
        COUNT(DISTINCT actor_email)::text AS active_actors
       FROM ebilling_audit_logs
       WHERE co = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval`, [co, sinceDays]);
        const byAction = await this.db.query(`SELECT action, COUNT(*)::text AS count
       FROM ebilling_audit_logs
       WHERE co = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval
       GROUP BY action
       ORDER BY COUNT(*) DESC
       LIMIT 12`, [co, sinceDays]);
        const recentActors = await this.db.query(`SELECT
        actor_email,
        MAX(actor_name) AS actor_name,
        COUNT(*)::text AS count,
        MAX(created_at)::text AS last_at
       FROM ebilling_audit_logs
       WHERE co = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval
       GROUP BY actor_email
       ORDER BY MAX(created_at) DESC
       LIMIT 8`, [co, sinceDays]);
        const recent = await this.db.query(`SELECT *
       FROM ebilling_audit_logs
       WHERE co = $1
       ORDER BY created_at DESC
       LIMIT 8`, [co]);
        const row = totals.rows[0];
        return {
            days: sinceDays,
            totalEvents: Number(row?.total_events || 0),
            eventsToday: Number(row?.events_today || 0),
            activeActors: Number(row?.active_actors || 0),
            byAction: byAction.rows.map((item) => ({
                action: item.action,
                count: Number(item.count),
            })),
            recentActors: recentActors.rows.map((item) => ({
                email: item.actor_email,
                name: item.actor_name,
                label: item.actor_name || (0, ebilling_admin_access_1.formatDisplayEmail)(item.actor_email),
                count: Number(item.count),
                lastAt: item.last_at,
            })),
            recentEvents: recent.rows.map((item) => this.mapRow(item)),
        };
    }
    async listEvents(co, options = {}) {
        const page = Math.max(options.page || 1, 1);
        const pageSize = Math.min(Math.max(options.pageSize || 25, 1), 100);
        const offset = (page - 1) * pageSize;
        const conditions = ['co = $1'];
        const params = [co];
        let paramIndex = 2;
        if (options.action?.trim()) {
            conditions.push(`action = $${paramIndex++}`);
            params.push(options.action.trim());
        }
        if (options.from?.trim()) {
            conditions.push(`created_at >= $${paramIndex++}::timestamptz`);
            params.push(options.from.trim());
        }
        if (options.to?.trim()) {
            conditions.push(`created_at <= $${paramIndex++}::timestamptz`);
            params.push(options.to.trim());
        }
        if (options.search?.trim()) {
            const term = `%${options.search.trim()}%`;
            conditions.push(`(summary ILIKE $${paramIndex} OR actor_email ILIKE $${paramIndex} OR actor_name ILIKE $${paramIndex} OR entity_id ILIKE $${paramIndex})`);
            params.push(term);
            paramIndex += 1;
        }
        const where = conditions.join(' AND ');
        const countResult = await this.db.query(`SELECT COUNT(*)::text AS total FROM ebilling_audit_logs WHERE ${where}`, params);
        const result = await this.db.query(`SELECT *
       FROM ebilling_audit_logs
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, pageSize, offset]);
        return {
            items: result.rows.map((row) => this.mapRow(row)),
            total: Number(countResult.rows[0]?.total || 0),
            page,
            pageSize,
        };
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map