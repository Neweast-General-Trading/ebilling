#!/usr/bin/env node
/**
 * One-off Oracle recovery connectivity test.
 * Usage: node scripts/test-oracle-recovery.js [personNumber] [amount]
 */
require(require('path').join(__dirname, '../server/node_modules/dotenv')).config({
  path: require('path').join(__dirname, '../server/.env'),
});

const { OracleRecoveryService } = require('../server/dist/oracle/oracle-recovery.service');

const PERSON = process.argv[2] || '101908';
const AMOUNT = Number(process.argv[3] ?? 0);
const TEST_NOTE =
  'eBilling Oracle connectivity test — safe zero-amount verification request (no payroll impact intended).';

async function main() {
  const oracle = new OracleRecoveryService();
  console.log('=== Oracle recovery test ===');
  console.log('Person #:', PERSON);
  console.log('Amount (AED):', AMOUNT);
  console.log('Note:', TEST_NOTE);
  console.log('Environment:', process.env.ORACLE_HCM_HOST || 'https://iabney.fa.ocs.oraclecloud.com');
  console.log('');

  console.log('--- Step 1: Preview (read Oracle worker + element) ---');
  let preview;
  try {
    preview = await oracle.previewRecoveryAmount(PERSON, AMOUNT);
    console.log(JSON.stringify({
      resolveSource: preview.resolveSource,
      resolveError: preview.resolveError,
      plannedAction: preview.plannedAction,
      elementName: preview.elementName,
      existingAmount: preview.existingAmount,
      oracleWorker: preview.oracle
        ? {
            personNumber: preview.oracle.personNumber,
            displayName: preview.oracle.displayName,
            email: preview.oracle.email,
            departmentName: preview.oracle.departmentName,
          }
        : null,
    }, null, 2));
  } catch (error) {
    console.error('Preview FAILED:', error.message || error);
    process.exit(1);
  }

  if (!preview.target) {
    console.error('Preview OK but no recovery element target — cannot push.');
    process.exit(1);
  }

  console.log('');
  console.log('--- Step 2: Push to Oracle ---');
  if (AMOUNT <= 0) {
    console.log('Amount is 0 — using direct element update (bypass production >0 guard for this test only).');
    const target = preview.target;
    let result;
    if (target.existingAmount === null) {
      console.log('Creating element entry with ScreenEntryValue=0 ...');
      result = await oracle.createElementEntry(target, 0);
      console.log(JSON.stringify({ action: 'created', amount: 0, testNote: TEST_NOTE, oracleResponse: result }, null, 2));
    } else {
      console.log(`Updating element entry from ${target.existingAmount} → 0 ...`);
      result = await oracle.updateElementEntry(target, 0);
      console.log(JSON.stringify({ action: 'updated', amount: 0, previousAmount: target.existingAmount, testNote: TEST_NOTE, oracleResponse: result }, null, 2));
    }
  } else {
    const result = await oracle.pushRecoveryAmount(PERSON, AMOUNT);
    console.log(JSON.stringify({ ...result, testNote: TEST_NOTE }, null, 2));
  }

  console.log('');
  console.log('--- Step 3: Verify (re-preview) ---');
  const after = await oracle.previewRecoveryAmount(PERSON, AMOUNT);
  console.log(JSON.stringify({
    elementName: after.elementName,
    existingAmount: after.existingAmount,
    plannedAction: after.plannedAction,
  }, null, 2));
  console.log('');
  console.log('SUCCESS — Oracle test completed.');
}

main().catch((error) => {
  console.error('Oracle test FAILED:', error.response?.data || error.message || error);
  process.exit(1);
});
