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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamplesService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SAMPLES_DIR = path.resolve(process.cwd(), process.env.SAMPLES_DIR || '../samples');
const META_FILE = '.uploads-meta.json';
let SamplesService = class SamplesService {
    ensureDir() {
        fs.mkdirSync(SAMPLES_DIR, { recursive: true });
        return SAMPLES_DIR;
    }
    metaPath() {
        return path.join(this.ensureDir(), META_FILE);
    }
    readMeta() {
        const metaFile = this.metaPath();
        if (!fs.existsSync(metaFile)) {
            return {};
        }
        try {
            const raw = fs.readFileSync(metaFile, 'utf8');
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        }
        catch {
            return {};
        }
    }
    writeMeta(meta) {
        fs.writeFileSync(this.metaPath(), JSON.stringify(meta, null, 2), 'utf8');
    }
    assertSafeFilename(name) {
        if (!name || typeof name !== 'string') {
            throw new common_1.BadRequestException('File name is required');
        }
        const base = path.basename(name);
        if (base !== name || base.startsWith('.') || base === META_FILE) {
            throw new common_1.BadRequestException('Invalid file name');
        }
        return base;
    }
    resolveFilePath(name) {
        const safeName = this.assertSafeFilename(name);
        const full = path.join(SAMPLES_DIR, safeName);
        if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
            throw new common_1.NotFoundException(`File not found: ${safeName}`);
        }
        return { name: safeName, path: full };
    }
    listFiles() {
        this.ensureDir();
        const meta = this.readMeta();
        const files = fs.readdirSync(SAMPLES_DIR).filter((name) => {
            const full = path.join(SAMPLES_DIR, name);
            return fs.statSync(full).isFile() && !name.startsWith('.');
        });
        return files.map((name) => {
            const full = path.join(SAMPLES_DIR, name);
            const stat = fs.statSync(full);
            const entry = meta[name];
            return {
                name,
                size: stat.size,
                uploadedAt: stat.mtime.toISOString(),
                uploadedBy: entry?.uploadedBy || null,
            };
        });
    }
    saveUploadedFile(file, uploadedBy) {
        this.ensureDir();
        const safeName = this.assertSafeFilename(file.originalname);
        const dest = path.join(SAMPLES_DIR, safeName);
        fs.copyFileSync(file.path, dest);
        fs.unlinkSync(file.path);
        const stat = fs.statSync(dest);
        const email = uploadedBy?.trim() || null;
        const meta = this.readMeta();
        meta[safeName] = {
            uploadedBy: email,
            uploadedAt: stat.mtime.toISOString(),
        };
        this.writeMeta(meta);
        return {
            name: safeName,
            size: stat.size,
            path: dest,
            uploadedAt: stat.mtime.toISOString(),
            uploadedBy: email,
        };
    }
    getDownloadTarget(name) {
        return this.resolveFilePath(name);
    }
};
exports.SamplesService = SamplesService;
exports.SamplesService = SamplesService = __decorate([
    (0, common_1.Injectable)()
], SamplesService);
//# sourceMappingURL=samples.service.js.map
