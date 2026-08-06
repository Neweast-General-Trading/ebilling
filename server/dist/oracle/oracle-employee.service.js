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
var OracleEmployeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleEmployeeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let OracleEmployeeService = OracleEmployeeService_1 = class OracleEmployeeService {
    logger = new common_1.Logger(OracleEmployeeService_1.name);
    getAuthHeader() {
        const username = process.env.ORACLE_USERNAME || '';
        const password = process.env.ORACLE_PASSWORD || '';
        return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    }
    async getEmployeeByPersonNumber(personNumber) {
        const baseUrl = process.env.ORACLE_API_URL_BY_PERSON ||
            'https://iabney.fa.ocs.oraclecloud.com/hcmRestApi/resources/11.13.18.05/workers?expand=workRelationships.assignments,names,emails&q=PersonNumber=';
        const normalized = String(personNumber).trim();
        if (!normalized)
            return null;
        try {
            const { data } = await axios_1.default.get(`${baseUrl}${normalized}`, {
                headers: {
                    Authorization: this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            });
            const worker = data?.items?.[0];
            if (!worker)
                return null;
            return this.mapWorker(worker);
        }
        catch (error) {
            this.logger.warn(`Oracle lookup failed for ${personNumber}: ${error instanceof Error ? error.message : error}`);
            return null;
        }
    }
    mapWorker(worker) {
        const names = worker.names || [];
        const emails = worker.emails || [];
        const workRelationships = worker.workRelationships || [];
        const primaryName = names.find((n) => n?.PrimaryFlag === true) || names[0] || {};
        const workEmail = emails.find((e) => String(e?.EmailType || '').toLowerCase().includes('work') ||
            e?.PrimaryFlag === true) || emails[0];
        const activeRelationship = workRelationships.find((wr) => wr?.PrimaryFlag === true) ||
            workRelationships[0];
        const assignments = activeRelationship?.assignments || [];
        const primaryAssignment = assignments.find((a) => a?.PrimaryAssignmentFlag === true) ||
            assignments[0] ||
            {};
        const firstName = primaryName.FirstName || null;
        const lastName = primaryName.LastName || null;
        const displayName = primaryName.DisplayName ||
            [firstName, lastName].filter(Boolean).join(' ') ||
            null;
        return {
            personNumber: String(worker.PersonNumber || ''),
            personId: worker.PersonId ?? null,
            firstName,
            lastName,
            displayName,
            email: workEmail?.EmailAddress || null,
            positionName: primaryAssignment.PositionName || null,
            departmentName: primaryAssignment.DepartmentName || null,
            jobName: primaryAssignment.JobName || null,
            legalEmployerName: primaryAssignment.LegalEmployerName || null,
        };
    }
};
exports.OracleEmployeeService = OracleEmployeeService;
exports.OracleEmployeeService = OracleEmployeeService = OracleEmployeeService_1 = __decorate([
    (0, common_1.Injectable)()
], OracleEmployeeService);
//# sourceMappingURL=oracle-employee.service.js.map