#!/usr/bin/env node
/** Safe invoice Status + Approval columns — insert helpers, never delete reminder handlers */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler missing — abort');
  process.exit(1);
}

const insertBlock = fs
  .readFileSync(path.join(__dirname, 'fragments/invoice-status-approval-helpers.js'), 'utf8')
  .trim()
  .replace(/function ebApprovalStatusLabel[\s\S]*$/, '')
  .trim();

const oldColumnBlock =
  'function ebApprovalColumnLabel(a){const l=Vi(a);if(l<=0)return"CONFIRM BY USER";const r=a.personal_usage==null?null:Number(a.personal_usage),o=a.official_usage==null?null:Number(a.official_usage),u=String(a.approval_status||"");if(u==="pending_excess_approval")return"Pending excess approval (L"+(a.excess_approval_level??1)+")";if(u==="excess_rejected")return"Excess rejected";if(u==="pending_approval")return"Pending approval";if(u==="waiting_confirmation")return a.excess_reject_reason?"Rejected — resubmit split":"Waiting confirmation ("+(a.approval_email_count||1)+")";if(u==="recovery_sent")return"Recovery sent";const f=!!a.approval_submitted_at||r!==null||o!==null||["ready_for_recovery","confirmed_by_user","recovery_sent","pending_excess_approval"].includes(u);if(f)return(r??0)<=0?"Exceed & confirm by user":"APPROVAL REQUEST";return Bi(a)?"Send for approval":"—"}function hT(a){return ebApprovalColumnLabel(a)}';

const newColumnBlock =
  'function ebApprovalColumnLabel(a){return ebInvoiceApprovalText(a)}function hT(a){return ebInvoiceStatusHeadline(a)}';

const oldStatusLabel =
  'function ebApprovalStatusLabel(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="pending_approval"?"Pending approval":a.approval_status==="pending_excess_approval"?"Pending excess approval":a.approval_status==="ready_for_recovery"?"APPROVAL REQUEST":a.approval_status==="confirmed_by_user"?"Exceed & confirm by user":a.approval_status||"—"}';

const newStatusLabel = 'function ebApprovalStatusLabel(a){return ebInvoiceStatusHeadline(a)}';

const patches = [
  {
    name: 'invoice headers status + approval',
    old: 'children:"Reference"}),i.jsx("th",{className:"px-2 py-2",children:"Approval"})',
    new: 'children:"Reference"}),i.jsx("th",{className:"px-2 py-2",children:"Status"}),i.jsx("th",{className:"px-2 py-2",children:"Approval"})',
  },
  {
    name: 'invoice row approval column cell',
    old: 'children:hT(O)})})]},O.invoice_id)}),!qe.length&&i.jsx("tr",{children:i.jsx("td",{colSpan:12,',
    new: 'children:hT(O)})}),i.jsx("td",{className:"px-2 py-2 align-middle",children:ebInvoiceApprovalCell(O)})]},O.invoice_id)}),!qe.length&&i.jsx("tr",{children:i.jsx("td",{colSpan:13,',
  },
  {
    name: 'status subtext for confirmed user',
    old: 'O.approval_status==="confirmed_by_user"?i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Exceed & confirm by user"})',
    new: 'O.approval_status==="confirmed_by_user"?i.jsxs("span",{className:"inline-flex flex-col gap-0.5",children:[i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Exceed & confirm by user"}),ebInvoiceStatusSubtext(O)?i.jsx("span",{className:"text-[10px] text-slate-500",children:ebInvoiceStatusSubtext(O)}):null]})',
  },
];

if (!s.includes('ebInvoiceStatusHeadline')) {
  const anchor = 'function ebApprovalColumnLabel';
  if (!s.includes(anchor)) {
    console.error('Missing ebApprovalColumnLabel anchor');
    process.exit(1);
  }
  s = s.replace(anchor, `${insertBlock}${anchor}`);
  console.log('Inserted invoice status/approval helpers');
} else {
  console.log('Helpers already inserted');
}

if (s.includes(oldColumnBlock)) {
  s = s.replace(oldColumnBlock, newColumnBlock);
  console.log('Updated ebApprovalColumnLabel + hT wrappers');
} else if (s.includes(newColumnBlock)) {
  console.log('Column wrappers already updated');
} else {
  console.error('Could not locate ebApprovalColumnLabel block');
  process.exit(1);
}

if (s.includes(oldStatusLabel)) {
  s = s.replace(oldStatusLabel, newStatusLabel);
  console.log('Updated ebApprovalStatusLabel');
} else if (s.includes(newStatusLabel)) {
  console.log('ebApprovalStatusLabel already updated');
} else {
  console.error('Could not locate ebApprovalStatusLabel');
  process.exit(1);
}

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

const cacheTag = '202607141125invoice-safe';
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes(cacheTag)) {
  fs.writeFileSync(indexPath, index.replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
  console.log('Bumped cache version');
}

console.log('Safe invoice status/approval patch complete');
