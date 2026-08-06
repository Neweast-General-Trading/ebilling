#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const serverRoot = path.join(__dirname, '../server');
const envPath = path.join(serverRoot, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}
const { NestFactory } = require(path.join(serverRoot, 'node_modules/@nestjs/core'));
const { AppModule } = require(path.join(serverRoot, 'dist/app.module'));
const { ExcessApprovalService } = require(path.join(serverRoot, 'dist/invoice/excess-approval.service'));

async function main() {
  const co = process.argv[2] || 'BI_NEGT';
  const requestId = Number(process.argv[3]);
  const approverEmail = process.argv[4] || 'henry@neweast.co';
  if (!requestId) {
    console.error('Usage: node complete-excess-request.js <co> <requestId> [approverEmail]');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const excessApproval = app.get(ExcessApprovalService);
    const result = await excessApproval.completeApproval(co, requestId, approverEmail);
    console.log(JSON.stringify({
      requestId,
      invoiceId: result.gridRow?.invoice_id,
      employee: result.gridRow?.display_name,
      finalStatus: result.finalStatus,
      manualOracle: !!result.manualOracle,
      skippedOracle: !!result.skippedOracle,
      hasOracleResult: !!result.oracleResult,
    }, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
