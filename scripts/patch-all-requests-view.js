#!/usr/bin/env node
/**
 * Read-only "All requests" view for super admin + info.hq tracking.
 * Adds sidebar nav item + route + page with OD column and level status.
 */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
const pageFragment = fs.readFileSync(path.join(__dirname, 'fragments/all-requests-page.js'), 'utf8').trim();
let s = fs.readFileSync(bundle, 'utf8');

const steps = [
  {
    name: 'api constant',
    old: 'EXCESS_APPROVAL_MY_HISTORY:"/excess-approval/my-history",',
    new: 'EXCESS_APPROVAL_MY_HISTORY:"/excess-approval/my-history",EXCESS_APPROVAL_REQUESTS:"/excess-approval/requests",',
  },
  {
    name: 'nav item',
    old: '{id:"approval_request",label:"APPROVAL REQUEST",path:"/approval-request"},{id:"recovery_log"',
    new: '{id:"approval_request",label:"APPROVAL REQUEST",path:"/approval-request"},{id:"all_requests",label:"ALL REQUESTS",path:"/all-requests"},{id:"recovery_log"',
  },
  {
    name: 'nav filter',
    old: 'swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):m.id==="approval_request"||u(m.id))',
    new: 'swMain.filter(m=>m.id==="all_requests"?EbCanViewExcessTracking():(f?!["analysis","recovery_log"].includes(m.id):m.id==="approval_request"||u(m.id)))',
  },
  {
    name: 'route',
    old: 'path:"/approval-request",element:i.jsx(En,{children:i.jsx(EbApprovalRequestRoute,{})})}),',
    new: 'path:"/approval-request",element:i.jsx(En,{children:i.jsx(EbApprovalRequestRoute,{})})}),i.jsx(ga,{path:"/all-requests",element:i.jsx(En,{children:i.jsx(EbAllRequestsRoute,{})})}),',
    optional: true,
  },
];

for (const step of steps) {
  if (s.includes(step.new) || (step.name === 'route' && s.includes('path:"/all-requests"'))) {
    console.log(`already applied: ${step.name}`);
    continue;
  }
  if (!s.includes(step.old)) {
    if (step.optional) {
      console.log(`skipped optional: ${step.name}`);
      continue;
    }
    throw new Error(`all-requests: anchor not found -> ${step.name}`);
  }
  s = s.replace(step.old, step.new);
  console.log(`applied: ${step.name}`);
}

const legacyPageBlock =
  'function EbCanViewAllRequests(){var e=(qo()||"").toLowerCase();return e==="sakour@neweast.co"||e==="sakour@neweast.com"||e==="jadsakour@neweast.co";}\nfunction EbAllRequestsRoute';
const routeStart = s.indexOf('function EbAllRequestsRoute');
const wtStart = s.indexOf('function WT(){');

if (routeStart >= 0 && wtStart > routeStart) {
  s = s.slice(0, routeStart) + pageFragment + '\n' + s.slice(wtStart);
  console.log('replaced: EbAllRequestsPage component');
} else if (!s.includes('function EbAllRequestsPage(')) {
  const anchor = 'function WT(){localStorage.setItem';
  if (!s.includes(anchor)) throw new Error('all-requests: WT injection anchor not found');
  const inject = `function EbCanViewAllRequests(){var e=(qo()||"").toLowerCase();return e==="sakour@neweast.co"||e==="sakour@neweast.com"||e==="jadsakour@neweast.co";}\n${pageFragment}\n`;
  s = s.replace(anchor, inject + anchor);
  console.log('injected: EbAllRequestsPage component');
} else {
  throw new Error('all-requests: could not locate EbAllRequestsRoute block');
}

if (s.includes('\\xb7') || s.includes('\\u2026') && s.indexOf('\\u2026') < s.indexOf('function EbAllRequestsPage')) {
  // Only warn if broken escapes remain inside all-requests page
  const pageSlice = s.slice(s.indexOf('function EbAllRequestsRoute'), s.indexOf('function WT(){'));
  if (pageSlice.includes('\\xb7') || pageSlice.includes('month\\u2026') || pageSlice.includes('Loading\\u2026')) {
    throw new Error('all-requests: broken unicode escapes still present in page fragment');
  }
}

fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-all-requests-view: applied');
