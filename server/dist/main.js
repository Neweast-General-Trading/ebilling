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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const app_module_1 = require("./app.module");
const multer_upload_config_1 = require("./config/multer-upload.config");
const upload_exception_filter_1 = require("./common/filters/upload-exception.filter");
async function bootstrap() {
    if (process.env.NODE_ENV === 'production' && process.env.DEV_BYPASS_EMAIL?.trim()) {
        throw new Error('DEV_BYPASS_EMAIL must not be set in production');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('RecTracking');
    fs.mkdirSync(multer_upload_config_1.uploadTmpDir, { recursive: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
    }));
    app.useGlobalFilters(new upload_exception_filter_1.UploadExceptionFilter());
    const allowedOrigins = (process.env.CORS_ORIGINS ||
        'https://ebilling.neweast.cloud,https://mis.neweast.cloud,http://localhost:5173,http://localhost:4173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.disable('x-powered-by');
    if (process.env.SWAGGER_ENABLED === 'true') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('RecTracking — e& SIM Billing')
            .setVersion('1.0.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document);
    }
    const port = Number(process.env.PORT || 5041);
    await app.listen(port, '0.0.0.0');
    logger.log(`RecTracking API listening on ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map