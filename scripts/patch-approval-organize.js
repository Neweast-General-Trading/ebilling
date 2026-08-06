#!/usr/bin/env node
/** Fix approval request page + clean up dashboard/sidebar/nav */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const approvalPageRaw = fs.readFileSync(path.join(__dirname, 'fragments/approval-request-page.js'), 'utf8').trim();
const compactPanel = fs.readFileSync(path.join(__dirname, 'fragments/ebill-approval-panel-compact.js'), 'utf8').trim();
let approvalPage;
try {
  approvalPage = require('esbuild').transformSync(approvalPageRaw, { loader: 'js', minify: true }).code;
} catch {
  approvalPage = approvalPageRaw;
}

const patches = [
  {
    name: 'api queue token routes',
    old: 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_MY_APPROVE:',
    new: 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_QUEUE:a=>`/excess-approval/queue/${a}`,EXCESS_APPROVAL_QUEUE_APPROVE:a=>`/excess-approval/queue/${a}/approve`,EXCESS_APPROVAL_QUEUE_REJECT:a=>`/excess-approval/queue/${a}/reject`,EXCESS_APPROVAL_MY_APPROVE:',
  },
  {
    name: 'nav label APPROVAL REQUEST',
    old: '{id:"approval_request",label:"Approval request",path:"/approval-request"}',
    new: '{id:"approval_request",label:"APPROVAL REQUEST",path:"/approval-request"}',
  },
  {
    name: 'nav visible for all signed-in users',
    old: 'p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):u(m.id)||m.id==="approval_request"&&u("invoices")),[u,f])',
    new: 'p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):m.id==="approval_request"||u(m.id)),[u,f])',
  },
  {
    name: 'register approval request route',
    old: 'path:"/invoices",element:i.jsx(En,{children:i.jsx(zl,{permission:"invoices",children:i.jsx(gT,{})})})}),i.jsx(ga,{path:"/analysis"',
    new: 'path:"/invoices",element:i.jsx(En,{children:i.jsx(zl,{permission:"invoices",children:i.jsx(gT,{})})})}),i.jsx(ga,{path:"/approval-request",element:i.jsx(En,{children:i.jsx(EbApprovalRequestRoute,{})})}),i.jsx(ga,{path:"/analysis"',
  },
  {
    old: 'function EbApprovalRequestRoute(){return i.jsx(zl,{permission:"invoices",children:i.jsx(EbApprovalRequestPage,{})})}',
    new: 'function EbApprovalRequestRoute(){return i.jsx(EbApprovalRequestPage,{})}',
  },
  {
    name: 'remove right approval sidebar panel',
    old: '_?i.jsx("aside",{className:"eb-shell-right",children:i.jsxs("div",{className:"eb-approval-inner",children:[i.jsxs("div",{className:"eb-approval-head",children:[i.jsx("div",{className:"eb-approval-icon",children:"✓"}),i.jsxs("div",{className:"min-w-0 flex-1",children:[i.jsx("h3",{children:"APPROVAL REQUEST"}),i.jsx("p",{children:"Quick access"})]}),i.jsx("button",{type:"button",className:"eb-shell-hide-btn","aria-label":"Hide approvals panel",onClick:()=>C(!1),children:"⟩"})]}),i.jsx(EbillApprovalPanel,{}),ebIsRecoveryApprover(EbShellEmail)?i.jsx(EbRecoveryRequestsPanel,{}):null]})}):null,!_?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-right","aria-label":"Show approvals panel",onClick:()=>C(!0),children:ebIsRecoveryApprover(EbShellEmail)&&!h?"Recovery":"Approvals"}):null',
    new: '_&&ebIsRecoveryApprover(EbShellEmail)?i.jsx("aside",{className:"eb-shell-right",children:i.jsx("div",{className:"eb-approval-inner",children:i.jsx(EbRecoveryRequestsPanel,{})})}):null,!_&&ebIsRecoveryApprover(EbShellEmail)?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-right","aria-label":"Show recovery panel",onClick:()=>C(!0),children:"Recovery"}):null',
  },
  {
    name: 'remove show approvals toolbar button',
    old: 'i.jsx("button",{type:"button",className:"eb-shell-tool-btn",onClick:()=>C(!_),children:_?"Hide approvals":"Show approvals"}),',
    new: '',
  },
  {
    old: 'i.jsx("h3",{children:"E-bill Approval"})',
    new: 'i.jsx("h3",{children:"APPROVAL REQUEST"})',
  },
  {
    name: 'right panel hidden by default',
    old: '[_,N]=b.useState(()=>localStorage.getItem("eb-shell-right")!=="0")',
    new: '[_,N]=b.useState(()=>localStorage.getItem("eb-shell-right")==="1")',
  },
  {
    name: 'dashboard single approval card',
    old: 'i.jsxs("div",{className:"grid gap-3 sm:grid-cols-2 xl:grid-cols-4",children:[i.jsx(Id,{title:"Pending approval",value:u?.approvalStats?.pendingApproval??0,subtitle:"Awaiting employee"}),i.jsx(Id,{title:"Waiting confirmation",value:u?.approvalStats?.waitingConfirmation??0,subtitle:"Resent emails"}),i.jsx(Id,{title:"Ready for recovery",value:u?.approvalStats?.readyForRecovery??0,subtitle:"Approved for Oracle"}),i.jsx(Id,{title:"Approval emails sent",value:u?.approvalStats?.approvalEmailsSent??0,subtitle:"Total send count"})]})',
    new: 'i.jsx("div",{className:"grid gap-3",children:i.jsx(Ts,{to:"/approval-request",className:"block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",children:i.jsx(Je,{className:"border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm transition hover:border-sky-300 hover:shadow-md",children:i.jsxs(We,{className:"flex flex-wrap items-center justify-between gap-4 p-5",children:[i.jsxs("div",{children:[i.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-sky-700",children:"APPROVAL REQUEST"}),i.jsx("p",{className:"mt-1 text-sm text-slate-600",children:"Review excess invoices — approve, reject, or open details."})]}),i.jsxs("div",{className:"inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white",children:[i.jsx(Cb,{className:"size-4"}),"Open queue"]})]})})})})',
  },
];

for (const patch of patches) {
  if (patch.new && s.includes(patch.new)) {
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
    'function EbApprovalRequestRoute(){return i.jsx(EbApprovalRequestPage,{})}',
    'function EbApprovalRequestRoute(){return i.jsx(zl,{permission:"invoices",children:i.jsx(EbApprovalRequestPage,{})})}',
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
}

const panelStart = s.indexOf('function EbillApprovalPanel()');
const panelEnd = s.indexOf('function pw(', panelStart);
if (panelStart >= 0 && panelEnd > panelStart) {
  s = s.slice(0, panelStart) + compactPanel + s.slice(panelEnd);
  console.log('Updated compact sidebar panel');
}

fs.writeFileSync(bundlePath, s);
try {
  new Function(s);
  console.log('Bundle parse OK');
} catch (e) {
  console.error('Bundle parse FAIL', e.message);
  process.exit(1);
}

const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('20260714approvalfix')) {
  fs.writeFileSync(
    indexPath,
    index.replace(/index-DGxZ6d5S\.js\?v=[^"]+/, 'index-DGxZ6d5S.js?v=20260714approvalfix'),
  );
  console.log('Bumped cache version');
}

console.log('Approval organize patch complete');
