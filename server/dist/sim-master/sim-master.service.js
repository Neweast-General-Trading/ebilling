"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimMasterService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const oracle_employee_service_1 = require("../oracle/oracle-employee.service");
const bi_employee_service_1 = require("../bi/bi-employee.service");
const database_service_1 = require("../database/database.service");
const sim_master_billing_util_1 = require("./sim-master-billing.util");
const LEGACY_SHEET_NAMES = ['Sheet1', 'MASTER', 'Master', 'SIM MASTER'];
const PREFERRED_MASTER_SHEET = 'ETISALAT MAY 2026';
const MONTHLY_LAYOUT = {
    phoneCol: 1,
    sapIdCol: 3,
    nameCol: 4,
    companyCol: 2,
    usageCol: 5,
    limitCol: 6,
    vatCol: 7,
    additionalCol: 8,
    minSapId: 10000,
    mobileOnly: false,
};
const LEGACY_LAYOUT = {
    phoneCol: 2,
    sapIdCol: 3,
    nameCol: 4,
    companyCol: 0,
    usageCol: null,
    limitCol: null,
    vatCol: null,
    additionalCol: null,
    minSapId: 1,
    mobileOnly: false,
};
let SimMasterService = class SimMasterService {
    db;
    oracle;
    bi;
    constructor(db, oracle, bi) {
        this.db = db;
        this.oracle = oracle;
        this.bi = bi;
    }
    isMonthlySheet(name) {
        return /^ETISALAT\s/i.test(name);
    }
    resolveMasterSheet(workbook) {
        if (workbook.SheetNames.includes(PREFERRED_MASTER_SHEET)) {
            return PREFERRED_MASTER_SHEET;
        }
        const monthlySheets = workbook.SheetNames.filter((name) => this.isMonthlySheet(name));
        if (monthlySheets.length) {
            return monthlySheets[monthlySheets.length - 1];
        }
        for (const name of LEGACY_SHEET_NAMES) {
            if (workbook.SheetNames.includes(name))
                return name;
        }
        return workbook.SheetNames[0];
    }
    resolveLayout(sheetName) {
        return this.isMonthlySheet(sheetName) ? MONTHLY_LAYOUT : LEGACY_LAYOUT;
    }
    normalizePhone(raw) {
        const value = String(raw ?? '').trim();
        if (!value)
            return null;
        const digits = value.replace(/\D/g, '');
        if (!digits)
            return null;
        if (digits.startsWith('9715') && digits.length >= 12) {
            return `0${digits.slice(3, 12)}`;
        }
        if (digits.startsWith('05') && digits.length >= 10) {
            return digits.slice(0, 10);
        }
        if (digits.startsWith('5') && digits.length >= 9 && !digits.startsWith('500')) {
            return `0${digits.slice(0, 9)}`;
        }
        if (digits.startsWith('04')) {
            return digits;
        }
        if (digits.startsWith('800')) {
            return digits;
        }
        if (digits.startsWith('900')) {
            return digits;
        }
        if (digits.startsWith('920')) {
            return digits;
        }
        return null;
    }
    getLineType(phoneNumber) {
        if (phoneNumber.startsWith('05') && phoneNumber.length === 10) {
            return 'mobile';
        }
        if (phoneNumber.startsWith('04') ||
            phoneNumber.startsWith('800') ||
            phoneNumber.startsWith('900') ||
            phoneNumber.startsWith('920')) {
            return 'landline';
        }
        return null;
    }
    landlinePersonNumber(phoneNumber) {
        return `LL-${phoneNumber}`;
    }
    hiddenCodePersonNumber(phoneNumber) {
        return `BLK-${phoneNumber}`;
    }
    isAutoImportedLine(lineType) {
        return lineType === 'landline' || lineType === 'department';
    }
    isSyntheticPersonNumber(personNumber) {
        return (personNumber.startsWith('BLK-') ||
            personNumber.startsWith('LL-') ||
            personNumber.startsWith('REL-'));
    }
    async getEmployeeOrThrow(co, id) {
        const result = await this.db.query('SELECT * FROM sim_employees WHERE id = $1 AND co = $2', [id, co]);
        if (!result.rows[0]) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return result.rows[0];
    }
    async findDuplicates(co, input) {
        const conflicts = [];
        const excludeId = input.excludeId ?? null;
        const pushConflict = (field, value, row) => {
            if (excludeId && row.id === excludeId)
                return;
            conflicts.push({
                field,
                value,
                existingId: row.id,
                existingName: row.display_name ?? null,
                existingPhone: row.phone_number,
                existingPersonNumber: row.person_number,
            });
        };
        if (input.phoneNumber?.trim()) {
            const phone = this.normalizePhone(input.phoneNumber);
            if (phone) {
                const phoneResult = await this.db.query(`SELECT * FROM sim_employees
           WHERE co = $1 AND phone_number = $2 AND is_active = TRUE
           ${excludeId ? 'AND id <> $3' : ''}
           LIMIT 1`, excludeId ? [co, phone, excludeId] : [co, phone]);
                if (phoneResult.rows[0]) {
                    pushConflict('phoneNumber', phone, phoneResult.rows[0]);
                }
            }
        }
        if (input.personNumber?.trim() &&
            !this.isSyntheticPersonNumber(input.personNumber.trim())) {
            const personResult = await this.db.query(`SELECT * FROM sim_employees
         WHERE co = $1 AND person_number = $2 AND is_active = TRUE
         ${excludeId ? 'AND id <> $3' : ''}
         LIMIT 1`, excludeId
                ? [co, input.personNumber.trim(), excludeId]
                : [co, input.personNumber.trim()]);
            if (personResult.rows[0]) {
                pushConflict('personNumber', input.personNumber.trim(), personResult.rows[0]);
            }
        }
        if (input.displayName?.trim()) {
            const nameResult = await this.db.query(`SELECT * FROM sim_employees
         WHERE co = $1 AND LOWER(TRIM(display_name)) = LOWER(TRIM($2)) AND is_active = TRUE
         ${excludeId ? 'AND id <> $3' : ''}
         LIMIT 1`, excludeId
                ? [co, input.displayName.trim(), excludeId]
                : [co, input.displayName.trim()]);
            if (nameResult.rows[0]) {
                pushConflict('displayName', input.displayName.trim(), nameResult.rows[0]);
            }
        }
        return conflicts;
    }
    generateTemplateBuffer() {
        const rows = [
            [
                'ACC. NO.',
                'TEL. NO.',
                'COMPANY',
                'SAP ID',
                'NAME',
                'USAGE',
                'NEGTE EXP. LIMIT',
                'VAT 5%',
                "ADDT'L",
            ],
            ['', '0501234567', 'NEGT', '123456', 'Example Employee', '', 200, 10, 0],
        ];
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, PREFERRED_MASTER_SHEET);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    parseAmount(raw) {
        if (raw === '' || raw === null || raw === undefined)
            return null;
        const value = Number(String(raw).replace(/,/g, ''));
        return Number.isFinite(value) ? value : null;
    }
    extractBilling(cells, layout) {
        const packageLimit = layout.limitCol !== null ? this.parseAmount(cells[layout.limitCol]) : null;
        const vatAmount = layout.vatCol !== null ? this.parseAmount(cells[layout.vatCol]) : null;
        const additionalAmount = layout.additionalCol !== null
            ? this.parseAmount(cells[layout.additionalCol])
            : null;
        const usageAmount = layout.usageCol !== null ? this.parseAmount(cells[layout.usageCol]) : null;
        const limitPart = packageLimit ?? 0;
        const vatPart = vatAmount ?? 0;
        const additionalPart = additionalAmount ?? 0;
        const hasParts = packageLimit !== null || vatAmount !== null || additionalAmount !== null;
        const totalAmount = hasParts ? limitPart + vatPart + additionalPart : null;
        return {
            usageAmount,
            packageLimit,
            vatAmount,
            additionalAmount,
            totalAmount,
        };
    }
    buildExcelResolved(row) {
        return {
            personNumber: row.personNumber,
            displayName: row.excelName,
            firstName: null,
            lastName: null,
            email: null,
            emailSource: null,
            positionName: null,
            departmentName: null,
            matched: true,
            errors: [],
        };
    }
    mergeResolved(row, resolved) {
        return {
            personNumber: row.personNumber,
            displayName: resolved.displayName || row.excelName,
            firstName: resolved.firstName,
            lastName: resolved.lastName,
            email: resolved.email,
            emailSource: resolved.emailSource,
            positionName: resolved.positionName,
            departmentName: resolved.departmentName,
            matched: true,
            errors: resolved.errors,
        };
    }
    async resolveRow(co, row) {
        if (this.isAutoImportedLine(row.lineType)) {
            return this.buildExcelResolved(row);
        }
        const resolved = await this.resolveEmployee(co, row.personNumber, row.excelName);
        return this.mergeResolved(row, resolved);
    }
    async resolveEmployee(co, personNumber, excelName) {
        const errors = [];
        const oracleProfile = await this.oracle.getEmployeeByPersonNumber(personNumber);
        let biProfile = null;
        if (!oracleProfile?.email) {
            biProfile = await this.bi.getEmployeeByCode(co, personNumber);
            if (!biProfile?.email) {
                biProfile = await this.bi.getEmployeeByCode(co, personNumber, {
                    includeInactive: true,
                });
            }
        }
        const email = oracleProfile?.email || biProfile?.email || null;
        const emailSource = oracleProfile?.email
            ? 'oracle'
            : biProfile?.email
                ? 'bi'
                : null;
        if (!oracleProfile && !biProfile) {
            errors.push(`SAP ID ${personNumber} not found in Oracle or BI`);
        }
        else if (!email) {
            errors.push('No email found in Oracle or BI');
        }
        return {
            personNumber,
            displayName: oracleProfile?.displayName || biProfile?.displayName || excelName,
            firstName: oracleProfile?.firstName || null,
            lastName: oracleProfile?.lastName || null,
            email,
            emailSource,
            positionName: oracleProfile?.positionName || null,
            departmentName: oracleProfile?.departmentName || null,
            matched: errors.length === 0,
            errors,
        };
    }
    getSheetBreakdown(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = this.resolveMasterSheet(workbook);
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
        const skipLabels = new Set(['TEL. NO.', 'ACC. NO.', 'JAFZA ACCOUNTS', '']);
        let totalPhoneLines = 0;
        let employeeMobileSap = 0;
        let landlineRows = 0;
        let departmentRows = 0;
        for (const row of rows) {
            const phoneRaw = String(row[1] ?? '').trim();
            if (!phoneRaw || skipLabels.has(phoneRaw))
                continue;
            if (!phoneRaw.replace(/\D/g, ''))
                continue;
            totalPhoneLines += 1;
            const phone = this.normalizePhone(phoneRaw);
            const phoneLineType = phone ? this.getLineType(phone) : null;
            const sap = String(row[3] ?? '').trim();
            const validSap = sap && !Number.isNaN(Number(sap)) && Number(sap) >= MONTHLY_LAYOUT.minSapId;
            if (phoneLineType === 'mobile' && validSap) {
                employeeMobileSap += 1;
            }
            else if (phoneLineType === 'mobile' && !validSap) {
                departmentRows += 1;
            }
            else if (phoneLineType === 'landline') {
                landlineRows += 1;
            }
        }
        const parsedRows = this.parseExcelBuffer(buffer).length;
        return {
            sheetName,
            totalPhoneLines,
            employeeMobileSap,
            landlineRows,
            departmentRows,
            parsedEmployeeRows: parsedRows,
            note: `${totalPhoneLines} phone lines in Excel; ${employeeMobileSap} employee mobile, ${landlineRows} landline/service, ${departmentRows} department lines (hidden SAP code).`,
        };
    }
    parseExcelBuffer(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = this.resolveMasterSheet(workbook);
        const layout = this.resolveLayout(sheetName);
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
        });
        const results = [];
        rows.forEach((row, index) => {
            const cells = row;
            const sapRaw = String(cells[layout.sapIdCol] ?? '').trim();
            const phoneNumber = this.normalizePhone(cells[layout.phoneCol]);
            const excelCompany = String(cells[layout.companyCol] ?? '').trim() || null;
            const excelName = String(cells[layout.nameCol] ?? '').trim() || null;
            const billing = this.extractBilling(cells, layout);
            if (!phoneNumber) {
                return;
            }
            const phoneLineType = this.getLineType(phoneNumber);
            if (!phoneLineType) {
                return;
            }
            const validSap = sapRaw && !Number.isNaN(Number(sapRaw)) && Number(sapRaw) >= layout.minSapId;
            let personNumber;
            let lineType;
            if (phoneLineType === 'landline') {
                personNumber = this.landlinePersonNumber(phoneNumber);
                lineType = 'landline';
            }
            else if (validSap) {
                personNumber = sapRaw;
                lineType = 'mobile';
            }
            else {
                personNumber = this.hiddenCodePersonNumber(phoneNumber);
                lineType = 'department';
            }
            const rawRow = {
                sheetName,
            };
            cells.forEach((cell, colIndex) => {
                rawRow[String.fromCharCode(65 + colIndex)] = cell;
            });
            results.push({
                rowNumber: index + 1,
                personNumber,
                phoneNumber,
                lineType,
                packageValue: billing.packageLimit,
                excelCompany,
                excelName,
                billing,
                rawRow,
            });
        });
        return results;
    }
    async previewMatch(co, buffer) {
        const rows = this.parseExcelBuffer(buffer);
        const results = [];
        if (!rows.length) {
            throw new common_1.BadRequestException('No valid rows found. Use ETISALAT MAY 2026: Col B = phone, Col D = SAP ID.');
        }
        for (const row of rows) {
            const resolved = await this.resolveRow(co, row);
            const duplicates = await this.findDuplicates(co, {
                phoneNumber: row.phoneNumber ?? undefined,
                personNumber: row.personNumber,
                displayName: row.excelName ?? undefined,
            });
            const duplicateMessages = duplicates.map((d) => `${d.field === 'phoneNumber' ? 'Phone' : d.field === 'personNumber' ? 'SAP ID' : 'Name'} already exists (${d.existingName || d.existingPersonNumber})`);
            results.push({
                rowNumber: row.rowNumber,
                personNumber: row.personNumber,
                phoneNumber: row.phoneNumber,
                lineType: row.lineType,
                packageValue: row.packageValue,
                excelCompany: row.excelCompany,
                excelName: row.excelName,
                billing: row.billing,
                matched: resolved.errors.length === 0,
                oracle: {
                    displayName: resolved.displayName,
                    email: resolved.email,
                    emailSource: resolved.emailSource,
                    positionName: resolved.positionName,
                    departmentName: resolved.departmentName,
                },
                errors: [...resolved.errors, ...duplicateMessages],
                duplicates,
            });
        }
        return results;
    }
    async upsertEmployee(co, row, resolved) {
        const duplicates = await this.findDuplicates(co, {
            phoneNumber: row.phoneNumber ?? undefined,
            personNumber: row.personNumber,
            displayName: row.excelName ?? resolved.displayName ?? undefined,
        });
        if (duplicates.length) {
            throw new common_1.ConflictException({
                message: 'Duplicate information already exists in master',
                conflicts: duplicates,
            });
        }
        const values = [
            co,
            row.personNumber,
            row.phoneNumber,
            row.lineType,
            resolved.firstName,
            resolved.lastName,
            resolved.displayName || row.excelName,
            resolved.email,
            resolved.positionName,
            resolved.departmentName,
            row.billing.packageLimit,
            row.billing.usageAmount,
            row.billing.vatAmount,
            row.billing.additionalAmount,
            row.billing.totalAmount,
            JSON.stringify({
                rowNumber: row.rowNumber,
                excelCompany: row.excelCompany,
                excelName: row.excelName,
                sheetName: row.rawRow.sheetName ?? null,
                emailSource: resolved.emailSource,
                lineType: row.lineType,
                importWarnings: resolved.errors,
            }),
        ];
        const upsertSql = `INSERT INTO sim_employees (
        co, person_number, phone_number, line_type, first_name, last_name, display_name,
        email, position_name, department_name,
        package_value, usage_amount, vat_amount, additional_amount, total_amount,
        excel_row_data, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, TRUE)
      ON CONFLICT (co, person_number) WHERE (is_active = TRUE) DO UPDATE SET
        phone_number = EXCLUDED.phone_number,
        line_type = EXCLUDED.line_type,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        display_name = EXCLUDED.display_name,
        email = COALESCE(EXCLUDED.email, sim_employees.email),
        position_name = EXCLUDED.position_name,
        department_name = EXCLUDED.department_name,
        package_value = EXCLUDED.package_value,
        usage_amount = EXCLUDED.usage_amount,
        vat_amount = EXCLUDED.vat_amount,
        additional_amount = EXCLUDED.additional_amount,
        total_amount = EXCLUDED.total_amount,
        excel_row_data = EXCLUDED.excel_row_data,
        updated_at = NOW()`;
        try {
            await this.db.query(upsertSql, values);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('phone_number')) {
                throw error;
            }
            await this.db.query(`UPDATE sim_employees SET
          person_number = $3,
          line_type = $4,
          first_name = $5,
          last_name = $6,
          display_name = $7,
          email = COALESCE($8, email),
          position_name = $9,
          department_name = $10,
          package_value = $11,
          usage_amount = $12,
          vat_amount = $13,
          additional_amount = $14,
          total_amount = $15,
          excel_row_data = $16,
          updated_at = NOW()
        WHERE co = $1 AND phone_number = $2 AND is_active = TRUE`, values);
        }
    }
    async importMatchedRows(co, buffer) {
        const rows = this.parseExcelBuffer(buffer);
        let imported = 0;
        const importErrors = [];
        for (const row of rows) {
            try {
                const resolved = await this.resolveRow(co, row);
                await this.upsertEmployee(co, row, resolved);
                imported += 1;
            }
            catch (error) {
                const conflict = error instanceof common_1.ConflictException
                    ? error.getResponse()
                    : null;
                importErrors.push({
                    personNumber: row.personNumber,
                    phoneNumber: row.phoneNumber,
                    error: conflict?.conflicts?.length
                        ? conflict.conflicts
                            .map((d) => `${d.field}: ${d.value} → ${d.existingName || d.existingPersonNumber}`)
                            .join('; ')
                        : error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }
        if (!imported) {
            throw new common_1.BadRequestException({
                message: 'Could not import any Excel rows',
                importErrors,
            });
        }
        return {
            imported,
            total: rows.length,
            skipped: importErrors.length,
            skippedRows: importErrors,
            sheetBreakdown: this.getSheetBreakdown(buffer),
        };
    }
    async listEmployees(co, page = 1, pageSize = 25, filters = {}) {
        const safePage = Math.max(1, page);
        const safePageSize = Math.min(100, Math.max(1, pageSize));
        const offset = (safePage - 1) * safePageSize;
        const conditions = ['co = $1'];
        const params = [co];
        let paramIndex = 2;
        if (!filters.includeInactive) {
            conditions.push('is_active = TRUE');
        }
        if (filters.search?.trim()) {
            conditions.push(`(
        person_number ILIKE $${paramIndex}
        OR display_name ILIKE $${paramIndex}
        OR phone_number ILIKE $${paramIndex}
        OR email ILIKE $${paramIndex}
      )`);
            params.push(`%${filters.search.trim()}%`);
            paramIndex += 1;
        }
        if (filters.emailStatus === 'with') {
            conditions.push(`email IS NOT NULL AND TRIM(email) <> ''`);
        }
        else if (filters.emailStatus === 'missing') {
            conditions.push(`(email IS NULL OR TRIM(email) = '')`);
        }
        if (filters.phoneType === 'mobile') {
            conditions.push(`line_type = 'mobile'`);
        }
        else if (filters.phoneType === 'landline') {
            conditions.push(`line_type = 'landline'`);
        }
        else if (filters.phoneType === 'department') {
            conditions.push(`line_type = 'department'`);
        }
        const whereClause = conditions.join(' AND ');
        const countResult = await this.db.query(`SELECT COUNT(*)::text AS count FROM sim_employees WHERE ${whereClause}`, params);
        const total = Number(countResult.rows[0]?.count ?? 0);
        const result = await this.db.query(`SELECT * FROM sim_employees
       WHERE ${whereClause}
       ORDER BY display_name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, safePageSize, offset]);
        return {
            items: result.rows,
            total,
            page: safePage,
            pageSize: safePageSize,
            totalPages: Math.max(1, Math.ceil(total / safePageSize)),
        };
    }
    async updateEmployee(co, id, dto) {
        const emp = await this.getEmployeeOrThrow(co, id);
        if (!emp.is_active) {
            throw new common_1.BadRequestException('Cannot edit an inactive employee');
        }
        const updates = [];
        const params = [];
        let idx = 1;
        if (dto.phoneNumber !== undefined) {
            const phone = this.normalizePhone(dto.phoneNumber);
            if (!phone) {
                throw new common_1.BadRequestException('Invalid phone number');
            }
            const duplicates = await this.findDuplicates(co, {
                phoneNumber: phone,
                excludeId: id,
            });
            if (duplicates.length) {
                throw new common_1.ConflictException({
                    message: 'Phone number already exists',
                    conflicts: duplicates,
                });
            }
            updates.push(`phone_number = $${idx++}`);
            params.push(phone);
        }
        if (dto.displayName !== undefined) {
            const displayName = String(dto.displayName ?? '').trim();
            if (!displayName) {
                throw new common_1.BadRequestException('Display name is required');
            }
            const currentName = String(emp.display_name ?? '').trim();
            if (displayName.toLowerCase() !== currentName.toLowerCase()) {
                const duplicates = await this.findDuplicates(co, {
                    displayName,
                    excludeId: id,
                });
                if (duplicates.length) {
                    throw new common_1.ConflictException({
                        message: 'Display name already exists',
                        conflicts: duplicates,
                    });
                }
                updates.push(`display_name = $${idx++}`);
                params.push(displayName);
                const meta = typeof emp.excel_row_data === 'object' && emp.excel_row_data
                    ? { ...emp.excel_row_data, excelName: displayName }
                    : { excelName: displayName };
                updates.push(`excel_row_data = $${idx++}`);
                params.push(JSON.stringify(meta));
            }
        }
        const currentLimit = Number(emp.package_value) || 0;
        const currentAdditional = Number(emp.additional_amount) || 0;
        const nextLimit = dto.packageLimit !== undefined ? dto.packageLimit : currentLimit;
        const nextAdditional = dto.additionalAmount !== undefined
            ? dto.additionalAmount
            : currentAdditional;
        if (dto.packageLimit !== undefined ||
            dto.additionalAmount !== undefined) {
            const billing = (0, sim_master_billing_util_1.calculateBilling)(nextLimit, nextAdditional);
            updates.push(`package_value = $${idx++}`);
            params.push(billing.packageLimit);
            updates.push(`vat_amount = $${idx++}`);
            params.push(billing.vatAmount);
            updates.push(`additional_amount = $${idx++}`);
            params.push(billing.additionalAmount);
            updates.push(`total_amount = $${idx++}`);
            params.push(billing.totalAmount);
        }
        if (dto.noAutoMail !== undefined) {
            updates.push(`no_auto_mail = $${idx++}`);
            params.push(Boolean(dto.noAutoMail));
        }
        if (!updates.length) {
            return emp;
        }
        updates.push('updated_at = NOW()');
        params.push(id, co);
        const result = await this.db.query(`UPDATE sim_employees SET ${updates.join(', ')}
       WHERE id = $${idx++} AND co = $${idx}
       RETURNING *`, params);
        return result.rows[0];
    }
    async deactivateEmployee(co, id) {
        const emp = await this.getEmployeeOrThrow(co, id);
        if (!emp.is_active) {
            throw new common_1.BadRequestException('Employee is already inactive');
        }
        const releasedPhone = emp.phone_number;
        const placeholderPhone = `REL-${id}`;
        const excelPatch = {
            ...(typeof emp.excel_row_data === 'object' && emp.excel_row_data
                ? emp.excel_row_data
                : {}),
            releasedPhone,
        };
        await this.db.query(`UPDATE sim_employees SET
        is_active = FALSE,
        inactive_at = NOW(),
        phone_number = $1,
        excel_row_data = $2::jsonb,
        updated_at = NOW()
       WHERE id = $3 AND co = $4`, [placeholderPhone, JSON.stringify(excelPatch), id, co]);
        return { id, releasedPhone, inactive: true };
    }
    async activateEmployee(co, id) {
        const emp = await this.getEmployeeOrThrow(co, id);
        if (emp.is_active) {
            throw new common_1.BadRequestException('Employee is already active');
        }
        if (emp.reassigned_to_id) {
            throw new common_1.BadRequestException('Cannot reactivate — the phone number was reassigned to another employee');
        }
        const meta = typeof emp.excel_row_data === 'object' && emp.excel_row_data
            ? emp.excel_row_data
            : {};
        const releasedPhone = meta.releasedPhone;
        if (!releasedPhone) {
            throw new common_1.BadRequestException('No stored phone number found — cannot reactivate this record');
        }
        const duplicates = await this.findDuplicates(co, {
            phoneNumber: releasedPhone,
            personNumber: emp.person_number,
            displayName: emp.display_name ?? undefined,
            excludeId: id,
        });
        if (duplicates.length) {
            throw new common_1.ConflictException({
                message: 'Cannot reactivate — information conflicts with active records',
                conflicts: duplicates,
            });
        }
        const excelPatch = { ...meta };
        delete excelPatch.releasedPhone;
        await this.db.query(`UPDATE sim_employees SET
        is_active = TRUE,
        inactive_at = NULL,
        phone_number = $1,
        excel_row_data = $2::jsonb,
        updated_at = NOW()
       WHERE id = $3 AND co = $4`, [releasedPhone, JSON.stringify(excelPatch), id, co]);
        const updated = await this.getEmployeeOrThrow(co, id);
        return { id, phoneNumber: releasedPhone, active: true, employee: updated };
    }
    async reassignPhone(co, sourceId, dto) {
        const source = await this.getEmployeeOrThrow(co, sourceId);
        if (source.is_active) {
            throw new common_1.BadRequestException('Employee must be inactive before reassigning the phone');
        }
        const meta = typeof source.excel_row_data === 'object' && source.excel_row_data
            ? source.excel_row_data
            : {};
        const releasedPhone = meta.releasedPhone;
        if (!releasedPhone) {
            throw new common_1.BadRequestException('No released phone found on inactive record');
        }
        let targetId = dto.targetEmployeeId ?? null;
        if (!targetId && dto.targetPersonNumber?.trim()) {
            const found = await this.db.query(`SELECT id FROM sim_employees
         WHERE co = $1 AND person_number = $2 AND is_active = TRUE
         LIMIT 1`, [co, dto.targetPersonNumber.trim()]);
            if (!found.rows[0]) {
                throw new common_1.NotFoundException(`Active employee with SAP ID ${dto.targetPersonNumber} not found`);
            }
            targetId = found.rows[0].id;
        }
        if (!targetId) {
            throw new common_1.BadRequestException('Target employee ID or SAP ID is required');
        }
        const phoneDuplicates = await this.findDuplicates(co, {
            phoneNumber: releasedPhone,
            excludeId: targetId,
        });
        if (phoneDuplicates.length) {
            throw new common_1.ConflictException({
                message: 'Phone number is already assigned',
                conflicts: phoneDuplicates,
            });
        }
        const targetPatch = JSON.stringify({
            reassignedFrom: sourceId,
            reassignedPhone: releasedPhone,
        });
        await this.db.query(`UPDATE sim_employees SET
        phone_number = $1,
        reassigned_from_id = $2,
        excel_row_data = COALESCE(excel_row_data, '{}'::jsonb) || $3::jsonb,
        updated_at = NOW()
       WHERE id = $4 AND co = $5 AND is_active = TRUE`, [releasedPhone, sourceId, targetPatch, targetId, co]);
        await this.db.query(`UPDATE sim_employees SET reassigned_to_id = $1, updated_at = NOW()
       WHERE id = $2 AND co = $3`, [targetId, sourceId, co]);
        const target = await this.getEmployeeOrThrow(co, targetId);
        return {
            sourceId,
            targetId,
            phoneNumber: releasedPhone,
            target,
        };
    }
    resolveLineTypeFromInput(phone, personNumber, lineType) {
        if (lineType)
            return lineType;
        const fromPhone = this.getLineType(phone);
        if (fromPhone === 'landline')
            return 'landline';
        if (this.isSyntheticPersonNumber(personNumber)) {
            return personNumber.startsWith('LL-') ? 'landline' : 'department';
        }
        return 'mobile';
    }
    async createEmployee(co, dto) {
        const phone = this.normalizePhone(dto.phoneNumber);
        if (!phone) {
            throw new common_1.BadRequestException('Invalid phone number');
        }
        const duplicates = await this.findDuplicates(co, {
            phoneNumber: phone,
            personNumber: dto.personNumber,
            displayName: dto.displayName,
        });
        if (duplicates.length) {
            throw new common_1.ConflictException({
                message: 'Information already exists in master',
                conflicts: duplicates,
            });
        }
        const lineType = this.resolveLineTypeFromInput(phone, dto.personNumber, dto.lineType);
        const billing = (0, sim_master_billing_util_1.calculateBilling)(dto.packageLimit ?? 0, dto.additionalAmount ?? 0);
        let resolved;
        if (this.isAutoImportedLine(lineType)) {
            resolved = {
                personNumber: dto.personNumber,
                displayName: dto.displayName,
                firstName: null,
                lastName: null,
                email: dto.email ?? null,
                emailSource: null,
                positionName: null,
                departmentName: null,
                matched: true,
                errors: [],
            };
        }
        else {
            resolved = await this.resolveEmployee(co, dto.personNumber, dto.displayName);
            if (dto.email) {
                resolved.email = dto.email;
            }
            resolved.displayName = resolved.displayName || dto.displayName;
        }
        const result = await this.db.query(`INSERT INTO sim_employees (
        co, person_number, phone_number, line_type, first_name, last_name,
        display_name, email, position_name, department_name,
        package_value, vat_amount, additional_amount, total_amount,
        excel_row_data, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, TRUE)
      RETURNING *`, [
            co,
            dto.personNumber,
            phone,
            lineType,
            resolved.firstName,
            resolved.lastName,
            resolved.displayName,
            resolved.email,
            resolved.positionName,
            resolved.departmentName,
            billing.packageLimit,
            billing.vatAmount,
            billing.additionalAmount,
            billing.totalAmount,
            JSON.stringify({
                source: 'manual',
                emailSource: resolved.emailSource,
                importWarnings: resolved.errors,
            }),
        ]);
        return result.rows[0];
    }
    async lookupSapProfile(co, personNumber, displayName) {
        const trimmed = personNumber.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('SAP ID is required');
        }
        const resolved = await this.resolveEmployee(co, trimmed, displayName?.trim() || null);
        return {
            displayName: resolved.displayName,
            email: resolved.email,
            emailSource: resolved.emailSource,
            positionName: resolved.positionName,
            departmentName: resolved.departmentName,
            matched: resolved.matched,
            errors: resolved.errors,
        };
    }
};
exports.SimMasterService = SimMasterService;
exports.SimMasterService = SimMasterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        oracle_employee_service_1.OracleEmployeeService,
        bi_employee_service_1.BiEmployeeService])
], SimMasterService);
//# sourceMappingURL=sim-master.service.js.map