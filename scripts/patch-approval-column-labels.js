#!/usr/bin/env node
/** Approval column labels: Exceed & confirm by user / Exceed & ready to recovery */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'grid Approval column hT labels',
    old: 'function hT(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="ready_for_recovery"?"Confirmed & Ready for recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Confirmed":a.approval_status==="pending_approval"?"Pending approval":Bi(a)?"Send for approval":(Vi(a)<=0,"—")}',
    new: 'function hT(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="ready_for_recovery"?"Exceed & ready to recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Exceed & confirm by user":a.approval_status==="pending_approval"?"Pending approval":Bi(a)?"Send for approval":(Vi(a)<=0,"—")}',
  },
  {
    name: 'approval panel status labels',
    old: 'a.approval_status==="ready_for_recovery"?a.person_number?.trim()?"Ready for recovery":"Ready for recovery (no SAP)"',
    new: 'a.approval_status==="ready_for_recovery"?a.person_number?.trim()?"Exceed & ready to recovery":"Exceed & ready to recovery (no SAP)":a.approval_status==="confirmed_by_user"?"Exceed & confirm by user"',
  },
  {
    name: 'recovery grid fallback label',
    old: 'return i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Ready for recovery"});',
    new: 'return i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Exceed & ready to recovery"});',
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

fs.writeFileSync(bundlePath, s);
console.log('Approval column labels patch complete');
