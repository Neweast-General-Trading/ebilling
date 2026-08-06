#!/usr/bin/env node
/** Simulation-only recovery approval flow for sakour (request) + olga (approve/reject). */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
let s = fs.readFileSync(bundlePath, 'utf8');

const helperBlock = `const EB_SIM_REQUESTER="sakour@neweast.co",EB_SIM_APPROVER="olga@neweast.co";function ebIsSimRequester(a){return (a||"").toLowerCase()===EB_SIM_REQUESTER}function ebIsSimApprover(a){return (a||"").toLowerCase()===EB_SIM_APPROVER}function ebLoadSimOverlay(a,l,r){return ebIsSimRequester(l)?De.get(ze.SIM_RECOVERY_STATUS,{params:{co:a}}).then(({data:o})=>{r(o?.byInvoiceId||{});return o}).catch(()=>(r({}),null)):Promise.resolve(r({}))}function ebSimGridApprovalCell(a,l,r,o,u,f,p){if(!ebIsSimRequester(r)||a.approval_status!=="ready_for_recovery")return null;const m=o[String(a.invoice_id)];return m?.status==="pending"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Recovery request pending"}):m?.status==="approved"?i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Recovery Done"}):m?.status==="rejected"?i.jsxs("span",{className:"text-xs font-medium text-red-700",title:m.rejectReason||"",children:["Rejected: ",m.rejectReason||"—"]}):i.jsxs(Me,{variant:"outline",size:"sm",disabled:u===a.invoice_id,onClick:async()=>{f(a.invoice_id);try{await De.post(ze.SIM_RECOVERY_REQUEST+"?co="+l,{invoiceId:a.invoice_id}),se.success("Recovery request sent for simulation approval"),await p(),window.dispatchEvent(new Event("ebilling:recovery-sim-refresh"))}catch(v){se.error(Eo(v))}finally{f(null)}},className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-50",children:[u===a.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Request recovery"]})}function EbRecoverySimulationPanel(){const a=ka(),{email:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState(!0),[p,m]=b.useState(null),[v,y]=b.useState(null),[g,_]=b.useState(null),N=b.useCallback(A=>{if(!ebIsSimApprover(l)){o([]),f(!1);return}A!==!0&&f(!0),De.get(ze.SIM_RECOVERY_REQUESTS,{params:{co:a}}).then(({data:C})=>o(C?.items||[])).catch(()=>o([])).finally(()=>f(!1))},[a,l]);b.useEffect(()=>{N()},[N]),b.useEffect(()=>{const A=()=>N(!0);return window.addEventListener("ebilling:recovery-sim-refresh",A),()=>window.removeEventListener("ebilling:recovery-sim-refresh",A)},[N]);if(!ebIsSimApprover(l))return null;return i.jsxs(i.Fragment,{children:[i.jsxs("section",{className:"eb-approval-section eb-sim-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Recovery Requests"}),i.jsx("span",{className:"eb-approval-section-count eb-sim-badge",children:"SIM"})]}),i.jsx("p",{className:"eb-sim-note",children:"Simulation only — no Oracle or invoice data is changed."}),i.jsx("div",{className:"eb-approval-section-body",children:u?i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"Loading recovery requests…"}):r.length?r.map(A=>i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich",children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:A.invoiceCode||A.phoneNumber||"Invoice"}),i.jsx("p",{className:"eb-approval-name",children:A.displayName||"Employee"}),i.jsx("p",{className:"eb-approval-phone",children:A.monthLabel||"—"})]}),i.jsxs("span",{className:"eb-approval-badge eb-approval-badge-ready",children:["AED ",Li(A.personalUsage??0)]})]}),i.jsxs("div",{className:"eb-approval-meta",children:[i.jsxs("div",{children:[i.jsx("span",{children:"Requested by"}),i.jsx("strong",{children:A.requestedBy||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Person #"}),i.jsx("strong",{children:A.personNumber||"—"})]})]}),i.jsxs("div",{className:"eb-approval-actions",children:[i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-recovery",disabled:p===A.id,onClick:()=>y({type:"approve",row:A}),children:[p===A.id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Approve"]}),i.jsxs(Me,{size:"sm",variant:"outline",className:"eb-approval-btn",disabled:p===A.id,onClick:()=>y({type:"reject",row:A}),children:[i.jsx(Dd,{className:"size-3.5"})," Reject"]})]})]},String(A.id))):i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"No recovery simulation requests."})})]}),v?i.jsx(EbConfirmModal,{title:v.type==="approve"?"Approve recovery simulation":"Reject recovery simulation",message:v.type==="approve"?"Simulate Oracle recovery for "+(v.row.displayName||"this employee")+" (AED "+Li(v.row.personalUsage??0)+")? No production data will change.":"Reject recovery simulation for "+(v.row.displayName||"this employee")+"?",confirmLabel:v.type==="approve"?"Approve":"Continue",confirmTone:v.type==="approve"?"recovery":"primary",loading:p===v.row.id,onClose:()=>y(null),onConfirm:async()=>{if(v.type==="reject"){y(null),_(v.row);return}m(v.row.id);try{await De.post(ze.SIM_RECOVERY_APPROVE(v.row.id)+"?co="+a,{}),se.success("Recovery simulation approved — Recovery Done"),y(null),N(!0),window.dispatchEvent(new Event("ebilling:recovery-sim-refresh"))}catch(A){se.error(Eo(A))}finally{m(null)}}}):null,g?i.jsx(EbConfirmModal,{title:"Reject recovery simulation",message:"Enter the reason for rejecting "+(g.displayName||"this employee")+".",confirmLabel:"Reject",confirmTone:"primary",loading:p===g.id,onClose:()=>_(null),onConfirm:async()=>{const A=(window.prompt("Reject reason")||"").trim();if(!A){se.error("Reject reason is required");return}m(g.id);try{await De.post(ze.SIM_RECOVERY_REJECT(g.id)+"?co="+a,{reason:A}),se.success("Recovery simulation rejected"),_(null),N(!0),window.dispatchEvent(new Event("ebilling:recovery-sim-refresh"))}catch(C){se.error(Eo(C))}finally{m(null)}}}):null]})}function EbConfirmModal({title:a,message:l,confirmLabel:r,confirmTone:o,loading:u,onClose:f,onConfirm:p})`;

const anchor = 'function EbConfirmModal({title:a,message:l,confirmLabel:r,confirmTone:o,loading:u,onClose:f,onConfirm:p})';
if (!s.includes(anchor)) {
  console.error('EbConfirmModal anchor not found');
  process.exit(1);
}
if (!s.includes('EB_SIM_REQUESTER')) {
  s = s.replace(anchor, helperBlock);
  console.log('Injected recovery simulation helpers');
} else {
  console.log('Recovery simulation helpers already present');
}

const patches = [
  {
    name: 'ze simulation endpoints',
    old: 'INVOICES_RECOVERY_SENT:"/invoices/recovery/sent",DASHBOARD:"/dashboard"',
    new: 'INVOICES_RECOVERY_SENT:"/invoices/recovery/sent",SIM_RECOVERY_STATUS:"/invoices/simulation/recovery/status",SIM_RECOVERY_REQUESTS:"/invoices/simulation/recovery/requests",SIM_RECOVERY_REQUEST:"/invoices/simulation/recovery/request",SIM_RECOVERY_APPROVE:a=>`/invoices/simulation/recovery/${a}/approve`,SIM_RECOVERY_REJECT:a=>`/invoices/simulation/recovery/${a}/reject`,DASHBOARD:"/dashboard"',
  },
  {
    name: 'gT sim state',
    old: 'function gT(){const a=ka(),l=vb(),',
    new: 'function gT(){const a=ka(),l=vb(),{email:EbSimEmail}=bb(),[EbSimOverlay,SetEbSimOverlay]=b.useState({}),[EbSimBusy,SetEbSimBusy]=b.useState(null),',
  },
  {
    name: 'gT sim overlay loader',
    old: '};return i.jsxs("div",{className:"space-y-6",children:[i.jsxs(Je,{children:[i.jsx(yt,{children:i.jsx(jt,{children:"Upload',
    new: '};b.useEffect(()=>{ebLoadSimOverlay(a,EbSimEmail,SetEbSimOverlay)},[a,EbSimEmail,f]),b.useEffect(()=>{const O=()=>ebLoadSimOverlay(a,EbSimEmail,SetEbSimOverlay);return window.addEventListener("ebilling:recovery-sim-refresh",O),()=>window.removeEventListener("ebilling:recovery-sim-refresh",O)},[a,EbSimEmail]);return i.jsxs("div",{className:"space-y-6",children:[i.jsxs(Je,{children:[i.jsx(yt,{children:i.jsx(jt,{children:"Upload',
  },
  {
    name: 'grid ready_for_recovery simulation button',
    old: 'O.approval_status==="ready_for_recovery"?ev(O,l)?i.jsxs(Me,{variant:"outline",size:"sm",disabled:fe===O.invoice_id||Jcg===O.invoice_id,onClick:()=>Dcg(O),className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-50",children:[fe===O.invoice_id||Jcg===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]}):i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Ready for recovery"})',
    new: 'O.approval_status==="ready_for_recovery"?(ebSimGridApprovalCell(O,a,EbSimEmail,EbSimOverlay,EbSimBusy,SetEbSimBusy,()=>ebLoadSimOverlay(a,EbSimEmail,SetEbSimOverlay))|| (ev(O,l)?i.jsxs(Me,{variant:"outline",size:"sm",disabled:fe===O.invoice_id||Jcg===O.invoice_id,onClick:()=>Dcg(O),className:"h-8 whitespace-nowrap border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-50",children:[fe===O.invoice_id||Jcg===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]}):i.jsx("span",{className:"text-xs font-semibold text-emerald-700",children:"Ready for recovery"})))',
  },
  {
    name: 'shell email for sim approver',
    old: 'const {hasPermission:u,loading:f,canManage:h}=bb(),',
    new: 'const {hasPermission:u,loading:f,canManage:h,email:EbShellEmail}=bb(),',
  },
  {
    name: 'shell recovery simulation panel',
    old: 'i.jsx(EbillApprovalPanel,{})]})}):null,!_?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-right","aria-label":"Show approvals panel",onClick:()=>C(!0),children:"Approvals"}):null]})}',
    new: 'h?i.jsx(EbillApprovalPanel,{}):null,ebIsSimApprover(EbShellEmail)?i.jsx(EbRecoverySimulationPanel,{}):null]})}):null,!_?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-right","aria-label":"Show approvals panel",onClick:()=>C(!0),children:ebIsSimApprover(EbShellEmail)&&!h?"Recovery":"Approvals"}):null]})}',
  },
];

for (const patch of patches) {
  if (!s.includes(patch.old)) {
    if (patch.name.includes('shell') && (s.includes('EbShellEmail') || s.includes('EbRecoverySimulationPanel'))) {
      console.log(`Skipped (already applied): ${patch.name}`);
      continue;
    }
    console.error(`Missing patch target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);

const cssExtra = `

.eb-sim-section {
  border-top: 1px dashed rgba(124, 58, 237, 0.35);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.eb-sim-badge {
  background: #ede9fe;
  color: #6d28d9;
}

.eb-sim-note {
  margin: 0 0 0.65rem;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: #f5f3ff;
  color: #5b21b6;
  font-size: 0.72rem;
  line-height: 1.35;
}
`;

if (!fs.readFileSync(cssPath, 'utf8').includes('.eb-sim-section')) {
  fs.appendFileSync(cssPath, cssExtra);
  console.log('Appended simulation CSS');
}

console.log('Recovery simulation patch complete');
