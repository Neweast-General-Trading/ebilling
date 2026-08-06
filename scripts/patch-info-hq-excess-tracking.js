#!/usr/bin/env node
/**
 * info.hq@neweast.co: always show APPROVAL REQUEST with tracking view;
 * allow read-only all-requests API access on that page.
 */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');

const helper = `function EbIsExcessTrackingUser(){var e=(qo()||"").toLowerCase();return e==="info.hq@neweast.co";}function EbCanViewExcessTracking(){return EbCanViewAllRequests()||EbIsExcessTrackingUser();}`;

if (!s.includes('function EbIsExcessTrackingUser(')) {
  const anchor = 'function EbCanViewAllRequests()';
  if (!s.includes(anchor)) throw new Error('info-hq: EbCanViewAllRequests anchor missing');
  s = s.replace(anchor, helper + anchor);
  console.log('injected: EbIsExcessTrackingUser helpers');
}

const patches = [
  {
    name: 'all requests access for info.hq',
    old: 'if(!EbCanViewAllRequests()){return i.jsx("div",{className:"p-10 text-center text-sm text-slate-500",children:"This view is restricted."});}',
    new: 'if(!EbCanViewExcessTracking()){return i.jsx("div",{className:"p-10 text-center text-sm text-slate-500",children:"This view is restricted."});}',
  },
  {
    name: 'approval route tracking view for info.hq',
    old: 'if(t)return i.jsx(Mn,{children:i.jsx(EbApprovalRequestPage,{})});if(localStorage.getItem("jwt"))return i.jsx(En,{children:i.jsx(EbApprovalRequestPage,{})});',
    new: 'if(t)return i.jsx(Mn,{children:i.jsx(EbApprovalRequestPage,{})});if(localStorage.getItem("jwt")&&EbIsExcessTrackingUser())return i.jsx(En,{children:i.jsx(EbAllRequestsPage,{})});if(localStorage.getItem("jwt"))return i.jsx(En,{children:i.jsx(EbApprovalRequestPage,{})});',
  },
  {
    name: 'tracking page title for info.hq',
    old: 'children:"All requests"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Read-only view of every excess approval request and its level status. Viewing here does not approve or reject anything."})',
    new: 'children:EbIsExcessTrackingUser()?"Approval request tracking":"All requests"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:EbIsExcessTrackingUser()?"Track every excess approval request and its level status. This view is read-only.":"Read-only view of every excess approval request and its level status. Viewing here does not approve or reject anything."})',
  },
];

for (const patch of patches) {
  if (s.includes(patch.new)) {
    console.log(`already: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) throw new Error(`info-hq: missing anchor -> ${patch.name}`);
  s = s.replace(patch.old, patch.new);
  console.log(`applied: ${patch.name}`);
}

fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-info-hq-excess-tracking: done');
