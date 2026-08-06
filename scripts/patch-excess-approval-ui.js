#!/usr/bin/env node
/** Excess approval: column labels + settings nav link */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const labelFn = `function ebApprovalColumnLabel(a){const l=Vi(a);if(l<=0)return"CONFIRM BY USER";const r=a.personal_usage==null?null:Number(a.personal_usage),o=a.official_usage==null?null:Number(a.official_usage),u=String(a.approval_status||"");if(u==="pending_excess_approval")return"Pending excess approval (L"+(a.excess_approval_level??1)+")";if(u==="excess_rejected")return"Excess rejected";if(u==="pending_approval")return"Pending approval";if(u==="waiting_confirmation")return"Waiting confirmation ("+(a.approval_email_count||1)+")";if(u==="recovery_sent")return"Recovery sent";const f=!!a.approval_submitted_at||r!==null||o!==null||["ready_for_recovery","confirmed_by_user","recovery_sent","pending_excess_approval"].includes(u);if(f)return(r??0)<=0?"Exceed & confirm by user":"Exceed & ready to recovery";return Bi(a)?"Send for approval":"—"}`;

const patches = [
  {
    name: 'inject ebApprovalColumnLabel + hT',
    old: 'function hT(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="ready_for_recovery"?"Exceed & ready to recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Exceed & confirm by user":a.approval_status==="pending_approval"?"Pending approval":Bi(a)?"Send for approval":(Vi(a)<=0,"—")}',
    new: labelFn + 'function hT(a){return ebApprovalColumnLabel(a)}',
  },
  {
    name: 'grid use ebApprovalColumnLabel for confirmed',
    old: 'O.approval_status==="confirmed_by_user"?i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:"Exceed & confirm by user"})',
    new: 'O.approval_status==="confirmed_by_user"?i.jsx("span",{className:"text-xs font-semibold text-sky-700",children:ebApprovalColumnLabel(O)})',
  },
  {
    name: 'grid fallback label',
    old: 'O.approval_status==="pending_approval"?i.jsxs("span",{className:"inline-flex items-center gap-1 text-xs font-medium text-amber-700",children:["Pending approval",ebApprovalReminderIcon(a,O,SetEbReminderBusy,()=>Te(f),EbReminderBusy)]}):i.jsx("span",{className:"text-xs text-muted-foreground",children:hT(O)})',
    new: 'O.approval_status==="pending_approval"?i.jsxs("span",{className:"inline-flex items-center gap-1 text-xs font-medium text-amber-700",children:[ebApprovalColumnLabel(O),ebApprovalReminderIcon(a,O,SetEbReminderBusy,()=>Te(f),EbReminderBusy)]}):i.jsx("span",{className:"text-xs text-muted-foreground",children:ebApprovalColumnLabel(O)})',
  },
  {
    name: 'admin nav settings link',
    old: 'swAdmin=[{id:"upload",label:"Files upload",path:"/samples"},{id:"user_permissions",label:"Permissions",path:"/user-permissions"},{id:"audit_log",label:"Users Log",path:"/audit-log"}]',
    new: 'swAdmin=[{id:"upload",label:"Files upload",path:"/samples"},{id:"user_permissions",label:"Permissions",path:"/user-permissions"},{id:"excess_approval_settings",label:"Excess approval",path:"/settings/excess-approval/"},{id:"audit_log",label:"Users Log",path:"/audit-log"}]',
  },
  {
    name: 'admin nav external href',
    old: 'x.map(m=>{const v=l.pathname.startsWith(m.path);return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)})',
    new: 'x.map(m=>m.id==="excess_approval_settings"?i.jsx("a",{href:"/ebilling/settings/excess-approval/",className:"eb-nav-link",children:m.label},m.id):(v=>i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id))(l.pathname.startsWith(m.path)))',
  },
];

for (const patch of patches) {
  if (patch.new && s.includes(patch.new.slice(0, Math.min(60, patch.new.length)))) {
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
console.log('Excess approval UI patch complete');
