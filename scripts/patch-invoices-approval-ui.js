#!/usr/bin/env node
/** Invoices: one clear approval button, labels, sidebar section name */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'approval column label',
    old: 'if(f)return(r??0)<=0?"Exceed & confirm by user":"Exceed & ready to recovery";return Bi(a)?"Send for approval":"—"}function hT(a){return ebApprovalColumnLabel(a)}',
    new: 'if(f)return(r??0)<=0?"Exceed & confirm by user":"APPROVAL REQUEST";return Bi(a)?"Send for approval":"—"}function hT(a){return ebApprovalColumnLabel(a)}',
  },
  {
    name: 'sidebar status label',
    old: 'a.approval_status==="ready_for_recovery"?a.person_number?.trim()?"Exceed & ready to recovery":"Exceed & ready to recovery (no SAP)"',
    new: 'a.approval_status==="pending_excess_approval"?"Pending excess approval":a.approval_status==="ready_for_recovery"?"APPROVAL REQUEST"',
  },
  {
    name: 'sidebar section title',
    old: 'i.jsx("h4",{children:"Ready for Recovery"})',
    new: 'i.jsx("h4",{children:"Approval request"})',
  },
  {
    name: 'primary send for approval button',
    old: 'children:[EbCanManage?i.jsxs(Me,{variant:"secondary",disabled:!atExcess||EbMatrixBusy||R,onClick:Mc,children:[EbMatrixBusy?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Cb,{className:"size-4"}),"Send selected to excess approval",atExcess?` (${atExcess})`:""]}):null,i.jsxs(Me,{variant:"default",disabled:!at||R||EbMatrixBusy,onClick:we,children:[R?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Send selected for approval",at?` (${at})`:""]})',
    new: 'children:[EbCanManage&&atExcess>0?i.jsxs(Me,{variant:"default",className:"bg-sky-600 text-white shadow-sm hover:bg-sky-700 border-sky-700",disabled:EbMatrixBusy||R,onClick:Mc,children:[EbMatrixBusy?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Send for approval",` (${atExcess})`]}):null,at>0?i.jsxs(Me,{variant:"outline",disabled:R||EbMatrixBusy,onClick:we,children:[R?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Send to employee",at?` (${at})`:""]}):null',
  },
  {
    name: 'toolbar helper text',
    old: 'children:[atSelectable," of ",ttSelectable.length," selectable",atExcess?` · ${atExcess} with excess`:""]',
    new: 'children:[atSelectable," selected",atExcess?` · ${atExcess} for approval`:""]',
  },
  {
    name: 'approval panel loads approvalRequest',
    old: 'o(C?.pendingApproval||[]),f(C?.readyForRecovery||[])',
    new: 'o(C?.pendingApproval||[]),f(C?.approvalRequest||C?.readyForRecovery||[])',
  },
];

for (const patch of patches) {
  if (!s.includes(patch.old)) {
    console.error(`Missing target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Invoices approval UI patch complete');
