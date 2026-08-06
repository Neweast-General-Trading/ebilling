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
exports.BiEmployeeService = void 0;
const common_1 = require("@nestjs/common");
const hana_service_1 = require("../hana/hana.service");
let BiEmployeeService = class BiEmployeeService {
    hana;
    constructor(hana) {
        this.hana = hana;
    }
    async getEmployeeByCode(co, personNumber, options = {}) {
        const normalized = String(personNumber).trim();
        if (!normalized)
            return null;
        const activeFilter = options.includeInactive ? '' : "AND USER_ACTIVE = 'Y'";
        const rows = await this.hana.executeQuery(co, `SELECT TOP 1 USER_EMAIL, EMP_FULLNAME, EMP_ID, ORACLEEMPID
       FROM BI_USERMASTER
       WHERE (
         TO_NVARCHAR(ORACLEEMPID) = ?
         OR TO_NVARCHAR(EMP_ID) = ?
       )
       AND USERTYPE = 'U'
       ${activeFilter}
       AND EMP_ID != '0'`, [normalized, normalized]);
        const row = rows[0];
        if (!row)
            return null;
        return {
            email: row.USER_EMAIL?.trim() || null,
            displayName: row.EMP_FULLNAME?.trim() || null,
            empId: row.EMP_ID != null ? String(row.EMP_ID) : null,
            oracleEmpId: row.ORACLEEMPID != null ? String(row.ORACLEEMPID) : null,
        };
    }
};
exports.BiEmployeeService = BiEmployeeService;
exports.BiEmployeeService = BiEmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hana_service_1.HanaService])
], BiEmployeeService);
//# sourceMappingURL=bi-employee.service.js.map