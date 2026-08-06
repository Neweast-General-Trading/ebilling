#!/usr/bin/env node
/** Safe UI polish: approval logic, table layout, approval request counts */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler missing — abort');
  process.exit(1);
}

const helpers = fs
  .readFileSync(path.join(__dirname, 'fragments/invoice-status-approval-helpers.js'), 'utf8')
  .trim()
  .replace(/function ebApprovalStatusLabel[\s\S]*$/, '')
  .trim();

const helperStart = s.indexOf('function ebInvoiceStatusHeadline');
const helperEnd = s.indexOf('function ebApprovalColumnLabel');
if (helperStart < 0 || helperEnd < 0 || helperEnd <= helperStart) {
  console.error('Could not locate invoice helper block');
  process.exit(1);
}
s = s.slice(0, helperStart) + helpers + s.slice(helperEnd);
console.log('Updated invoice status/approval helpers');

const patches = [
  {
    name: 'status confirmed cell helper',
    old: 'O.approval_status==="confirmed_by_user"?i.jsxs("span",{className:"inline-flex flex-col gap-0.5",children:[i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Exceed & confirm by user"}),ebInvoiceStatusSubtext(O)?i.jsx("span",{className:"text-[10px] text-slate-500",children:ebInvoiceStatusSubtext(O)}):null]})',
    new: 'O.approval_status==="confirmed_by_user"?ebInvoiceStatusConfirmedCell(O)',
  },
  {
    name: 'invoice table full width layout',
    old: 'className:"w-full min-w-[980px] table-fixed border-collapse text-sm",children:[i.jsxs("colgroup",{children:[i.jsx("col",{className:"w-[36px]"}),i.jsx("col",{className:"w-[44px]"}),i.jsx("col",{className:"w-[120px]"}),i.jsx("col",{className:"w-[72px]"}),i.jsx("col",{className:"w-[76px]"}),i.jsx("col",{className:"w-[76px]"}),i.jsx("col",{className:"w-[76px]"}),i.jsx("col",{className:"w-[76px]"}),i.jsx("col",{className:"w-[68px]"}),i.jsx("col",{className:"w-[120px]"}),i.jsx("col",{className:"w-[110px]"}),i.jsx("col",{className:"w-[140px]"})]}),i.jsx("thead"',
    new: 'className:"w-full border-collapse text-sm",children:[i.jsx("thead"',
  },
];

for (const patch of patches) {
  if (s.includes(patch.new)) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    console.error(`Missing target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler was removed — aborting write');
  process.exit(1);
}

const statusLabelCount = (s.match(/function ebApprovalStatusLabel/g) || []).length;
if (statusLabelCount !== 1) {
  console.error(`SAFETY: expected 1 ebApprovalStatusLabel, found ${statusLabelCount}`);
  process.exit(1);
}

fs.writeFileSync(bundlePath, s);
try {
  new Function(s);
  console.log('Bundle parse OK');
} catch (e) {
  console.error('Bundle parse FAIL', e.message);
  process.exit(1);
}

const cacheTag = '202607141200approved-rejected';
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes(cacheTag)) {
  fs.writeFileSync(indexPath, index.replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
  console.log('Bumped cache version');
}
for (const rel of ['../client/dist/index-root.html']) {
  const p = path.join(__dirname, rel);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
}

console.log('UI polish patch complete');
