#!/usr/bin/env node
/**
 * Allow approvers to open invoice PDFs from approval pages
 * without requiring the invoices permission.
 */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const fragmentPath = path.join(__dirname, 'fragments/approval-request-page.js');
let s = fs.readFileSync(bundlePath, 'utf8');
const fragment = fs.readFileSync(fragmentPath, 'utf8');

const apiNeedle = 'EXCESS_APPROVAL_DEDUCTION_STATUS:"/excess-approval/deduction-status"';
const apiInsert =
  'EXCESS_APPROVAL_DEDUCTION_STATUS:"/excess-approval/deduction-status",EXCESS_APPROVAL_INVOICE_PDF:"/excess-approval/invoice-pdf",EXCESS_APPROVAL_QUEUE_PDF:(a,l)=>`/excess-approval/queue/${a}/invoice-pdf/${l}`';

if (!s.includes('EXCESS_APPROVAL_INVOICE_PDF')) {
  if (!s.includes(apiNeedle)) {
    console.error('Missing API endpoint needle');
    process.exit(1);
  }
  s = s.replace(apiNeedle, apiInsert);
  console.log('Applied: API endpoints for approval PDF');
} else {
  console.log('Already applied: API endpoints for approval PDF');
}

const start = s.indexOf('function EbApprovalOpenModal(');
const end = s.indexOf('function EbApprovalRequestRoute(');
if (start < 0 || end < 0 || end <= start) {
  console.error('Missing EbApprovalOpenModal / EbApprovalRequestRoute anchors');
  process.exit(1);
}

const routeStart = fragment.indexOf('function EbApprovalRequestRoute(');
const replacement = (routeStart >= 0 ? fragment.slice(0, routeStart) : fragment).trim() + '\n';
s = s.slice(0, start) + replacement + s.slice(end);
console.log('Applied: approval-request-page fragment with PDF fix');

fs.writeFileSync(bundlePath, s);

const cacheTag = `20261002uae-reject-monthly-oracle`;
for (const rel of ['client/dist/index.html', 'client/dist/index-root.html', 'client/dist/approval-request/index.html']) {
  const p = path.join(__dirname, '..', rel);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const next = html.replace(/index-approval-v2\.js\?v=[^"]+/g, `index-approval-v2.js?v=${cacheTag}`);
  fs.writeFileSync(p, next);
}
console.log('Cache tag:', cacheTag);
console.log('Approval PDF access patch complete');
