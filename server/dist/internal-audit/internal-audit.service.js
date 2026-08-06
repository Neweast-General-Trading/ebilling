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
exports.InternalAuditService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
const invoice_phone_util_1 = require("../invoice/invoice-phone.util");
const call_category_util_1 = require("../invoice/call-category.util");
const invoice_call_service_1 = require("../invoice/invoice-call.service");
let InternalAuditService = class InternalAuditService {
    db;
    invoiceCalls;
    constructor(db, invoiceCalls) {
        this.db = db;
        this.invoiceCalls = invoiceCalls;
    }
    async getOverview(co, month) {
        const months = await this.listMonths(co);
        const params = [co];
        let monthFilter = '';
        if (month) {
            params.push(month);
            monthFilter = `AND to_char(i.billing_month, 'YYYY-MM') = $${params.length}`;
        }
        const stats = await this.db.query(`SELECT
        COUNT(DISTINCT i.id)::text AS invoice_count,
        COUNT(DISTINCT i.id) FILTER (WHERE i.calls_parsed_at IS NULL)::text AS unparsed_count,
        COUNT(c.id)::text AS call_count,
        COUNT(c.id) FILTER (WHERE c.is_internal)::text AS internal_count,
        COUNT(c.id) FILTER (WHERE NOT c.is_internal)::text AS external_count,
        COUNT(c.id) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        )::text AS internal_mobile_count,
        COUNT(c.id) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        )::text AS internal_landline_count,
        COUNT(c.id) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        )::text AS internal_international_count,
        COUNT(c.id) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        )::text AS external_mobile_count,
        COUNT(c.id) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        )::text AS external_landline_count,
        COUNT(c.id) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        )::text AS external_international_count,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE c.is_internal), 0)::text AS internal_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE NOT c.is_internal), 0)::text AS external_seconds
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN invoice_call_records c ON c.invoice_id = i.id
       WHERE e.co = $1 ${monthFilter}`, params);
        const row = stats.rows[0];
        return {
            month: month || null,
            months,
            invoiceCount: Number(row?.invoice_count) || 0,
            unparsedCount: Number(row?.unparsed_count) || 0,
            callCount: Number(row?.call_count) || 0,
            internalCallCount: Number(row?.internal_count) || 0,
            externalCallCount: Number(row?.external_count) || 0,
            internalMobileCount: Number(row?.internal_mobile_count) || 0,
            internalLandlineCount: Number(row?.internal_landline_count) || 0,
            internalInternationalCount: Number(row?.internal_international_count) || 0,
            externalMobileCount: Number(row?.external_mobile_count) || 0,
            externalLandlineCount: Number(row?.external_landline_count) || 0,
            externalInternationalCount: Number(row?.external_international_count) || 0,
            internalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(Number(row?.internal_seconds) || 0),
            externalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(Number(row?.external_seconds) || 0),
        };
    }
    async parseAll(co, month) {
        return this.invoiceCalls.parseAllForCompany(co, month);
    }
    async listInvoices(co, input) {
        const offset = (input.page - 1) * input.pageSize;
        const params = [co];
        const filters = ['e.co = $1'];
        if (input.month) {
            params.push(input.month);
            filters.push(`to_char(i.billing_month, 'YYYY-MM') = $${params.length}`);
        }
        if (input.search?.trim()) {
            params.push(`%${input.search.trim()}%`);
            const idx = params.length;
            filters.push(`(e.display_name ILIKE $${idx} OR i.phone_number ILIKE $${idx} OR COALESCE(i.invoice_code, '') ILIKE $${idx})`);
        }
        const where = filters.join(' AND ');
        const countResult = await this.db.query(`SELECT COUNT(*)::text AS total
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE ${where}`, params);
        params.push(input.pageSize, offset);
        const rows = await this.db.query(`SELECT
        i.id,
        i.phone_number,
        i.invoice_code,
        to_char(i.billing_month, 'YYYY-MM') AS month,
        i.amount_due,
        i.call_count,
        i.calls_parsed_at,
        e.display_name,
        COALESCE(SUM(c.duration_seconds), 0)::int AS total_duration_seconds,
        COUNT(c.id) FILTER (WHERE c.is_internal)::int AS internal_calls,
        COUNT(c.id) FILTER (WHERE NOT c.is_internal)::int AS external_calls
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN invoice_call_records c ON c.invoice_id = i.id
       WHERE ${where}
       GROUP BY i.id, e.display_name
       ORDER BY i.billing_month DESC, e.display_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        return {
            items: rows.rows.map((row) => ({
                id: row.id,
                phoneNumber: row.phone_number,
                invoiceCode: row.invoice_code,
                month: row.month,
                monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(row.month),
                displayName: row.display_name,
                amountDue: Number(row.amount_due) || 0,
                callCount: Number(row.call_count) || 0,
                callsParsedAt: row.calls_parsed_at,
                internalCalls: row.internal_calls,
                externalCalls: row.external_calls,
                totalDuration: (0, invoice_phone_util_1.formatTalkMinutes)(row.total_duration_seconds),
            })),
            total: Number(countResult.rows[0]?.total) || 0,
            page: input.page,
            pageSize: input.pageSize,
        };
    }
    async listInvoiceCalls(co, invoiceId, input) {
        const invoiceResult = await this.db.query(`SELECT i.id, i.phone_number, i.invoice_code, to_char(i.billing_month, 'YYYY-MM') AS month,
              e.display_name, i.call_count, i.calls_parsed_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1 AND i.id = $2
       LIMIT 1`, [co, invoiceId]);
        if (!invoiceResult.rows[0]) {
            return { invoice: null, items: [], total: 0, page: input.page, pageSize: input.pageSize };
        }
        const offset = (input.page - 1) * input.pageSize;
        const countParams = [invoiceId, co];
        let searchFilter = '';
        if (input.search?.trim()) {
            countParams.push(`%${input.search.trim()}%`);
            searchFilter = `AND (c.callee_phone ILIKE $3 OR COALESCE(e2.display_name, '') ILIKE $3)`;
        }
        let typeFilter = (0, call_category_util_1.buildCallTypeFilterSql)(input.callType);
        const countResult = await this.db.query(`SELECT COUNT(*)::text AS total
       FROM invoice_call_records c
       LEFT JOIN sim_employees e2 ON e2.co = $2
        AND (
          e2.phone_number = c.callee_phone
          OR regexp_replace(e2.phone_number, '\\\\D', '', 'g') = regexp_replace(c.callee_phone, '\\\\D', '', 'g')
        )
       WHERE c.invoice_id = $1 ${searchFilter} ${typeFilter}`, countParams);
        const summaryResult = await this.db.query(`SELECT
        COUNT(*) FILTER (WHERE c.is_internal)::text AS internal_count,
        COUNT(*) FILTER (WHERE NOT c.is_internal)::text AS external_count,
        COUNT(*) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        )::text AS internal_mobile_count,
        COUNT(*) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        )::text AS internal_landline_count,
        COUNT(*) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        )::text AS internal_international_count,
        COUNT(*) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        )::text AS external_mobile_count,
        COUNT(*) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        )::text AS external_landline_count,
        COUNT(*) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        )::text AS external_international_count
       FROM invoice_call_records c
       LEFT JOIN sim_employees e2 ON e2.co = $2
        AND (
          e2.phone_number = c.callee_phone
          OR regexp_replace(e2.phone_number, '\\\\D', '', 'g') = regexp_replace(c.callee_phone, '\\\\D', '', 'g')
        )
       WHERE c.invoice_id = $1 ${searchFilter}`, countParams.slice(0, 2));
        const summaryRow = summaryResult.rows[0];
        const listParams = [...countParams, input.pageSize, offset];
        const rows = await this.db.query(`SELECT
        c.id,
        c.callee_phone,
        c.call_at,
        c.duration_seconds,
        c.duration_label,
        c.amount,
        c.is_internal,
        c.call_category,
        c.callee_country_code,
        c.callee_country_name,
        e2.display_name AS callee_name
       FROM invoice_call_records c
       LEFT JOIN sim_employees e2
         ON e2.co = $2
        AND (
          e2.phone_number = c.callee_phone
          OR regexp_replace(e2.phone_number, '\\\\D', '', 'g') = regexp_replace(c.callee_phone, '\\\\D', '', 'g')
        )
       WHERE c.invoice_id = $1 ${searchFilter} ${typeFilter}
       ORDER BY c.call_at DESC NULLS LAST, c.id DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`, listParams);
        return {
            invoice: {
                ...invoiceResult.rows[0],
                monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(invoiceResult.rows[0].month),
            },
            items: rows.rows.map((row) => ({
                id: row.id,
                calleePhone: row.callee_phone,
                calleeName: row.callee_name,
                callAt: row.call_at,
                duration: row.duration_label || (0, invoice_phone_util_1.formatDuration)(row.duration_seconds),
                durationSeconds: row.duration_seconds,
                amount: Number(row.amount) || 0,
                isInternal: row.is_internal,
                callCategory: row.call_category,
                countryCode: row.callee_country_code,
                countryName: row.callee_country_name,
            })),
            total: Number(countResult.rows[0]?.total) || 0,
            page: input.page,
            pageSize: input.pageSize,
            summary: {
                all: Number(summaryRow?.internal_count || 0) + Number(summaryRow?.external_count || 0),
                internal: Number(summaryRow?.internal_count) || 0,
                external: Number(summaryRow?.external_count) || 0,
                internal_mobile: Number(summaryRow?.internal_mobile_count) || 0,
                internal_landline: Number(summaryRow?.internal_landline_count) || 0,
                internal_international: Number(summaryRow?.internal_international_count) || 0,
                external_mobile: Number(summaryRow?.external_mobile_count) || 0,
                external_landline: Number(summaryRow?.external_landline_count) || 0,
                external_international: Number(summaryRow?.external_international_count) || 0,
            },
        };
    }
    async listSubscribers(co, input) {
        const offset = (input.page - 1) * input.pageSize;
        const params = [co];
        const filters = ['e.co = $1'];
        if (input.month) {
            params.push(input.month);
            filters.push(`to_char(c.billing_month, 'YYYY-MM') = $${params.length}`);
        }
        if (input.search?.trim()) {
            params.push(`%${input.search.trim()}%`);
            const idx = params.length;
            filters.push(`(e.display_name ILIKE $${idx} OR c.caller_phone ILIKE $${idx})`);
        }
        const where = filters.join(' AND ');
        const orderBy = input.sort === 'external_desc'
            ? 'external_calls DESC, internal_calls DESC'
            : input.sort === 'talk_desc'
                ? 'total_duration_seconds DESC'
                : 'internal_calls DESC, external_calls DESC';
        const countResult = await this.db.query(`SELECT COUNT(*)::text AS total FROM (
         SELECT c.caller_phone
         FROM invoice_call_records c
         INNER JOIN sim_employees e ON e.id = c.sim_employee_id
         WHERE ${where}
         GROUP BY c.caller_phone
       ) s`, params);
        params.push(input.pageSize, offset);
        const rows = await this.db.query(`SELECT
        c.caller_phone,
        MAX(e.display_name) AS display_name,
        COUNT(*)::int AS total_calls,
        COUNT(*) FILTER (WHERE c.is_internal)::int AS internal_calls,
        COUNT(*) FILTER (WHERE NOT c.is_internal)::int AS external_calls,
        COALESCE(SUM(c.duration_seconds), 0)::int AS total_duration_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE c.is_internal), 0)::int AS internal_duration_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE NOT c.is_internal), 0)::int AS external_duration_seconds
       FROM invoice_call_records c
       INNER JOIN sim_employees e ON e.id = c.sim_employee_id
       WHERE ${where}
       GROUP BY c.caller_phone
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        return {
            items: rows.rows.map((row) => ({
                phoneNumber: row.caller_phone,
                displayName: row.display_name,
                totalCalls: row.total_calls,
                internalCalls: row.internal_calls,
                externalCalls: row.external_calls,
                totalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(row.total_duration_seconds),
                internalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(row.internal_duration_seconds),
                externalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(row.external_duration_seconds),
            })),
            total: Number(countResult.rows[0]?.total) || 0,
            page: input.page,
            pageSize: input.pageSize,
        };
    }
    async listTopPairs(co, input) {
        const params = [co];
        let monthFilter = '';
        if (input.month) {
            params.push(input.month);
            monthFilter = `AND to_char(c.billing_month, 'YYYY-MM') = $${params.length}`;
        }
        const rows = await this.db.query(`SELECT
        c.caller_phone,
        c.callee_phone,
        c.is_internal,
        c.duration_seconds,
        to_char(c.billing_month, 'YYYY-MM') AS month,
        e1.display_name AS caller_name,
        e2.display_name AS callee_name
       FROM invoice_call_records c
       INNER JOIN sim_employees e1 ON e1.id = c.sim_employee_id
       LEFT JOIN sim_employees e2
         ON e2.co = $1
        AND (
          e2.phone_number = c.callee_phone
          OR regexp_replace(e2.phone_number, '\\\\D', '', 'g') = regexp_replace(c.callee_phone, '\\\\D', '', 'g')
        )
       WHERE e1.co = $1
         AND c.is_internal = TRUE
         ${monthFilter}`, params);
        const aggregate = new Map();
        for (const row of rows.rows) {
            const key = (0, invoice_phone_util_1.pairKey)(row.caller_phone, row.callee_phone);
            const [phoneA, phoneB] = key.split('|');
            const existing = aggregate.get(key) || {
                phoneA,
                phoneB,
                nameA: row.caller_name,
                nameB: row.callee_name,
                callCount: 0,
                totalSeconds: 0,
                month: input.month || row.month,
            };
            existing.callCount += 1;
            existing.totalSeconds += Number(row.duration_seconds) || 0;
            if (!existing.nameA)
                existing.nameA = row.caller_name;
            if (!existing.nameB)
                existing.nameB = row.callee_name;
            aggregate.set(key, existing);
        }
        const sorted = [...aggregate.values()].sort((a, b) => b.callCount - a.callCount || b.totalSeconds - a.totalSeconds);
        const total = sorted.length;
        const offset = (input.page - 1) * input.pageSize;
        const pageItems = sorted.slice(offset, offset + input.pageSize);
        return {
            items: pageItems.map((item) => ({
                phoneA: item.phoneA,
                phoneB: item.phoneB,
                nameA: item.nameA,
                nameB: item.nameB,
                callCount: item.callCount,
                totalTalkTime: (0, invoice_phone_util_1.formatTalkMinutes)(item.totalSeconds),
                totalSeconds: item.totalSeconds,
                month: item.month,
                monthLabel: item.month ? (0, invoice_billing_util_1.formatBillingMonthLabel)(item.month) : null,
            })),
            total,
            page: input.page,
            pageSize: input.pageSize,
        };
    }
    async getCallAnalytics(co, month) {
        const params = [co];
        let monthFilter = '';
        if (month) {
            params.push(month);
            monthFilter = `AND to_char(c.billing_month, 'YYYY-MM') = $${params.length}`;
        }
        const baseFrom = `
      FROM invoice_call_records c
      INNER JOIN sim_employees e ON e.id = c.sim_employee_id
      WHERE e.co = $1 ${monthFilter}`;
        const stats = await this.db.query(`SELECT
        COUNT(c.id)::text AS call_count,
        COUNT(c.id) FILTER (WHERE c.is_internal)::text AS internal_count,
        COUNT(c.id) FILTER (WHERE NOT c.is_internal)::text AS external_count,
        COUNT(DISTINCT c.caller_phone)::text AS subscriber_count,
        COALESCE(SUM(c.duration_seconds), 0)::text AS total_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE c.is_internal), 0)::text AS internal_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (WHERE NOT c.is_internal), 0)::text AS external_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        ), 0)::text AS internal_mobile_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        ), 0)::text AS internal_landline_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        ), 0)::text AS internal_international_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'mobile'
        ), 0)::text AS external_mobile_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'landline'
        ), 0)::text AS external_landline_seconds,
        COALESCE(SUM(c.duration_seconds) FILTER (
          WHERE NOT c.is_internal AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
        ), 0)::text AS external_international_seconds
       ${baseFrom}`, params);
        const topExternal = await this.db.query(`SELECT
        c.callee_phone,
        MAX(e2.display_name) AS callee_name,
        COUNT(*)::int AS call_count,
        COALESCE(SUM(c.duration_seconds), 0)::int AS talk_seconds
       FROM invoice_call_records c
       INNER JOIN sim_employees e ON e.id = c.sim_employee_id
       LEFT JOIN sim_employees e2
         ON e2.co = $1
        AND (
          e2.phone_number = c.callee_phone
          OR regexp_replace(e2.phone_number, '\\\\D', '', 'g') = regexp_replace(c.callee_phone, '\\\\D', '', 'g')
        )
       WHERE e.co = $1 ${monthFilter}
         AND NOT c.is_internal
       GROUP BY c.callee_phone
       ORDER BY call_count DESC, talk_seconds DESC
       LIMIT 8`, params);
        const topCountries = await this.db.query(`SELECT
        COALESCE(NULLIF(c.callee_country_code, ''), 'XX') AS country_code,
        MAX(c.callee_country_name) AS country_name,
        COUNT(*)::int AS call_count,
        COALESCE(SUM(c.duration_seconds), 0)::int AS talk_seconds
       ${baseFrom}
       AND ${(0, call_category_util_1.normalizedCategorySql)('c.call_category')} = 'international'
       GROUP BY COALESCE(NULLIF(c.callee_country_code, ''), 'XX')
       ORDER BY call_count DESC, talk_seconds DESC
       LIMIT 8`, params);
        const topTalkers = await this.db.query(`SELECT
        c.caller_phone,
        MAX(e.display_name) AS display_name,
        COUNT(*)::int AS total_calls,
        COUNT(*) FILTER (WHERE c.is_internal)::int AS internal_calls,
        COUNT(*) FILTER (WHERE NOT c.is_internal)::int AS external_calls,
        COALESCE(SUM(c.duration_seconds), 0)::int AS talk_seconds
       ${baseFrom}
       GROUP BY c.caller_phone
       ORDER BY total_calls DESC, talk_seconds DESC
       LIMIT 8`, params);
        const row = stats.rows[0];
        const callCount = Number(row?.call_count) || 0;
        const internalCount = Number(row?.internal_count) || 0;
        const totalSeconds = Number(row?.total_seconds) || 0;
        const internalSeconds = Number(row?.internal_seconds) || 0;
        const externalSeconds = Number(row?.external_seconds) || 0;
        return {
            subscriberCount: Number(row?.subscriber_count) || 0,
            avgCallDurationMinutes: callCount
                ? (0, invoice_phone_util_1.secondsToMinutes)(totalSeconds / callCount)
                : 0,
            avgInternalDurationMinutes: internalCount
                ? (0, invoice_phone_util_1.secondsToMinutes)(internalSeconds / internalCount)
                : 0,
            avgExternalDurationMinutes: Number(row?.external_count) > 0
                ? (0, invoice_phone_util_1.secondsToMinutes)(externalSeconds / Number(row?.external_count))
                : 0,
            internalRatio: callCount ? Math.round((internalCount / callCount) * 100) : 0,
            talkTimeByCategory: {
                internalMobileMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.internal_mobile_seconds) || 0),
                internalLandlineMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.internal_landline_seconds) || 0),
                internalInternationalMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.internal_international_seconds) || 0),
                externalMobileMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.external_mobile_seconds) || 0),
                externalLandlineMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.external_landline_seconds) || 0),
                externalInternationalMinutes: (0, invoice_phone_util_1.secondsToMinutes)(Number(row?.external_international_seconds) || 0),
            },
            topExternalNumbers: topExternal.rows.map((item) => ({
                phone: item.callee_phone,
                name: item.callee_name,
                callCount: item.call_count,
                talkMinutes: (0, invoice_phone_util_1.secondsToMinutes)(item.talk_seconds),
                talkTime: (0, invoice_phone_util_1.formatTalkMinutes)(item.talk_seconds),
            })),
            topCountries: topCountries.rows.map((item) => ({
                countryCode: item.country_code === 'XX' ? null : item.country_code,
                countryName: item.country_name,
                callCount: item.call_count,
                talkMinutes: (0, invoice_phone_util_1.secondsToMinutes)(item.talk_seconds),
                talkTime: (0, invoice_phone_util_1.formatTalkMinutes)(item.talk_seconds),
            })),
            topSubscribers: topTalkers.rows.map((item) => ({
                phoneNumber: item.caller_phone,
                displayName: item.display_name,
                totalCalls: item.total_calls,
                internalCalls: item.internal_calls,
                externalCalls: item.external_calls,
                talkMinutes: (0, invoice_phone_util_1.secondsToMinutes)(item.talk_seconds),
                talkTime: (0, invoice_phone_util_1.formatTalkMinutes)(item.talk_seconds),
                internalRatio: item.total_calls > 0
                    ? Math.round((item.internal_calls / item.total_calls) * 100)
                    : 0,
            })),
        };
    }
    async listMonths(co) {
        const result = await this.db.query(`SELECT to_char(i.billing_month, 'YYYY-MM') AS month
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       GROUP BY i.billing_month
       ORDER BY i.billing_month DESC`, [co]);
        return result.rows.map((row) => row.month);
    }
};
exports.InternalAuditService = InternalAuditService;
exports.InternalAuditService = InternalAuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        invoice_call_service_1.InvoiceCallService])
], InternalAuditService);
//# sourceMappingURL=internal-audit.service.js.map