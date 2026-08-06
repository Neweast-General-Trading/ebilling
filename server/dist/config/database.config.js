"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.databaseConfig = {
    BI_NEGT: {
        serverNode: process.env.HANA_SERVER || '172.1.0.7:30015',
        uid: process.env.HANA_UID || process.env.SAP_HANA_USER || 'NETUSR',
        pwd: process.env.HANA_PASSWORD || process.env.SAP_HANA_PASSWORD || '',
        currentSchema: process.env.SAP_HANA_SCHEMA || 'BI_NEGT',
        pooling: true,
        connectionLifetime: 1800,
    },
    BI_NESA: {
        serverNode: process.env.HANA_SERVER || '172.1.0.7:30015',
        uid: process.env.HANA_UID || process.env.SAP_HANA_USER || 'NETUSR',
        pwd: process.env.HANA_PASSWORD || process.env.SAP_HANA_PASSWORD || '',
        currentSchema: 'BI_NESA',
        pooling: true,
        connectionLifetime: 1800,
    },
    BI_NEGTLLC: {
        serverNode: process.env.HANA_SERVER || '172.1.0.7:30015',
        uid: process.env.HANA_UID || process.env.SAP_HANA_USER || 'NETUSR',
        pwd: process.env.HANA_PASSWORD || process.env.SAP_HANA_PASSWORD || '',
        currentSchema: 'BI_NEGTLLC',
        pooling: true,
        connectionLifetime: 1800,
    },
};
//# sourceMappingURL=database.config.js.map