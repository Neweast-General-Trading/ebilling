#!/usr/bin/env node
/** Integrate Approval Request page into SPA + compact sidebar */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
const redirectPath = path.join(__dirname, '../client/dist/approval-request/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const approvalPageRaw = fs.readFileSync(path.join(__dirname, 'fragments/approval-request-page.js'), 'utf8').trim();
let approvalPage;
try {
  approvalPage = require('esbuild').transformSync(approvalPageRaw, { loader: 'js', minify: true }).code;
} catch {
  approvalPage = approvalPageRaw;
}
const compactPanel = fs.readFileSync(path.join(__dirname, 'fragments/ebill-approval-panel-compact.js'), 'utf8').trim();

const patches = [
  {
    name: 'api queue token routes',
    old: 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_MY_APPROVE:',
    new: 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_QUEUE:a=>`/excess-approval/queue/${a}`,EXCESS_APPROVAL_QUEUE_APPROVE:a=>`/excess-approval/queue/${a}/approve`,EXCESS_APPROVAL_QUEUE_REJECT:a=>`/excess-approval/queue/${a}/reject`,EXCESS_APPROVAL_MY_APPROVE:',
  },
  {
    name: 'nav after invoices',
    old: '{id:"invoices",label:"Invoices",path:"/invoices"},{id:"recovery_log",label:"Recovery",path:"/recovery-log"}',
    new: '{id:"invoices",label:"Invoices",path:"/invoices"},{id:"approval_request",label:"APPROVAL REQUEST",path:"/approval-request"},{id:"recovery_log",label:"Recovery",path:"/recovery-log"}',
  },
  {
    name: 'show approval request nav with invoices perm',
    old: 'p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):u(m.id)),[u,f])',
    new: 'p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):u(m.id)||m.id==="approval_request"&&u("invoices")),[u,f])',
  },
  {
    name: 'shell sidebar title',
    old: 'children:"Pending & recovery queue"',
    new: 'children:"Quick access"',
  },
  {
    name: 'route approval request',
    old: 'path:"/invoices",element:i.jsx(En,{children:i.jsx(zl,{permission:"invoices",children:i.jsx(gT,{})})})}),i.jsx(ga,{path:"/analysis"',
    new: 'path:"/invoices",element:i.jsx(En,{children:i.jsx(zl,{permission:"invoices",children:i.jsx(gT,{})})})}),i.jsx(ga,{path:"/approval-request",element:i.jsx(En,{children:i.jsx(EbApprovalRequestRoute,{})})}),i.jsx(ga,{path:"/analysis"',
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

if (s.includes('function EbApprovalRequestPage()')) {
  const start = s.indexOf('function EbApprovalRequestPage');
  const endMarkers = [
    'function EbApprovalRequestRoute(){return i.jsx(zl,{permission:"invoices",children:i.jsx(EbApprovalRequestPage,{})})}',
    'function nA(){return i.jsx(zl,{permission:"invoices",children:i.jsx(EbApprovalRequestPage,{})})}',
  ];
  let end = -1;
  let endMarker = '';
  for (const marker of endMarkers) {
    const idx = s.indexOf(marker, start);
    if (idx >= 0) {
      end = idx;
      endMarker = marker;
      break;
    }
  }
  if (end > start) {
    s = s.slice(0, start) + approvalPage + s.slice(end + endMarker.length);
    console.log('Updated EbApprovalRequestPage');
  }
} else {
  const anchor = 'function WT(){localStorage.setItem';
  if (!s.includes(anchor)) {
    console.error('Missing WT anchor');
    process.exit(1);
  }
  s = s.replace(anchor, approvalPage + anchor);
  console.log('Injected EbApprovalRequestPage');
}

const panelStart = s.indexOf('function EbExcessSidebarItem');
const panelEnd = s.indexOf('function pw(', panelStart);
if (panelStart >= 0 && panelEnd > panelStart) {
  s = s.slice(0, panelStart) + compactPanel + s.slice(panelEnd);
  console.log('Replaced sidebar panel with compact version');
} else {
  const oldStart = s.indexOf('function EbillApprovalPanel()');
  const oldEnd = s.indexOf('function pw(', oldStart);
  if (oldStart >= 0 && oldEnd > oldStart) {
    s = s.slice(0, oldStart) + compactPanel + s.slice(oldEnd);
    console.log('Replaced EbillApprovalPanel');
  }
}

if (s.includes('h?i.jsx(EbillApprovalPanel,{}):null')) {
  s = s.replace('h?i.jsx(EbillApprovalPanel,{}):null', 'i.jsx(EbillApprovalPanel,{})');
  console.log('Sidebar visible for all users');
}

fs.writeFileSync(bundlePath, s);
try {
  new Function(s);
  console.log('Bundle parse OK');
} catch (e) {
  console.error('Bundle parse FAIL', e.message);
  process.exit(1);
}

const tokenRedirect = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <title>eBilling | Approval Request</title>
    <script>
      (function () {
        var host = location.hostname;
        var base = host === "ebilling.neweast.cloud" ? "" : "/ebilling";
        var parts = location.pathname.split("/").filter(Boolean);
        if (parts[0] === "ebilling") parts.shift();
        var idx = parts.indexOf("approval-request");
        if (idx < 0) return;
        var token = idx >= 0 && parts[idx + 1] && parts[idx + 1].indexOf(".") === -1 ? parts[idx + 1] : "";
        var params = new URLSearchParams(location.search);
        if (token && !params.get("token")) params.set("token", token);
        var q = params.toString();
        var desired = base + "/approval-request" + (q ? "?" + q : "") + location.hash;
        var current = location.pathname + location.search + location.hash;
        if (current !== desired) history.replaceState(null, "", desired);
      })();
    </script>
    <script type="module" crossorigin src="/assets/index-approval-v2.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-fLDltgH_.css">
    <link rel="stylesheet" href="/assets/ebilling-shell.css?v=19">
  </head>
  <body>
    <script>
      (function () {
        var p = new URLSearchParams(window.location.search);
        var c = p.get("co");
        if (c) { try { localStorage.setItem("rectracking_co", c); } catch (e) {} }
      })();
    </script>
    <div id="root"></div>
  </body>
</html>`;
fs.writeFileSync(redirectPath, tokenRedirect);

const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('20260714approvalpage')) {
  fs.writeFileSync(
    indexPath,
    index.replace(/index-DGxZ6d5S\.js\?v=[^"]+/, 'index-DGxZ6d5S.js?v=20260714approvalpage'),
  );
  console.log('Bumped cache version');
}

console.log('Approval request SPA integration complete');
