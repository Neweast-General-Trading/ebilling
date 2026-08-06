#!/usr/bin/env node
/** Restrict eBilling UI to allowlisted users only; remove default dashboard fallback. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'client admin email list',
    old: 'uw=["sakour@neweast.co","sakour@neweast.com","guru@neweast.com","guru@neweast.co","ashwin@neweast.co","ashwin@neweast.com","henry@neweast.co"]',
    new: 'uw=["sakour@neweast.co","sakour@neweast.com","jadsakour@neweast.co","guru@neweast.com","henry@neweast.co","thanzil@neweast.co","muhammed.fawaz@neweast.co"]',
  },
  {
    name: 'permissions API no default dashboard',
    old: 'return{permissions:l.permissions?.length?l.permissions:["dashboard"],canManage:!!l.canManage,loading:!1}}function bb()',
    new: 'return{permissions:l.permissions?.length?l.permissions:[],canManage:!!l.canManage&&!!l.canAccess,loading:!1}}function bb()',
  },
  {
    name: 'permissions hook fail closed',
    old: 'catch{const u={permissions:["dashboard"],canManage:!1,loading:!1};return Rl=u,l(u),u}',
    new: 'catch{const u={permissions:[],canManage:!1,loading:!1};return Rl=u,l(u),u}',
  },
  {
    name: 'permissions hook initial state',
    old: 'function bb(){const[a,l]=b.useState(Rl||{permissions:[...Ii],canManage:Po(qo()),loading:!Rl})',
    new: 'function bb(){const[a,l]=b.useState(Rl||{permissions:[],canManage:!1,loading:!0})',
  },
  {
    name: 'route guard access denied',
    old: 'if(!r.includes(a)){const u=Ii.find(p=>r.includes(p))||"dashboard",f=u==="invoices"?"/invoices":u==="master"?"/master":u==="reports"?"/reports":u==="analysis"?"/analysis":u==="audit_log"?"/audit-log":u==="recovery_log"?"/recovery-log":u==="excess_approval"?"/excess-approval-settings":"/dashboard";return i.jsx(Hi,{to:f,replace:!0})}return i.jsx(i.Fragment,{children:l})}function QT()',
    new: 'if(!r.length)return i.jsx("div",{className:"flex min-h-[60vh] items-center justify-center p-6",children:i.jsxs("div",{className:"max-w-md text-center",children:[i.jsx("h2",{className:"text-lg font-semibold text-slate-800",children:"Access not granted"}),i.jsx("p",{className:"mt-2 text-sm text-slate-500",children:"Your account is not on the eBilling access list."})]})});if(!r.includes(a)){const u=Ii.find(p=>r.includes(p)),f=u==="invoices"?"/invoices":u==="master"?"/master":u==="reports"?"/reports":u==="analysis"?"/analysis":u==="audit_log"?"/audit-log":u==="recovery_log"?"/recovery-log":u==="excess_approval"?"/excess-approval-settings":"/dashboard";return u?i.jsx(Hi,{to:f,replace:!0}):i.jsx("div",{className:"flex min-h-[60vh] items-center justify-center p-6",children:i.jsxs("div",{className:"max-w-md text-center",children:[i.jsx("h2",{className:"text-lg font-semibold text-slate-800",children:"Access not granted"}),i.jsx("p",{className:"mt-2 text-sm text-slate-500",children:"Your account is not on the eBilling access list."})]})})}return i.jsx(i.Fragment,{children:l})}function QT()',
  },
];

for (const patch of patches) {
  if (!s.includes(patch.old)) {
    console.error(`Missing patch target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Allowlist access patch complete');
