#!/usr/bin/env node
/**
 * Read-only approval queue for viewers who are not the assigned approver.
 * Uses API canAct flag; hides approve/reject UI and blocks client actions.
 */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');

const helper = `
function EbApprovalRowActions(e,w,P,u,d,ebRO){return i.jsxs("div",{className:"flex justify-end gap-1.5",children:[i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>w(e),children:"Open"}),ebRO?null:i.jsx(Me,{size:"sm",className:"bg-emerald-600 text-white hover:bg-emerald-700",disabled:d===e.invoiceId,onClick:()=>P([e.invoiceId]),children:"Approve"}),ebRO?null:i.jsx(Me,{size:"sm",variant:"outline",className:"border-red-200 text-red-700",disabled:d===e.invoiceId,onClick:()=>u([e.invoiceId]),children:"Reject"})]})}
`;

if (!s.includes('function EbApprovalRowActions(')) {
  const anchor = 'function EbApprovalRequestPage()';
  if (!s.includes(anchor)) throw new Error('readonly-viewer: page anchor missing');
  s = s.replace(anchor, helper + anchor);
  console.log('injected: EbApprovalRowActions helper');
}

const patches = [
  {
    name: 'ebRO flag',
    old: 'const m=x.rows||[],E=o.rows||[],A=m.length>0&&n.length===m.length',
    new: 'const m=x.rows||[],E=o.rows||[],ebRO=x.canAct!==true,A=m.length>0&&n.length===m.length',
  },
  {
    name: 'block bulk approve',
    old: 'P=async e=>{if(e.length){N("bulk");',
    new: 'P=async e=>{if(ebRO){se.error("View only — you cannot approve or reject");return}if(e.length){N("bulk");',
  },
  {
    name: 'block bulk reject',
    old: 'q=async(e,t)=>{if(!e.length||!t.trim()){se.error("Rejection reason is required");return}',
    new: 'q=async(e,t)=>{if(ebRO){se.error("View only — you cannot approve or reject");return}if(!e.length||!t.trim()){se.error("Rejection reason is required");return}',
  },
  {
    name: 'bulk buttons',
    old: 'children:[i.jsxs(Me,{className:"bg-emerald-600 text-white hover:bg-emerald-700",disabled:!n.length||!!d,onClick:()=>P(n),children:[d?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"})," Approve selected",n.length?` (${n.length})`:""]}),i.jsxs(Me,{variant:"outline",className:"border-red-200 text-red-700 hover:bg-red-50",disabled:!n.length||!!d,onClick:()=>u(n),children:[i.jsx(Rf,{className:"size-4"})," Reject selected",n.length?` (${n.length})`:""]})]',
    new: 'children:ebRO?[i.jsx("p",{className:"text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2",children:"View only — assigned approver only can approve or reject."})]:[i.jsxs(Me,{className:"bg-emerald-600 text-white hover:bg-emerald-700",disabled:!n.length||!!d,onClick:()=>P(n),children:[d?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"})," Approve selected",n.length?` (${n.length})`:""]}),i.jsxs(Me,{variant:"outline",className:"border-red-200 text-red-700 hover:bg-red-50",disabled:!n.length||!!d,onClick:()=>u(n),children:[i.jsx(Rf,{className:"size-4"})," Reject selected",n.length?` (${n.length})`:""]})]',
  },
  {
    name: 'header checkbox',
    old: 'i.jsx("th",{className:"px-3 py-3 w-10",children:i.jsx("input",{type:"checkbox",className:"size-4 rounded border-slate-300",checked:A,onChange:I,"aria-label":"Select all"})})',
    new: 'i.jsx("th",{className:"px-3 py-3 w-10",children:ebRO?null:i.jsx("input",{type:"checkbox",className:"size-4 rounded border-slate-300",checked:A,onChange:I,"aria-label":"Select all"})})',
  },
  {
    name: 'row checkbox',
    old: 'i.jsx("td",{className:"px-3 py-3",children:i.jsx("input",{type:"checkbox",className:"size-4 rounded border-slate-300",checked:n.includes(e.invoiceId),onChange:()=>$(e.invoiceId)})})',
    new: 'i.jsx("td",{className:"px-3 py-3",children:ebRO?null:i.jsx("input",{type:"checkbox",className:"size-4 rounded border-slate-300",checked:n.includes(e.invoiceId),onChange:()=>$(e.invoiceId)})})',
  },
  {
    name: 'row actions',
    old: 'i.jsx("td",{className:"px-3 py-3",children:i.jsxs("div",{className:"flex justify-end gap-1.5",children:[i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>w(e),children:"Open"}),i.jsx(Me,{size:"sm",className:"bg-emerald-600 text-white hover:bg-emerald-700",disabled:d===e.invoiceId,onClick:()=>P([e.invoiceId]),children:"Approve"}),i.jsx(Me,{size:"sm",variant:"outline",className:"border-red-200 text-red-700",disabled:d===e.invoiceId,onClick:()=>u([e.invoiceId]),children:"Reject"})]})})',
    new: 'i.jsx("td",{className:"px-3 py-3",children:EbApprovalRowActions(e,w,P,u,d,ebRO)})',
  },
];

for (const p of patches) {
  if (s.includes(p.new)) {
    console.log(`already: ${p.name}`);
    continue;
  }
  if (!s.includes(p.old)) throw new Error(`readonly-viewer: missing anchor -> ${p.name}`);
  s = s.replace(p.old, p.new);
  console.log(`applied: ${p.name}`);
}

fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-approval-readonly-viewer: done');
