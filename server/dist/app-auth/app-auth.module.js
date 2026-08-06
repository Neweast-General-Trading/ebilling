"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthModule = void 0;
const common_1 = require("@nestjs/common");
const hana_module_1 = require("../hana/hana.module");
const app_auth_controller_1 = require("./app-auth.controller");
const app_auth_service_1 = require("./app-auth.service");
const app_auth_guard_1 = require("./app-auth.guard");
let AppAuthModule = class AppAuthModule {
};
exports.AppAuthModule = AppAuthModule;
exports.AppAuthModule = AppAuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [hana_module_1.HanaModule],
        controllers: [app_auth_controller_1.AppAuthController],
        providers: [app_auth_service_1.AppAuthService, app_auth_guard_1.AppAuthGuard],
        exports: [app_auth_service_1.AppAuthService, app_auth_guard_1.AppAuthGuard],
    })
], AppAuthModule);
//# sourceMappingURL=app-auth.module.js.map