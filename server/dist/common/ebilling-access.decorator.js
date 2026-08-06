"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipEbillingCoCheck = exports.RequireEbillingPermission = exports.EBILLING_SKIP_CO_KEY = exports.EBILLING_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.EBILLING_PERMISSION_KEY = 'ebilling_permission';
exports.EBILLING_SKIP_CO_KEY = 'ebilling_skip_co';
const RequireEbillingPermission = (permission) => (0, common_1.SetMetadata)(exports.EBILLING_PERMISSION_KEY, permission);
exports.RequireEbillingPermission = RequireEbillingPermission;
const SkipEbillingCoCheck = () => (0, common_1.SetMetadata)(exports.EBILLING_SKIP_CO_KEY, true);
exports.SkipEbillingCoCheck = SkipEbillingCoCheck;
//# sourceMappingURL=ebilling-access.decorator.js.map
