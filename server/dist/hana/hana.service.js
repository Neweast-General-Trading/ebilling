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
var HanaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HanaService = void 0;
const common_1 = require("@nestjs/common");
const hanaClient = __importStar(require("@sap/hana-client"));
const database_config_1 = require("../config/database.config");
let HanaService = HanaService_1 = class HanaService {
    logger = new common_1.Logger(HanaService_1.name);
    async executeQuery(co, sql, params = []) {
        const base = database_config_1.databaseConfig[co];
        if (!base) {
            this.logger.warn(`No HANA config for company ${co}`);
            return [];
        }
        const config = {
            ...base,
            uid: process.env.HANA_UID || process.env.SAP_HANA_USER || base.uid,
            pwd: process.env.HANA_PASSWORD || process.env.SAP_HANA_PASSWORD || base.pwd,
            currentSchema: process.env.SAP_HANA_SCHEMA || base.currentSchema,
        };
        const connection = hanaClient.createConnection();
        try {
            await new Promise((resolve, reject) => {
                connection.connect(config, (err) => (err ? reject(err) : resolve()));
            });
            return await new Promise((resolve, reject) => {
                const statement = connection.prepare(sql);
                statement.exec(params, (err, result) => {
                    statement.drop();
                    if (err)
                        reject(err);
                    else
                        resolve(result || []);
                });
            });
        }
        catch (error) {
            this.logger.warn(`HANA query failed for ${co}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
        finally {
            try {
                connection.disconnect();
            }
            catch {
            }
        }
    }
};
exports.HanaService = HanaService;
exports.HanaService = HanaService = HanaService_1 = __decorate([
    (0, common_1.Injectable)()
], HanaService);
//# sourceMappingURL=hana.service.js.map