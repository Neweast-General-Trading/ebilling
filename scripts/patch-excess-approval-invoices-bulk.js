#!/usr/bin/env node
/** Invoices page: select excess rows + send to excess approval matrix */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'excess matrix eligibility helpers',
    old: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval"||a.approval_status==="waiting_confirmation")&&!!a.email?.trim()}function ev(a,l){return!1}',
    new: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval"||a.approval_status==="waiting_confirmation")&&!!a.email?.trim()}function EbExcessMatrixEligible(a){return Vi(a)>0&&a.approval_status!=="pending_excess_approval"}function EbInvoiceRowSelectable(a){return Bi(a)||EbExcessMatrixEligible(a)}function ev(a,l){return!1}',
  },
  {
    name: 'api send-bulk endpoint',
    old: 'EXCESS_APPROVAL_SETTINGS:"/excess-approval/settings",NOTIFICATIONS_MONTHLY:',
    new: 'EXCESS_APPROVAL_SETTINGS:"/excess-approval/settings",EXCESS_APPROVAL_SEND_BULK:"/excess-approval/send-bulk",NOTIFICATIONS_MONTHLY:',
  },
  {
    name: 'matrix busy state',
    old: '[EbReminderBusy,SetEbReminderBusy]=b.useState(null),[r]=Jo()',
    new: '[EbReminderBusy,SetEbReminderBusy]=b.useState(null),[EbMatrixBusy,SetEbMatrixBusy]=b.useState(!1),[r]=Jo()',
  },
  {
    name: 'selectable + excess memos',
    old: 'tt=b.useMemo(()=>qe.filter(O=>Bi(O)),[qe]),at=b.useMemo(()=>tt.filter(O=>J.includes(O.invoice_id)).length,[tt,J]),Pt=tt.length>0&&at===tt.length;',
    new: 'tt=b.useMemo(()=>qe.filter(O=>Bi(O)),[qe]),ttSelectable=b.useMemo(()=>qe.filter(O=>EbInvoiceRowSelectable(O)),[qe]),ttExcess=b.useMemo(()=>qe.filter(O=>EbExcessMatrixEligible(O)),[qe]),at=b.useMemo(()=>tt.filter(O=>J.includes(O.invoice_id)).length,[tt,J]),atSelectable=b.useMemo(()=>ttSelectable.filter(O=>J.includes(O.invoice_id)).length,[ttSelectable,J]),atExcess=b.useMemo(()=>ttExcess.filter(O=>J.includes(O.invoice_id)).length,[ttExcess,J]),Pt=ttSelectable.length>0&&atSelectable===ttSelectable.length;',
  },
  {
    name: 'select all uses selectable rows',
    old: 'ba=()=>{if(Pt){w([]);return}w(tt.map(O=>O.invoice_id))},',
    new: 'ba=()=>{if(Pt){w([]);return}w(ttSelectable.map(O=>O.invoice_id))},',
  },
  {
    name: 'send bulk to excess matrix handler',
    old: 'window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}},Ye=b.useCallback(async(O,ie)=>{if(!O.length)return[];',
    new: 'window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}},Mc=async()=>{const O=J.filter(ie=>ttExcess.some(Ae=>Ae.invoice_id===ie));if(!O.length){se.error("Select at least one invoice with excess for approval");return}SetEbMatrixBusy(!0);try{const{data:ie}=await De.post(`${ze.EXCESS_APPROVAL_SEND_BULK}?co=${a}`,{invoiceIds:O},{timeout:Math.max(6e4,O.length*15e3)}),Ae=new Map;if(ie.results.forEach(Se=>{Se.success&&Se.row&&Ae.set(Se.invoiceId,Se.row)}),Ae.size&&v(Se=>Se.map(Ct=>Ae.get(Ct.invoice_id)??Ct)),w(Se=>Se.filter(Ct=>!ie.results.some($t=>$t.invoiceId===Ct&&$t.success))),ie.sent&&!ie.failed?se.success(`Sent ${ie.sent} invoice(s) to excess approval`):ie.sent&&ie.failed?se.warning(`Sent ${ie.sent}, failed ${ie.failed}`):se.error("Could not send to excess approval"),ie.failed){const Se=ie.results.find(Ct=>!Ct.success)?.error;Se&&se.error(Se)}}catch(ie){se.error(Eo(ie))}finally{SetEbMatrixBusy(!1),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}},Ye=b.useCallback(async(O,ie)=>{if(!O.length)return[];',
  },
  {
    name: 'toolbar bulk excess button',
    old: 'children:[tt.length>0?i.jsxs("p",{className:"text-sm text-muted-foreground",children:[at," of ",tt.length," eligible selected"]}):null,i.jsxs("div",{className:"ml-auto flex flex-wrap gap-2",children:[i.jsxs(Me,{variant:"default",disabled:!at||R,onClick:we,children:[R?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Send selected for approval",at?` (${at})`:""]}),i.jsxs(Me,{variant:"outline",disabled:!qe.length,onClick:oa,children:[i.jsx(ks,{className:"size-4"}),"Export CSV"]})]})]})',
    new: 'children:[ttSelectable.length>0?i.jsxs("p",{className:"text-sm text-muted-foreground",children:[atSelectable," of ",ttSelectable.length," selectable",atExcess?` · ${atExcess} with excess`:""]}):null,i.jsxs("div",{className:"ml-auto flex flex-wrap gap-2",children:[EbCanManage?i.jsxs(Me,{variant:"secondary",disabled:!atExcess||EbMatrixBusy||R,onClick:Mc,children:[EbMatrixBusy?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Cb,{className:"size-4"}),"Send selected to excess approval",atExcess?` (${atExcess})`:""]}):null,i.jsxs(Me,{variant:"default",disabled:!at||R||EbMatrixBusy,onClick:we,children:[R?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Send selected for approval",at?` (${at})`:""]}),i.jsxs(Me,{variant:"outline",disabled:!qe.length,onClick:oa,children:[i.jsx(ks,{className:"size-4"}),"Export CSV"]})]})]})',
  },
  {
    name: 'header select-all checkbox',
    old: '"aria-label":"Select all eligible invoices for approval",className:"size-4 rounded border-slate-300",checked:Pt,disabled:!tt.length||R,onChange:ba',
    new: '"aria-label":"Select all eligible invoices",className:"size-4 rounded border-slate-300",checked:Pt,disabled:!ttSelectable.length||R||EbMatrixBusy,onChange:ba',
  },
  {
    name: 'row checkbox for excess rows',
    old: 'children:Bi(O)?i.jsx("input",{type:"checkbox","aria-label":`Select ${O.display_name||O.phone_number} for approval`,className:"size-4 rounded border-slate-300",checked:J.includes(O.invoice_id),disabled:R,onChange:()=>St(O.invoice_id)}):null',
    new: 'children:EbInvoiceRowSelectable(O)?i.jsx("input",{type:"checkbox","aria-label":`Select ${O.display_name||O.phone_number}`,className:"size-4 rounded border-slate-300",checked:J.includes(O.invoice_id),disabled:R||EbMatrixBusy,onChange:()=>St(O.invoice_id)}):null',
  },
];

for (const patch of patches) {
  if (s.includes(patch.new.slice(0, Math.min(60, patch.new.length)))) {
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
console.log('Excess approval invoices bulk patch complete');
