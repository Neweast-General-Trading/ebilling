"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleModule = void 0;
const common_1 = require("@nestjs/common");
const oracle_employee_service_1 = require("./oracle-employee.service");
const oracle_recovery_service_1 = require("./oracle-recovery.service");
let OracleModule = class OracleModule {
};
exports.OracleModule = OracleModule;
exports.OracleModule = OracleModule = __decorate([
    (0, common_1.Module)({
        exports: [oracle_employee_service_1.OracleEmployeeService, oracle_recovery_service_1.OracleRecoveryService],
        providers: [oracle_employee_service_1.OracleEmployeeService, oracle_recovery_service_1.OracleRecoveryService],
    })
], OracleModule);
//# sourceMappingURL=oracle.module.js.map