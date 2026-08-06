#!/usr/bin/env node
/** Send reminder icon next to Pending approval (same email as first approval). */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const helper = `function ebApprovalReminderHandler(co,a,l,r){return async()=>{l(a.invoice_id);try{await De.post(ze.INVOICES_SEND_APPROVAL_REMINDER(a.invoice_id)+"?co="+co,{}),se.success("Reminder email sent"),r&&r(!0),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}catch(o){se.error(Eo(o))}finally{l(null)}}}function ebApprovalReminderIcon(co,a,l,r,o){return a.approval_status!=="pending_approval"?null:i.jsx("button",{type:"button",title:"Send reminder","aria-label":"Send reminder email",disabled:o===a.invoice_id,className:"inline-flex rounded p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50",onClick:ebApprovalReminderHandler(co,a,l,r),children:o===a.invoice_id?i.jsx(Kt,{className:"size-3 animate-spin"}):i.jsx(S_,{className:"size-3"})})}`;

const patches = [
  {
    name: 'api endpoint',
    old: 'INVOICES_SEND_FOR_APPROVAL:a=>`/invoices/${a}/send-for-approval`,INVOICES_SUBMIT_APPROVAL',
    new: 'INVOICES_SEND_FOR_APPROVAL:a=>`/invoices/${a}/send-for-approval`,INVOICES_SEND_APPROVAL_REMINDER:a=>`/invoices/${a}/send-approval-reminder`,INVOICES_SUBMIT_APPROVAL',
  },
  {
    name: 'inject helpers',
    old: 'function EbApprovalQueueItem({row:a,acting:l,mode:r,onOpen:o,onResend:u,onRecovery:f})',
    new: helper + 'function EbApprovalQueueItem({row:a,acting:l,mode:r,onOpen:o,onResend:u,onRecovery:f,onReminder:h})',
    skipIf: 'function ebApprovalReminderHandler',
  },
  {
    name: 'approval panel status icon',
    old: 'i.jsxs("div",{children:[i.jsx("span",{children:"Status"}),i.jsx("strong",{children:ebApprovalStatusLabel(a)})]})',
    new: 'i.jsxs("div",{children:[i.jsx("span",{children:"Status"}),i.jsxs("strong",{className:"inline-flex items-center gap-1",children:[ebApprovalStatusLabel(a),a.approval_status==="pending_approval"&&h?i.jsx("button",{type:"button",title:"Send reminder","aria-label":"Send reminder email",disabled:l===a.invoice_id,className:"inline-flex rounded p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50",onClick:h,children:l===a.invoice_id?i.jsx(Kt,{className:"size-3 animate-spin"}):i.jsx(S_,{className:"size-3"})}):null]})]})',
  },
  {
    name: 'panel pass onReminder',
    old: 'EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}',
    new: 'EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{},onReminder:ebApprovalReminderHandler(a,C,v,N)',
  },
  {
    name: 'grid reminder state',
    old: '[EbRecBusy,SetEbRecBusy]=b.useState(null),[r]=Jo()',
    new: '[EbRecBusy,SetEbRecBusy]=b.useState(null),[EbReminderBusy,SetEbReminderBusy]=b.useState(null),[r]=Jo()',
  },
  {
    name: 'grid pending approval icon',
    old: 'O.approval_status==="pending_approval"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Pending approval"})',
    new: 'O.approval_status==="pending_approval"?i.jsxs("span",{className:"inline-flex items-center gap-1 text-xs font-medium text-amber-700",children:["Pending approval",ebApprovalReminderIcon(a,O,SetEbReminderBusy,()=>Te(f),EbReminderBusy)]})',
  },
];

for (const patch of patches) {
  if (patch.skipIf && s.includes(patch.skipIf)) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    if (s.includes(patch.new.slice(0, Math.min(60, patch.new.length)))) {
      console.log(`Already patched: ${patch.name}`);
      continue;
    }
    console.error(`Missing target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Approval reminder patch complete');
