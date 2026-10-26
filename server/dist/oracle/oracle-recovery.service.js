"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OracleRecoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleRecoveryService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let OracleRecoveryService = OracleRecoveryService_1 = class OracleRecoveryService {
    logger = new common_1.Logger(OracleRecoveryService_1.name);
    getAuth() {
        const username = process.env.ORACLE_USERNAME || '';
        const password = process.env.ORACLE_PASSWORD || '';
        return { username, password };
    }
    getHost() {
        return (process.env.ORACLE_HCM_HOST ||
            'https://iabney.fa.ocs.oraclecloud.com').replace(/\/$/, '');
    }
    getHcmBase() {
        return (process.env.ORACLE_HCM_API_BASE ||
            `${this.getHost()}/hcmRestApi/resources/11.13.18.05`).replace(/\/$/, '');
    }
    getReportUrl() {
        return (process.env.ORACLE_BIP_REPORT_URL ||
            `${this.getHost()}/xmlpserver/services/ExternalReportWSSService`);
    }
    getReportPath() {
        return (process.env.ORACLE_BIP_REPORT_PATH ||
            '/Integration Reports/Integration_Report_1.xdo');
    }
    getLegislationKey() {
        const raw = String(process.env.ORACLE_RECOVERY_LEGISLATION || 'UAE').trim().toUpperCase();
        if (raw === 'SA' || raw === 'SAUDI' || raw === 'SAUDI ARABIA')
            return 'KSA';
        if (raw === 'OM' || raw === 'OMN')
            return 'OMAN';
        if (raw === 'AE' || raw === 'U.A.E')
            return 'UAE';
        return raw || 'UAE';
    }
    getLegislationElementIds(legislation) {
        const map = {
            UAE: { elementTypeId: '300000007152917', inputValueId: '300000007152969', elementName: 'Other Deduction' },
            KSA: { elementTypeId: '300000007223473', inputValueId: '300000007223553', elementName: 'Other Deduction' },
            OMAN: { elementTypeId: '300000007220741', inputValueId: '300000007220773', elementName: 'Other Deduction' },
        };
        return map[legislation] || map.UAE;
    }
    getElementNameCandidates() {
        const configured = process.env.ORACLE_RECOVERY_ELEMENT_NAME?.trim();
        const fromLegislation = this.getLegislationElementIds(this.getLegislationKey()).elementName;
        const elementName = configured || fromLegislation || 'Other Deduction';
        return [elementName];
    }
    isRecoveryElementName(elementName) {
        const allowed = this.getElementNameCandidates().map((name) => name.toLowerCase());
        const normalized = String(elementName || '').trim().toLowerCase();
        return allowed.some((name) => normalized === name);
    }
    pickAmountInputValue(items) {
        if (!items?.length) {
            return null;
        }
        const numeric = items.find((item) => {
            const raw = item?.ScreenEntryValue;
            if (raw === null || raw === undefined || String(raw).trim() === '') {
                return false;
            }
            const parsed = Number(raw);
            return !Number.isNaN(parsed);
        });
        if (numeric?.InputValueId) {
            return numeric;
        }
        const named = items.find((item) => {
            const label = String(item?.InputName || item?.Name || item?.ValueName || '').toLowerCase();
            return label.includes('amount') ||
                label.includes('value') ||
                label.includes('deduction');
        });
        if (named?.InputValueId) {
            return named;
        }
        return items.find((item) => item?.InputValueId) || null;
    }
    async pushRecoveryAmount(personNumber, amount) {
        const normalizedPerson = String(personNumber).trim();
        const normalizedAmount = Math.round(amount * 100) / 100;
        if (!normalizedPerson) {
            throw new Error('Person number is required');
        }
        if (normalizedAmount <= 0) {
            throw new Error('Recovery amount must be greater than zero');
        }
        try {
            const target = await this.resolveRecoveryRowViaReport(normalizedPerson);
            return this.pushWithRow(target, normalizedPerson, normalizedAmount, 'bi_report');
        }
        catch (reportError) {
            const reportMessage = reportError instanceof Error ? reportError.message : String(reportError);
            this.logger.warn(`BI report unavailable for ${normalizedPerson}, using REST fallback: ${reportMessage}`);
            const target = await this.resolveRecoveryRowViaRest(normalizedPerson);
            return this.pushWithRow(target, normalizedPerson, normalizedAmount, 'rest_api');
        }
    }
    async pushWithRow(target, personNumber, amount, source) {
        if (target.existingAmount === null) {
            const created = await this.createElementEntry(target, amount);
            return {
                action: 'created',
                personNumber,
                elementName: target.elementName,
                amount,
                source,
                oracleResponse: created,
            };
        }
        const updated = await this.updateElementEntry(target, amount);
        return {
            action: 'updated',
            personNumber,
            elementName: target.elementName,
            amount,
            source,
            oracleResponse: updated,
        };
    }
    async resolveRecoveryRowViaReport(personNumber) {
        const elementNames = this.getElementNameCandidates();
        const csv = await this.runIntegrationReport(personNumber, elementNames[0]);
        const rows = this.parseReportCsv(csv);
        const target = rows.find((row) => this.isRecoveryElementName(row.elementName));
        if (!target) {
            throw new Error(`Oracle report returned no ${elementNames[0]} row for person ${personNumber}`);
        }
        return target;
    }
    async resolveRecoveryRowViaRest(personNumber) {
        const worker = await this.getWorkerContext(personNumber);
        const elementNames = this.getElementNameCandidates();
        for (const elementName of elementNames) {
            const existing = await this.findPersonElementEntry(worker.personId, elementName);
            if (existing) {
                return {
                    personNumber,
                    personId: String(worker.personId),
                    assignmentId: String(existing.assignmentId || worker.assignmentId || ''),
                    elementTypeId: String(existing.elementTypeId),
                    inputValueId: String(existing.inputValueId),
                    elementName: existing.elementName,
                    existingAmount: existing.existingAmount,
                };
            }
        }
        const template = await this.resolveElementTemplate(elementNames);
        return {
            personNumber,
            personId: String(worker.personId),
            assignmentId: String(worker.assignmentId),
            elementTypeId: template.elementTypeId,
            inputValueId: template.inputValueId,
            elementName: template.elementName,
            existingAmount: null,
        };
    }
    normalizeCompareText(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9@.\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    namesLikelyMatch(masterName, oracleName) {
        const left = this.normalizeCompareText(masterName);
        const right = this.normalizeCompareText(oracleName);
        if (!left || !right) {
            return false;
        }
        if (left === right) {
            return true;
        }
        return left.includes(right) || right.includes(left);
    }
    emailsLikelyMatch(masterEmail, oracleEmail) {
        const left = this.normalizeCompareText(masterEmail);
        const right = this.normalizeCompareText(oracleEmail);
        if (!left || !right) {
            return true;
        }
        return left === right;
    }
    async fetchWorkerByPersonNumber(personNumber) {
        const baseUrl = process.env.ORACLE_API_URL_BY_PERSON ||
            `${this.getHcmBase()}/workers?expand=workRelationships.assignments,names,emails&q=PersonNumber=`;
        const { data } = await axios_1.default.get(`${baseUrl}${personNumber}`, {
            auth: this.getAuth(),
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
        });
        const worker = data?.items?.[0];
        if (!worker?.PersonId) {
            return null;
        }
        const names = worker.names || [];
        const emails = worker.emails || [];
        const workRelationships = worker.workRelationships || [];
        const activeRelationship = workRelationships.find((item) => item?.PrimaryFlag === true) ||
            workRelationships[0];
        const assignments = activeRelationship?.assignments || [];
        const primaryAssignment = assignments.find((item) => item?.PrimaryAssignmentFlag === true) ||
            assignments[0] ||
            {};
        const primaryName = names.find((item) => item?.PrimaryFlag === true) || names[0] || {};
        const workEmail = emails.find((item) => String(item?.EmailType || '').toLowerCase().includes('work') ||
            item?.PrimaryFlag === true) || emails[0];
        const displayName = primaryName.DisplayName ||
            [primaryName.FirstName, primaryName.LastName].filter(Boolean).join(' ') ||
            null;
        return {
            personNumber: String(worker.PersonNumber || personNumber),
            personId: worker.PersonId,
            assignmentId: primaryAssignment?.AssignmentId ?? null,
            displayName,
            firstName: primaryName.FirstName || null,
            lastName: primaryName.LastName || null,
            email: workEmail?.EmailAddress || null,
            departmentName: primaryAssignment?.DepartmentName || null,
            jobName: primaryAssignment?.JobName || null,
            positionName: primaryAssignment?.PositionName || null,
        };
    }
    async getWorkerContext(personNumber) {
        const worker = await this.fetchWorkerByPersonNumber(personNumber);
        if (!worker?.personId) {
            throw new Error(`Oracle worker not found for person ${personNumber}`);
        }
        if (!worker.assignmentId) {
            throw new Error(`Oracle assignment not found for person ${personNumber}`);
        }
        return {
            personId: worker.personId,
            assignmentId: worker.assignmentId,
        };
    }
    async resolveRecoveryTarget(personNumber) {
        const elementNames = this.getElementNameCandidates();
        try {
            const target = await this.resolveRecoveryRowViaReport(personNumber);
            return { target, source: 'bi_report', error: null };
        }
        catch (reportError) {
            const reportMessage = reportError instanceof Error ? reportError.message : String(reportError);
            this.logger.warn(`BI report unavailable for ${personNumber}, using REST fallback: ${reportMessage}`);
            try {
                const target = await this.resolveRecoveryRowViaRest(personNumber);
                return { target, source: 'rest_api', error: null };
            }
            catch (restError) {
                const restMessage = restError instanceof Error ? restError.message : String(restError);
                return { target: null, source: null, error: restMessage };
            }
        }
    }
    async previewRecoveryAmount(personNumber, amount) {
        const normalizedPerson = String(personNumber).trim();
        const normalizedAmount = Math.round(amount * 100) / 100;
        const oracle = await this.fetchWorkerByPersonNumber(normalizedPerson);
        const resolved = await this.resolveRecoveryTarget(normalizedPerson);
        const target = resolved.target;
        const plannedAction = !target
            ? null
            : target.existingAmount === null
                ? 'create'
                : 'update';
        return {
            amount: normalizedAmount,
            oracle,
            target,
            resolveSource: resolved.source,
            resolveError: resolved.error,
            plannedAction,
            elementName: target?.elementName ?? null,
            existingAmount: target?.existingAmount ?? null,
            environment: this.getHost().replace(/^https?:\/\//, ''),
        };
    }
    async findPersonElementEntry(personId, elementName) {
        const { data } = await axios_1.default.get(`${this.getHcmBase()}/elementEntries`, {
            auth: this.getAuth(),
            params: {
                q: `PersonId=${personId};ElementName='${elementName}'`,
                links: 'child',
                limit: 1,
            },
            timeout: 120000,
        });
        const entry = data.items?.[0];
        if (!entry?.ElementTypeId || !entry.ElementName) {
            return null;
        }
        const valuesLink = entry.links?.find((link) => link.name === 'elementEntryValues' && link.kind === 'collection');
        if (!valuesLink?.href) {
            return null;
        }
        const { data: valuesData } = await axios_1.default.get(valuesLink.href, {
            auth: this.getAuth(),
            params: { links: 'self' },
            timeout: 120000,
        });
        const valueItem = valuesData.items?.find((item) => item.InputValueId);
        const amountItem = this.pickAmountInputValue(valuesData.items || []);
        const chosen = amountItem || valueItem;
        if (!chosen?.InputValueId) {
            return null;
        }
        const rawAmount = chosen.ScreenEntryValue;
        const parsedAmount = rawAmount !== null &&
            rawAmount !== undefined &&
            String(rawAmount).trim() !== ''
            ? Number(rawAmount)
            : null;
        return {
            elementTypeId: entry.ElementTypeId,
            elementName: entry.ElementName,
            assignmentId: entry.AssignmentId,
            inputValueId: chosen.InputValueId,
            existingAmount: parsedAmount !== null && !Number.isNaN(parsedAmount)
                ? parsedAmount
                : null,
        };
    }
    async resolveElementTemplate(elementNames) {
        const legislation = this.getLegislationKey();
        const legislative = this.getLegislationElementIds(legislation);
        const configuredTypeId = process.env.ORACLE_RECOVERY_ELEMENT_TYPE_ID || legislative.elementTypeId;
        const configuredInputId = process.env.ORACLE_RECOVERY_INPUT_VALUE_ID || legislative.inputValueId;
        const configuredName = process.env.ORACLE_RECOVERY_ELEMENT_NAME || legislative.elementName || elementNames[0];
        this.logger.log(`Oracle Other Deduction IDs for ${legislation}: ElementTypeId=${configuredTypeId} InputValueId=${configuredInputId}`);
        if (configuredTypeId && configuredInputId) {
            return {
                elementTypeId: configuredTypeId,
                inputValueId: configuredInputId,
                elementName: configuredName,
                legislation,
            };
        }
        for (const elementName of elementNames) {
            const { data } = await axios_1.default.get(`${this.getHcmBase()}/elementEntries`, {
                auth: this.getAuth(),
                params: {
                    q: `ElementName='${elementName}'`,
                    links: 'child',
                    limit: 1,
                },
                timeout: 120000,
            });
            const entry = data.items?.[0];
            const valuesLink = entry?.links?.find((link) => link.name === 'elementEntryValues' && link.kind === 'collection');
            if (!entry?.ElementTypeId || !entry.ElementName || !valuesLink?.href) {
                continue;
            }
            const { data: valuesData } = await axios_1.default.get(valuesLink.href, {
                auth: this.getAuth(),
                params: { links: 'self' },
                timeout: 120000,
            });
            const inputValueId = this.pickAmountInputValue(valuesData.items || [])?.InputValueId ||
                valuesData.items?.find((item) => item.InputValueId)?.InputValueId;
            if (!inputValueId) {
                continue;
            }
            return {
                elementTypeId: String(entry.ElementTypeId),
                inputValueId: String(inputValueId),
                elementName: entry.ElementName,
            };
        }
        throw new Error('Could not resolve Oracle recovery element metadata. Configure ORACLE_RECOVERY_ELEMENT_TYPE_ID and ORACLE_RECOVERY_INPUT_VALUE_ID, or deploy the BI integration report.');
    }
    async runIntegrationReport(personNumber, elementName) {
        const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:pub="http://xmlns.oracle.com/oxp/service/PublicReportService">
  <soap:Header/>
  <soap:Body>
    <pub:runReport>
      <pub:reportRequest>
        <pub:parameterNameValues>
          <pub:item>
            <pub:name>person_number</pub:name>
            <pub:values><pub:item>${this.escapeXml(personNumber)}</pub:item></pub:values>
          </pub:item>
          <pub:item>
            <pub:name>base_element_name</pub:name>
            <pub:values><pub:item>${this.escapeXml(elementName)}</pub:item></pub:values>
          </pub:item>
        </pub:parameterNameValues>
        <pub:reportAbsolutePath>${this.escapeXml(this.getReportPath())}</pub:reportAbsolutePath>
        <pub:sizeOfDataChunkDownload>-1</pub:sizeOfDataChunkDownload>
      </pub:reportRequest>
    </pub:runReport>
  </soap:Body>
</soap:Envelope>`;
        const { data } = await axios_1.default.post(this.getReportUrl(), soapBody, {
            auth: this.getAuth(),
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                SOAPAction: '',
            },
            timeout: 120000,
            responseType: 'text',
        });
        const faultMatch = String(data).match(/<(?:[\w:]+:)?Text[^>]*>([^<]+Report definition not found[^<]*)<\//i);
        if (faultMatch?.[1]) {
            throw new Error(faultMatch[1]);
        }
        const match = String(data).match(/<(?:[\w:]+:)?reportBytes>([\s\S]*?)<\/(?:[\w:]+:)?reportBytes>/i);
        if (!match?.[1]) {
            const faultText = String(data).match(/<(?:[\w:]+:)?Text[^>]*>([^<]+)<\//i)?.[1];
            throw new Error(faultText || 'Oracle BI report did not return reportBytes');
        }
        return Buffer.from(match[1].trim(), 'base64')
            .toString('utf-8')
            .replace(/^\uFEFF/, '');
    }
    parseReportCsv(csv) {
        const lines = csv
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        if (lines.length < 2)
            return [];
        const headers = this.parseCsvLine(lines[0]).map((value) => value.trim().toUpperCase());
        const indexOf = (name) => headers.findIndex((h) => h === name);
        const personIdIdx = indexOf('PERSON_ID');
        const elementTypeIdx = indexOf('ELEMENT_TYPE_ID');
        const assignmentIdx = indexOf('ASSIGNMENT_ID');
        const inputValueIdx = indexOf('INPUT_VALUE_ID');
        const elementNameIdx = headers.lastIndexOf('BASE_ELEMENT_NAME');
        const amountIdx = indexOf('ELEMENT_AMOUNT_VALUE');
        const personNumberIdx = indexOf('PERSON_NUMBER');
        const rows = [];
        for (const line of lines.slice(1)) {
            const cols = this.parseCsvLine(line);
            const elementName = cols[elementNameIdx] || cols[1] || '';
            if (!elementName)
                continue;
            const rawAmount = amountIdx >= 0 ? cols[amountIdx] : '';
            const parsedAmount = rawAmount && rawAmount.trim() !== '' ? Number(rawAmount) : null;
            rows.push({
                personNumber: cols[personNumberIdx] || '',
                personId: cols[personIdIdx] || '',
                elementTypeId: cols[elementTypeIdx] || '',
                assignmentId: cols[assignmentIdx] || '',
                inputValueId: cols[inputValueIdx] || '',
                elementName: elementName.replace(/^"|"$/g, ''),
                existingAmount: parsedAmount !== null && !Number.isNaN(parsedAmount)
                    ? parsedAmount
                    : null,
            });
        }
        return rows;
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        result.push(current.trim());
        return result;
    }
    formatOracleHttpError(error) {
        const response = error?.response;
        if (response?.data !== undefined && response?.data !== null) {
            const body = response.data;
            if (typeof body === 'string' && body.trim()) {
                return body.trim();
            }
            if (typeof body === 'object') {
                const detail = body.detail || body.message || body.title;
                if (detail) {
                    return String(detail);
                }
                try {
                    return JSON.stringify(body);
                }
                catch {
                    return String(body);
                }
            }
        }
        return error instanceof Error ? error.message : String(error);
    }
    async createElementEntry(row, amount) {
        const url = `${this.getHcmBase()}/elementEntries`;
        const payload = {
            PersonId: Number(row.personId),
            ElementTypeId: Number(row.elementTypeId),
            AssignmentId: Number(row.assignmentId),
            EntryType: 'E',
            CreatorType: 'F',
            EntrySequence: 1,
            elementEntryValues: [
                {
                    InputValueId: Number(row.inputValueId),
                    ScreenEntryValue: String(amount),
                },
            ],
        };
        try {
            const { data } = await axios_1.default.post(url, payload, {
                auth: this.getAuth(),
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000,
            });
            return data;
        }
        catch (error) {
            throw new Error(this.formatOracleHttpError(error));
        }
    }
    async updateElementEntry(row, amount) {
        const finderUrl = `${this.getHcmBase()}/elementEntries`;
        const { data: searchData } = await axios_1.default.get(finderUrl, {
            auth: this.getAuth(),
            params: {
                q: `PersonId=${row.personId};ElementName='${row.elementName}'`,
                links: 'child',
            },
            timeout: 120000,
        });
        const entry = searchData.items?.[0];
        if (!entry) {
            throw new Error(`Existing Oracle element entry not found for person ${row.personNumber}`);
        }
        const valuesLink = entry.links?.find((link) => link.name === 'elementEntryValues' && link.kind === 'collection');
        if (!valuesLink?.href) {
            throw new Error('Oracle elementEntryValues link not found');
        }
        const { data: valuesData } = await axios_1.default.get(valuesLink.href, {
            auth: this.getAuth(),
            params: {
                links: 'self',
                q: `InputValueId='${row.inputValueId}'`,
            },
            timeout: 120000,
        });
        const valueItem = valuesData.items?.[0];
        const selfLink = valueItem?.links?.find((link) => link.rel === 'self' && link.name === 'elementEntryValues');
        if (!selfLink?.href) {
            throw new Error('Oracle elementEntryValues self link not found');
        }
        const effectiveStart = entry.EffectiveStartDate || new Date().toISOString().slice(0, 10);
        const { data } = await axios_1.default.patch(selfLink.href, { ScreenEntryValue: amount }, {
            auth: this.getAuth(),
            headers: {
                'Content-Type': 'application/vnd.oracle.adf.resourceitem+json',
                'Effective-Of': `RangeMode=CORRECTION;RangeStartDate=${effectiveStart}`,
            },
            timeout: 120000,
        });
        return data;
    }
    escapeXml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
exports.OracleRecoveryService = OracleRecoveryService;
exports.OracleRecoveryService = OracleRecoveryService = OracleRecoveryService_1 = __decorate([
    (0, common_1.Injectable)()
], OracleRecoveryService);
//# sourceMappingURL=oracle-recovery.service.js.map