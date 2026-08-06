#!/usr/bin/env node
/** Final polish: split approval panel, SAP skip, waiting_confirmation, branding, upload batching. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const oldPanelStart = 'function EbConfirmModal({title:a,message:l,confirmLabel:r,confirmTone:o,loading:u,onClose:f,onConfirm:p})';
const oldPanelEnd = 'Admin access required to manage e-bill approvals."})}';
const panelStartIdx = s.indexOf(oldPanelStart);
const panelEndIdx = s.indexOf(oldPanelEnd);
if (panelStartIdx < 0 || panelEndIdx < 0) {
  console.error('Approval panel block not found');
  process.exit(1);
}

const newPanelBlock = `function EbConfirmModal({title:a,message:l,confirmLabel:r,confirmTone:o,loading:u,onClose:f,onConfirm:p}){return jf.createPortal(i.jsx("div",{className:"eb-confirm-overlay",onClick:m=>m.target===m.currentTarget&&f(),children:i.jsxs("div",{className:"eb-confirm-dialog",children:[i.jsx("h4",{className:"eb-confirm-title",children:a}),i.jsx("p",{className:"eb-confirm-message",children:l}),i.jsxs("div",{className:"eb-confirm-actions",children:[i.jsx(Me,{variant:"outline",onClick:f,disabled:u,children:"Cancel"}),i.jsx(Me,{className:bt(o==="recovery"?"eb-btn-recovery":"eb-btn-primary"),onClick:p,disabled:u,children:u?i.jsxs(i.Fragment,{children:[i.jsx(Kt,{className:"size-4 animate-spin"})," Please wait…"]}):r})]})]})}),document.body)}function ebApprovalStatusLabel(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="pending_approval"?"Pending approval":a.approval_status==="ready_for_recovery"?a.person_number?.trim()?"Ready for recovery":"Ready for recovery (no SAP)":a.approval_status||"—"}function EbApprovalQueueItem({row:a,acting:l,mode:r,onOpen:o,onResend:u,onRecovery:f}){const p=r==="pending",m=r==="recovery",v=!!a.person_number?.trim()&&(a.personal_usage??0)>0,y=l===a.invoice_id;return i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich",children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:a.invoice_code||a.phone_number||"Invoice"}),i.jsx("p",{className:"eb-approval-name",children:a.display_name||"Employee"}),i.jsx("p",{className:"eb-approval-phone",children:a.month_label||a.month})]}),i.jsxs("span",{className:bt("eb-approval-badge",p?"eb-approval-badge-pending":"eb-approval-badge-ready"),children:["AED ",Li(p?a.exceeded_amount??a.excess??0:a.personal_usage??0)]})]}),i.jsxs("div",{className:"eb-approval-meta",children:[i.jsxs("div",{children:[i.jsx("span",{children:"Status"}),i.jsx("strong",{children:ebApprovalStatusLabel(a)})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Sent"}),i.jsx("strong",{children:Kg(a.approval_sent_at)||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Email"}),i.jsx("strong",{className:"truncate",title:a.email||"",children:a.email||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Phone"}),i.jsx("strong",{children:a.phone_number||"—"})]})]}),i.jsxs("div",{className:"eb-approval-actions",children:[i.jsxs(Me,{variant:"outline",size:"sm",className:"eb-approval-btn",disabled:y,onClick:()=>o(a),children:[i.jsx(Dd,{className:"size-3.5"})," Open"]}),p?i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-primary",disabled:y,onClick:()=>u(a),children:[y?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Resend"]}):null,m?i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-recovery",disabled:y||!v,onClick:()=>f(a),children:[y?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Recovery"]}):null]})]},String(a.invoice_id))}function EbillApprovalPanel(){const a=ka(),{canManage:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState([]),[p,m]=b.useState(!0),[v,y]=b.useState(null),[g,_]=b.useState(null),N=b.useCallback(()=>{if(!l){o([]),f([]),m(!1);return}m(!0),De.get(ze.INVOICES_APPROVALS_QUEUE,{params:{co:a}}).then(({data:A})=>{o(A?.pendingApproval||[]),f(A?.readyForRecovery||[])}).catch(()=>{o([]),f([])}).finally(()=>m(!1))},[a,l]);b.useEffect(()=>{N()},[N]),b.useEffect(()=>{const A=()=>N();return window.addEventListener("ebilling:approval-queue-refresh",A),()=>window.removeEventListener("ebilling:approval-queue-refresh",A)},[N]);const A=C=>C.approval_token?window.location.origin+"/ebilling/folder/"+C.approval_token:window.location.origin+"/ebilling/invoices";return l?i.jsxs(i.Fragment,{children:[i.jsxs("div",{className:"eb-approval-list",children:[p?i.jsx("p",{className:"eb-approval-empty",children:"Loading approvals…"}):i.jsxs(i.Fragment,{children:[i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Pending Approval"}),i.jsx("span",{className:"eb-approval-section-count",children:r.length})]}),r.length?r.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty",children:"No invoices waiting for employee approval."})]}),i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Ready for Recovery"}),i.jsx("span",{className:"eb-approval-section-count",children:u.length})]}),u.length?u.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"recovery",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:()=>{},onRecovery:S=>_({type:"recovery",row:S})},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty",children:"No invoices ready for Oracle recovery."})]})]})]}),g?i.jsx(EbConfirmModal,{title:g.type==="resend"?"Resend approval email":"Send recovery to Oracle",message:g.type==="resend"?"Send another approval request to "+(g.row.display_name||"this employee")+" for "+(g.row.month_label||g.row.month)+"? The status will change to Waiting confirmation.":"Push AED "+Li(g.row.personal_usage??0)+" personal usage to Oracle for "+(g.row.display_name||"this employee")+"?",confirmLabel:g.type==="resend"?"Resend email":"Confirm & send",confirmTone:g.type==="recovery"?"recovery":"primary",loading:v===g.row.invoice_id,onClose:()=>_(null),onConfirm:async()=>{y(g.row.invoice_id);try{g.type==="resend"?(await De.post(ze.INVOICES_SEND_FOR_APPROVAL(g.row.invoice_id)+"?co="+a,{},{timeout:6e4}),se.success("Approval email resent")):(await De.post(ze.INVOICES_PUSH_RECOVERY(g.row.invoice_id)+"?co="+a,{},{timeout:12e4}),se.success("Recovery sent to Oracle")),_(null),N(),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}catch(C){se.error(C?.response?.data?.message||C?.message||"Action failed")}finally{y(null)}}}):null]}):i.jsx("p",{className:"eb-approval-empty",children:"Admin access required to manage e-bill approvals."})}`;

s = s.slice(0, panelStartIdx) + newPanelBlock + s.slice(panelEndIdx + oldPanelEnd.length);

const patches = [
  {
    name: 'hT waiting confirmation label',
    old: 'function hT(a){return a.approval_status==="ready_for_recovery"?"Confirmed & Ready for recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Confirmed":a.approval_status==="pending_approval"?"Pending approval"',
    new: 'function hT(a){return a.approval_status==="waiting_confirmation"?"Waiting confirmation ("+(a.approval_email_count||1)+")":a.approval_status==="ready_for_recovery"?"Confirmed & Ready for recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Confirmed":a.approval_status==="pending_approval"?"Pending approval"',
  },
  {
    name: 'Bi includes waiting_confirmation',
    old: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval")&&!!a.email?.trim()}',
    new: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval"||a.approval_status==="waiting_confirmation")&&!!a.email?.trim()}',
  },
  {
    name: 'remove upload instruction paragraph',
    old: 'i.jsxs("p",{className:"rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs text-sky-900",children:["Drop up to ",i.jsxs("strong",{children:[fn," PDF files"]})," at once, or upload a"," ",i.jsx("strong",{children:"full folder"})," — large folders are processed automatically in batches of ",fn,". Only PDF files are parsed; other files in the folder are ignored."]}),',
    new: '',
  },
  {
    name: 'simplify folder upload hint',
    old: 'i.jsxs("span",{className:"text-xs text-slate-500",children:["Includes subfolders · max ",fn," files processed per batch"]})',
    new: 'i.jsx("span",{className:"text-xs text-slate-500",children:"Includes subfolders · all PDFs processed in one upload"})',
  },
  {
    name: 'batch drag-drop uploads',
    old: 'nt=b.useCallback(async O=>{if(O.length){if(O.length>fn){se.error(`Maximum ${fn} PDF files per upload batch`);return}_(!0);try{const ie=await Ye(O);Jg(ie);const Ae=await ae(!0);Ae.length&&await Te(Ae[0].month)}catch{se.error("Upload finished but could not refresh invoice grid")}finally{A(null),_(!1)}}},[Te,ae,Ye])',
    new: 'nt=b.useCallback(async O=>{if(O.length){const ie=pT(O);if(!ie.length){se.error("No PDF files found");return}_(!0),y([]),S([]);try{const Ae=mT(ie,fn),Se=[];for(let Ct=0;Ct<Ae.length;Ct+=1){const $t=Ae[Ct];Se.push(...await Ye($t,{batchCurrent:Ct+1,batchTotal:Ae.length,overallOffset:Ct*fn,overallTotal:ie.length,appendResults:Ct>0}))}Jg(Se);const ct=await ae(!0);ct.length&&await Te(ct[0].month)}catch{se.error("Upload finished but could not refresh invoice grid")}finally{A(null),_(!1)}}},[Te,ae,Ye])',
  },
  {
    name: 'dropzone no maxFiles cap',
    old: 'accept:{"application/pdf":[".pdf"]},multiple:!0,maxFiles:fn,disabled:g})',
    new: 'accept:{"application/pdf":[".pdf"]},multiple:!0,disabled:g})',
  },
  {
    name: 'nav brand without BI_NEGT',
    old: 'i.jsxs("div",{className:"eb-nav-brand",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("h2",{className:"eb-nav-title",children:"eBilling"}),i.jsx("p",{className:"eb-nav-sub",children:"e& SIM Billing"}),i.jsx("span",{className:"eb-nav-co",children:r}),i.jsx("button",{type:"button",className:"eb-shell-hide-btn","aria-label":"Hide navigation",onClick:()=>A(!1),children:"⟨"})]}',
    new: 'i.jsxs("div",{className:"eb-nav-brand",children:[i.jsxs("div",{className:"eb-nav-brand-row",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsxs("div",{className:"eb-nav-brand-text",children:[i.jsx("h2",{className:"eb-nav-title",children:"eBilling"}),i.jsx("p",{className:"eb-nav-sub",children:"Etisalat SIM Billing"})]})]}),i.jsx("button",{type:"button",className:"eb-shell-hide-btn","aria-label":"Hide navigation",onClick:()=>A(!1),children:"⟨"})]}',
  },
  {
    name: 'nav footer credit',
    old: 'i.jsx("div",{className:"eb-nav-footer",children:"Sakour@neweast.co"})',
    new: 'i.jsx("div",{className:"eb-nav-footer",children:i.jsxs("p",{className:"eb-nav-footer-text",children:["Made with IT & Business Dept",i.jsx("br",{}),"by NEWEAST © 2026"]})})',
  },
  {
    name: 'approval panel header copy',
    old: 'i.jsx("h3",{children:"E-bill Approval"}),i.jsx("p",{children:"Pending requests"})',
    new: 'i.jsx("h3",{children:"E-bill Approval"}),i.jsx("p",{children:"Pending & recovery queue"})',
  },
  {
    name: 'dashboard approval stats',
    old: 'N?.emailsPending??0})]})]})]})]}),i.jsxs("div",{className:"grid gap-4 lg:grid-cols-2",children:[i.jsxs("div",{className:"app-story-section rounded-2xl shadow-sm",children:[i.jsx("div",{className:"border-b border-slate-100 px-5 py-4",children:i.jsxs("h3",{className:"font-semibold text-slate-900",children:["Top excess — ",N?.label??"—"]})',
    new: 'N?.emailsPending??0})]})]})]})]}),i.jsxs("div",{className:"grid gap-3 sm:grid-cols-2 xl:grid-cols-4",children:[i.jsx(Id,{title:"Pending approval",value:u?.approvalStats?.pendingApproval??0,subtitle:"Awaiting employee"}),i.jsx(Id,{title:"Waiting confirmation",value:u?.approvalStats?.waitingConfirmation??0,subtitle:"Resent emails"}),i.jsx(Id,{title:"Ready for recovery",value:u?.approvalStats?.readyForRecovery??0,subtitle:"Approved for Oracle"}),i.jsx(Id,{title:"Approval emails sent",value:u?.approvalStats?.approvalEmailsSent??0,subtitle:"Total send count"})]}),i.jsxs("div",{className:"grid gap-4 lg:grid-cols-2",children:[i.jsxs("div",{className:"app-story-section rounded-2xl shadow-sm",children:[i.jsx("div",{className:"border-b border-slate-100 px-5 py-4",children:i.jsxs("h3",{className:"font-semibold text-slate-900",children:["Top excess — ",N?.label??"—"]})',
  },
  {
    name: 'grid pending approval label',
    old: 'O.approval_status==="pending_approval"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Pending approval"})',
    new: 'O.approval_status==="waiting_confirmation"?i.jsx("span",{className:"text-xs font-medium text-orange-700",children:"Waiting confirmation ("+(O.approval_email_count||1)+")"}):O.approval_status==="pending_approval"?i.jsx("span",{className:"text-xs font-medium text-amber-700",children:"Pending approval"})',
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

const cssExtra = `

.eb-nav-brand-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-align: left;
}

.eb-nav-brand-text {
  min-width: 0;
}

.eb-nav-brand-text .eb-nav-title {
  margin: 0;
  text-align: left;
}

.eb-nav-brand-text .eb-nav-sub {
  margin: 0.15rem 0 0;
  text-align: left;
}

.eb-nav-footer-text {
  margin: 0;
  line-height: 1.45;
  font-size: 0.68rem;
  color: var(--eb-muted);
}

.eb-approval-section + .eb-approval-section {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--eb-border);
}

.eb-approval-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}

.eb-approval-section-head h4 {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--eb-muted);
}

.eb-approval-section-count {
  display: inline-flex;
  min-width: 1.35rem;
  height: 1.35rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 700;
}

.eb-shell-left,
.eb-shell-right {
  transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease;
}

.eb-shell-edge-toggle {
  border-radius: 0 1rem 1rem 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
}

.eb-shell-edge-right {
  border-radius: 1rem 0 0 1rem;
}

.eb-shell-hide-btn {
  border-radius: 999px;
  border: 1px solid var(--eb-border);
  background: #fff;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.eb-shell-tool-btn {
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

@media (max-width: 1100px) {
  .eb-shell-left,
  .eb-shell-right {
    border-radius: 0 1.25rem 1.25rem 0;
  }
}
`;

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.eb-nav-brand-row')) {
  css += cssExtra;
  fs.writeFileSync(cssPath, css);
  console.log('Applied: ebilling-shell.css polish');
}

if (indexPath.includes('v=20260612e')) {
  fs.writeFileSync(
    indexPath,
    fs.readFileSync(indexPath, 'utf8')
      .replace('index-DGxZ6d5S.js?v=20260612e', 'index-DGxZ6d5S.js?v=20260612f')
      .replace('ebilling-shell.css?v=9', 'ebilling-shell.css?v=10'),
  );
  console.log('Bumped asset cache versions');
}

console.log('Final eBilling polish applied');
