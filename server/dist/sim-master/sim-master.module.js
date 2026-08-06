"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimMasterModule = void 0;
const common_1 = require("@nestjs/common");
const sim_master_controller_1 = require("./sim-master.controller");
const sim_master_service_1 = require("./sim-master.service");
const oracle_module_1 = require("../oracle/oracle.module");
const bi_module_1 = require("../bi/bi.module");
let SimMasterModule = class SimMasterModule {
};
exports.SimMasterModule = SimMasterModule;
exports.SimMasterModule = SimMasterModule = __decorate([
    (0, common_1.Module)({
        imports: [oracle_module_1.OracleModule, bi_module_1.BiModule],
        controllers: [sim_master_controller_1.SimMasterController],
        providers: [sim_master_service_1.SimMasterService],
        exports: [sim_master_service_1.SimMasterService],
    })
], SimMasterModule);
//# sourceMappingURL=sim-master.module.js.map