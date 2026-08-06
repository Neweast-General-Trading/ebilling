#!/usr/bin/env node
/** Fix excess approval reload loop: admin permissions + route guard + nav link */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'admin permissions include excess_approval',
    old: 'if(Po(a))return{permissions:["dashboard","invoices","master","analysis","audit_log","recovery_log"],canManage:!0,loading:!1}',
    new: 'if(Po(a))return{permissions:["dashboard","invoices","master","reports","analysis","audit_log","recovery_log","excess_approval"],canManage:!0,loading:!1}',
  },
  {
    name: 'permission guard excess_approval redirect',
    old: 'f=u==="invoices"?"/invoices":u==="master"?"/master":u==="reports"?"/reports":u==="analysis"?"/analysis":u==="audit_log"?"/audit-log":u==="recovery_log"?"/recovery-log":"/dashboard"',
    new: 'f=u==="invoices"?"/invoices":u==="master"?"/master":u==="reports"?"/reports":u==="analysis"?"/analysis":u==="audit_log"?"/audit-log":u==="recovery_log"?"/recovery-log":u==="excess_approval"?"/excess-approval-settings":"/dashboard"',
  },
  {
    name: 'eA allow canManage or excess_approval',
    old: 'function eA(){return i.jsx(zl,{permission:"excess_approval",children:i.jsx(EbExcessApprovalSettingsPage,{})})}',
    new: 'function eA(){const{canManage:a,hasPermission:l,loading:r}=bb();return r?i.jsx("div",{className:"flex min-h-[200px] items-center justify-center text-sm text-slate-500",children:"Loading permissions…"}):a||l("excess_approval")?i.jsx(EbExcessApprovalSettingsPage,{}):i.jsx(zl,{permission:"excess_approval",children:i.jsx(EbExcessApprovalSettingsPage,{})})}',
  },
  {
    name: 'nav use router link not full href',
    old: 'm.id==="excess_approval_settings"?i.jsx("a",{href:"/ebilling/excess-approval-settings/",className:"eb-nav-link",children:m.label},m.id)',
    new: 'm.id==="excess_approval_settings"?i.jsx(Ts,{to:"/excess-approval-settings",className:bt("eb-nav-link",l.pathname.startsWith("/excess-approval-settings")&&"eb-nav-link-active"),children:m.label},m.id)',
  },
];

for (const patch of patches) {
  if (s.includes(patch.new)) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    console.error(`Missing target: ${patch.name}`);
    continue;
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Excess approval reload fix complete');
