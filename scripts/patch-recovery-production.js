#!/usr/bin/env node
/** Production recovery approval: all admins request, Olga approves → Oracle + Teams. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const helperStart = 'const EB_SIM_REQUESTER=';
const helperEnd = 'function EbConfirmModal';
const startIdx = s.indexOf(helperStart);
const endIdx = s.indexOf(helperEnd);
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
  console.error('Recovery helper block not found');
  process.exit(1);
}

const productionHelper = `const EB_RECOVERY_APPROVER="olga@neweast.co";function ebIsRecoveryApprover(a){return (a||"").toLowerCase()===EB_RECOVERY_APPROVER}function ebLoadRecoveryOverlay(a,l,r){return l?De.get(ze.RECOVERY_REQUEST_STATUS,{params:{co:a}}).then(({data:o})=>{r(o?.byInvoiceId||{});return o}).catch(()=>(r({}),null)):Promise.resolve(r({}))}function ebRecoveryGridCell(a,l,r,o,u,f,p){if(!r||a.approval_status!=="ready_for_recovery")return i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Ready for recovery"});const m=o[String(a.invoice_id)];return m?.status==="pending"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Recovery request pending"}):m?.status==="approved"?i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Sent to Oracle"}):m?.status==="rejected"?i.jsxs("span",{className:"text-xs font-medium text-red-700",title:m.rejectReason||"",children:["Rejected: ",m.rejectReason||"—"]}):i.jsxs(Me,{variant:"outline",size:"sm",disabled:!0,title:"Temporarily disabled",className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 opacity-60",children:[i.jsx(Dd,{className:"size-3.5"}),"Request recovery"]})}function EbRecoveryRequestsPanel(){const a=ka(),{email:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState(!0),[p,m]=b.useState(null),[v,y]=b.useState(null),[g,_]=b.useState(null),N=b.useCallback(A=>{if(!ebIsRecoveryApprover(l)){o([]),f(!1);return}A!==!0&&f(!0),De.get(ze.RECOVERY_REQUESTS,{params:{co:a}}).then(({data:C})=>o(C?.items||[])).catch(()=>o([])).finally(()=>f(!1))},[a,l]);b.useEffect(()=>{N()},[N]),b.useEffect(()=>{const A=()=>N(!0);return window.addEventListener("ebilling:recovery-refresh",A),()=>window.removeEventListener("ebilling:recovery-refresh",A)},[N]);if(!ebIsRecoveryApprover(l))return null;return i.jsxs(i.Fragment,{children:[i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Recovery Requests"}),i.jsx("span",{className:"eb-approval-section-count",children:r.length})]}),i.jsx("div",{className:"eb-approval-section-body",children:u?i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"Loading recovery requests…"}):r.length?r.map(A=>i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich",children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:A.invoiceCode||A.phoneNumber||"Invoice"}),i.jsx("p",{className:"eb-approval-name",children:A.displayName||"Employee"}),i.jsx("p",{className:"eb-approval-phone",children:A.monthLabel||"—"})]}),i.jsxs("span",{className:"eb-approval-badge eb-approval-badge-ready",children:["AED ",Li(A.personalUsage??0)]})]}),i.jsxs("div",{className:"eb-approval-meta",children:[i.jsxs("div",{children:[i.jsx("span",{children:"Requested by"}),i.jsx("strong",{children:A.requestedBy||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Person #"}),i.jsx("strong",{children:A.personNumber||"—"})]})]}),i.jsxs("div",{className:"eb-approval-actions",children:[i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-recovery",disabled:p===A.id,onClick:()=>y({type:"approve",row:A}),children:[p===A.id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Approve"]}),i.jsxs(Me,{size:"sm",variant:"outline",className:"eb-approval-btn",disabled:p===A.id,onClick:()=>y({type:"reject",row:A}),children:[i.jsx(Dd,{className:"size-3.5"})," Reject"]})]})]},String(A.id))):i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"No pending recovery requests."})})]}),v?i.jsx(EbConfirmModal,{title:v.type==="approve"?"Approve recovery":"Reject recovery",message:v.type==="approve"?"Send recovery to Oracle for "+(v.row.displayName||"this employee")+" (AED "+Li(v.row.personalUsage??0)+")?":"Reject recovery for "+(v.row.displayName||"this employee")+"?",confirmLabel:v.type==="approve"?"Approve & send to Oracle":"Continue",confirmTone:v.type==="approve"?"recovery":"primary",loading:p===v.row.id,onClose:()=>y(null),onConfirm:async()=>{if(v.type==="reject"){y(null),_(v.row);return}m(v.row.id);try{const C=await De.post(ze.RECOVERY_APPROVE(v.row.id)+"?co="+a,{});se.success(C?.data?.message||"Recovery sent to Oracle successfully"),y(null),N(!0),window.dispatchEvent(new Event("ebilling:recovery-refresh"))}catch(A){se.error(Eo(A))}finally{m(null)}}}):null,g?i.jsx(EbConfirmModal,{title:"Reject recovery request",message:"Enter the reason for rejecting "+(g.displayName||"this employee")+".",confirmLabel:"Reject",confirmTone:"primary",loading:p===g.id,onClose:()=>_(null),onConfirm:async()=>{const A=(window.prompt("Reject reason")||"").trim();if(!A){se.error("Reject reason is required");return}m(g.id);try{await De.post(ze.RECOVERY_REJECT(g.id)+"?co="+a,{reason:A}),se.success("Recovery request rejected — requester notified on Teams"),_(null),N(!0),window.dispatchEvent(new Event("ebilling:recovery-refresh"))}catch(C){se.error(Eo(C))}finally{m(null)}}}):null]})}`;

s = s.slice(0, startIdx) + productionHelper + s.slice(endIdx);

const endpointOld =
  'SIM_RECOVERY_STATUS:"/invoices/simulation/recovery/status",SIM_RECOVERY_REQUESTS:"/invoices/simulation/recovery/requests",SIM_RECOVERY_REQUEST:"/invoices/simulation/recovery/request",SIM_RECOVERY_APPROVE:a=>`/invoices/simulation/recovery/${a}/approve`,SIM_RECOVERY_REJECT:a=>`/invoices/simulation/recovery/${a}/reject`';
const endpointNew =
  'RECOVERY_REQUEST_STATUS:"/invoices/recovery/requests/status",RECOVERY_REQUESTS:"/invoices/recovery/requests/requests",RECOVERY_REQUEST:"/invoices/recovery/requests/request",RECOVERY_APPROVE:a=>`/invoices/recovery/requests/${a}/approve`,RECOVERY_REJECT:a=>`/invoices/recovery/requests/${a}/reject`';

if (!s.includes(endpointOld)) {
  if (s.includes('RECOVERY_REQUEST_STATUS')) {
    console.log('Endpoints already production');
  } else {
    console.error('Endpoint patch target missing');
    process.exit(1);
  }
} else {
  s = s.replace(endpointOld, endpointNew);
  console.log('Updated API endpoints');
}

const replacements = [
  ['{email:EbSimEmail}=bb(),[EbSimOverlay,SetEbSimOverlay]', '{canManage:EbCanManage}=bb(),[EbRecOverlay,SetEbRecOverlay]'],
  ['[EbSimBusy,SetEbSimBusy]', '[EbRecBusy,SetEbRecBusy]'],
  [
    'O.approval_status==="ready_for_recovery"?(ebSimGridApprovalCell(O,a,EbSimEmail,EbSimOverlay,EbSimBusy,SetEbSimBusy,()=>ebLoadSimOverlay(a,EbSimEmail,SetEbSimOverlay))|| (ev(O,l)?i.jsxs(Me,{variant:"outline",size:"sm",disabled:fe===O.invoice_id||Jcg===O.invoice_id,onClick:()=>Dcg(O),className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-50",children:[fe===O.invoice_id||Jcg===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]}):i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Ready for recovery"})))',
    'O.approval_status==="ready_for_recovery"?ebRecoveryGridCell(O,a,EbCanManage,EbRecOverlay,EbRecBusy,SetEbRecBusy,()=>ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay))',
  ],
  ['ebLoadSimOverlay(a,EbSimEmail,SetEbSimOverlay)', 'ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay)'],
  ['ebilling:recovery-sim-refresh', 'ebilling:recovery-refresh'],
  ['EbSimOverlay', 'EbRecOverlay'],
  ['EbSimBusy', 'EbRecBusy'],
  ['SetEbSimBusy', 'SetEbRecBusy'],
  ['SetEbSimOverlay', 'SetEbRecOverlay'],
  ['ebIsSimApprover', 'ebIsRecoveryApprover'],
  ['EbRecoverySimulationPanel', 'EbRecoveryRequestsPanel'],
  ['[a,EbSimEmail,f]', '[a,EbCanManage,f]'],
  ['[a,EbSimEmail]', '[a,EbCanManage]'],
];

for (const [oldStr, newStr] of replacements) {
  if (s.includes(oldStr)) {
    s = s.split(oldStr).join(newStr);
    console.log('Replaced:', oldStr.slice(0, 60));
  } else {
    console.log('Skipped (missing):', oldStr.slice(0, 60));
  }
}

if (s.includes('EB_SIM_REQUESTER') || s.includes('ebSimGridApprovalCell')) {
  console.error('Critical simulation artifacts remain');
  process.exit(1);
}

fs.writeFileSync(bundlePath, s);
console.log('Recovery production patch complete');
