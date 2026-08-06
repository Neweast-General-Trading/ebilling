#!/usr/bin/env node
/** Fix Approval column: show Exceed labels in grid + visible reminder icon */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'grid confirmed_by_user label',
    old: 'O.approval_status==="confirmed_by_user"?i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Confirmed by User"})',
    new: 'O.approval_status==="confirmed_by_user"?i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Exceed & confirm by user"})',
  },
  {
    name: 'recovery cell always show exceed label',
    old: 'function ebRecoveryGridCell(a,l,r,o,u,f,p){if(!r||a.approval_status!=="ready_for_recovery")return i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Exceed & ready to recovery"});const m=o[String(a.invoice_id)];return m?.status==="pending"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Recovery request pending"}):m?.status==="approved"?i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Sent to Oracle"}):m?.status==="rejected"?i.jsxs("span",{className:"text-xs font-medium text-red-700",title:m.rejectReason||"",children:["Rejected: ",m.rejectReason||"—"]}):i.jsxs(Me,{variant:"outline",size:"sm",disabled:!0,title:"Temporarily disabled",className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 opacity-60",children:[i.jsx(Dd,{className:"size-3.5"}),"Request recovery"]})}',
    new: 'function ebRecoveryGridCell(a,l,r,o,u,f,p){const ebRecLabel=i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Exceed & ready to recovery"});if(!r||a.approval_status!=="ready_for_recovery")return ebRecLabel;const m=o[String(a.invoice_id)];return m?.status==="pending"?i.jsxs("span",{className:"inline-flex flex-col gap-0.5",children:[ebRecLabel,i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Recovery request pending"})]}):m?.status==="approved"?i.jsxs("span",{className:"inline-flex flex-col gap-0.5",children:[ebRecLabel,i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Sent to Oracle"})]}):m?.status==="rejected"?i.jsxs("span",{className:"inline-flex flex-col gap-0.5",children:[ebRecLabel,i.jsxs("span",{className:"text-xs font-medium text-red-700",title:m.rejectReason||"",children:["Rejected: ",m.rejectReason||"—"]})]}):ebRecLabel}',
  },
  {
    name: 'bigger reminder icon in grid',
    old: 'function ebApprovalReminderIcon(co,a,l,r,o){return a.approval_status!=="pending_approval"?null:i.jsx("button",{type:"button",title:"Send reminder","aria-label":"Send reminder email",disabled:o===a.invoice_id,className:"inline-flex rounded p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50",onClick:ebApprovalReminderHandler(co,a,l,r),children:o===a.invoice_id?i.jsx(Kt,{className:"size-3 animate-spin"}):i.jsx(S_,{className:"size-3"})})}',
    new: 'function ebApprovalReminderIcon(co,a,l,r,o){return a.approval_status!=="pending_approval"?null:i.jsx("button",{type:"button",title:"Send reminder email","aria-label":"Send reminder email",disabled:o===a.invoice_id,className:"inline-flex items-center justify-center rounded border border-amber-300 bg-amber-50 p-1 text-amber-800 hover:bg-amber-100 disabled:opacity-50",onClick:ebApprovalReminderHandler(co,a,l,r),children:o===a.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(S_,{className:"size-3.5"})})}',
  },
  {
    name: 'bigger reminder icon in approval panel',
    old: 'a.approval_status==="pending_approval"&&h?i.jsx("button",{type:"button",title:"Send reminder","aria-label":"Send reminder email",disabled:l===a.invoice_id,className:"inline-flex rounded p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50",onClick:h,children:l===a.invoice_id?i.jsx(Kt,{className:"size-3 animate-spin"}):i.jsx(S_,{className:"size-3"})}):null',
    new: 'a.approval_status==="pending_approval"&&h?i.jsx("button",{type:"button",title:"Send reminder email","aria-label":"Send reminder email",disabled:l===a.invoice_id,className:"inline-flex items-center justify-center rounded border border-amber-300 bg-amber-50 p-1 text-amber-800 hover:bg-amber-100 disabled:opacity-50",onClick:h,children:l===a.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(S_,{className:"size-3.5"})}):null',
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
console.log('Approval UI fix patch complete');
