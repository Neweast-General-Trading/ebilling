#!/usr/bin/env node
/** E-bill Approval panel: admin queue, resend/recovery, confirm modal, collapsible sidebars. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const oldPanel =
  'function EbillApprovalPanel(){const a=ka(),[l,r]=b.useState([]),[o,u]=b.useState(!0);b.useEffect(()=>{u(!0),De.get(ze.INVOICES_APPROVALS_PENDING,{params:{co:a}}).then(({data:f})=>r(Array.isArray(f)?f:[])).catch(()=>r([])).finally(()=>u(!1))},[a]);return i.jsx("div",{className:"eb-approval-list",children:o?i.jsx("p",{className:"eb-approval-empty",children:"Loading approvals…"}):l.length?l.map(f=>i.jsxs("div",{className:"eb-approval-card",children:[i.jsx("p",{className:"eb-approval-name",children:f.display_name||"Employee"}),i.jsx("p",{className:"eb-approval-phone",children:f.phone_number||"—"}),i.jsxs("p",{className:"eb-approval-excess",children:["Excess: AED ",Li(f.overage_amount)]})]},String(f.invoice_id||f.sim_employee_id))):i.jsx("p",{className:"eb-approval-empty",children:"No pending approvals"})})}';

const newPanel = `function EbConfirmModal({title:a,message:l,confirmLabel:r,confirmTone:o,loading:u,onClose:f,onConfirm:p}){return jf.createPortal(i.jsx("div",{className:"eb-confirm-overlay",onClick:m=>m.target===m.currentTarget&&f(),children:i.jsxs("div",{className:"eb-confirm-dialog",children:[i.jsx("h4",{className:"eb-confirm-title",children:a}),i.jsx("p",{className:"eb-confirm-message",children:l}),i.jsxs("div",{className:"eb-confirm-actions",children:[i.jsx(Me,{variant:"outline",onClick:f,disabled:u,children:"Cancel"}),i.jsx(Me,{className:bt(o==="recovery"?"eb-btn-recovery":"eb-btn-primary"),onClick:p,disabled:u,children:u?i.jsxs(i.Fragment,{children:[i.jsx(Kt,{className:"size-4 animate-spin"})," Please wait…"]}):r})]})]})}),document.body)}function EbApprovalQueueItem({row:a,acting:l,onOpen:r,onResend:o,onRecovery:u}){const f=a.approval_status==="pending_approval",p=a.approval_status==="ready_for_recovery",m=!!a.person_number?.trim()&&(a.personal_usage??0)>0,v=l===a.invoice_id;return i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich",children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:a.invoice_code||a.phone_number||"Invoice"}),i.jsx("p",{className:"eb-approval-name",children:a.display_name||"Employee"}),i.jsx("p",{className:"eb-approval-phone",children:a.month_label||a.month})]}),i.jsxs("span",{className:bt("eb-approval-badge",f?"eb-approval-badge-pending":"eb-approval-badge-ready"),children:["AED ",Li(f?a.exceeded_amount??a.excess??0:a.personal_usage??0)]})]}),i.jsxs("div",{className:"eb-approval-meta",children:[i.jsxs("div",{children:[i.jsx("span",{children:"Status"}),i.jsx("strong",{children:f?"Awaiting employee":"Ready for recovery"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Sent"}),i.jsx("strong",{children:Kg(a.approval_sent_at)||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Email"}),i.jsx("strong",{className:"truncate",title:a.email||"",children:a.email||"—"})]}),i.jsxs("div",{children:[i.jsx("span",{children:"Phone"}),i.jsx("strong",{children:a.phone_number||"—"})]})]}),i.jsxs("div",{className:"eb-approval-actions",children:[i.jsxs(Me,{variant:"outline",size:"sm",className:"eb-approval-btn",disabled:v,onClick:()=>r(a),children:[i.jsx(Dd,{className:"size-3.5"})," Open"]}),f?i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-primary",disabled:v,onClick:()=>o(a),children:[v?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Resend"]}):p?i.jsxs(Me,{size:"sm",className:"eb-approval-btn eb-btn-recovery",disabled:v||!m,onClick:()=>u(a),children:[v?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"})," Recovery"]}):null]})]},String(a.invoice_id))}function EbillApprovalPanel(){const a=ka(),{canManage:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState(!0),[p,m]=b.useState(null),[v,y]=b.useState(null),g=b.useCallback(()=>{if(!l){o([]),f(!1);return}f(!0),De.get(ze.INVOICES_APPROVALS_QUEUE,{params:{co:a}}).then(({data:N})=>o(N?.items||[])).catch(()=>o([])).finally(()=>f(!1))},[a,l]);b.useEffect(()=>{g()},[g]),b.useEffect(()=>{const N=()=>g();return window.addEventListener("ebilling:approval-queue-refresh",N),()=>window.removeEventListener("ebilling:approval-queue-refresh",N)},[g]);const _=N=>N.approval_token?window.location.origin+"/ebilling/folder/"+N.approval_token:window.location.origin+"/ebilling/invoices";return l?i.jsxs(i.Fragment,{children:[i.jsxs("div",{className:"eb-approval-list",children:[u?i.jsx("p",{className:"eb-approval-empty",children:"Loading approvals…"}):r.length?r.map(N=>i.jsx(EbApprovalQueueItem,{row:N,acting:p,onOpen:A=>window.open(_(A),"_blank","noopener,noreferrer"),onResend:A=>y({type:"resend",row:A}),onRecovery:A=>y({type:"recovery",row:A})},String(N.invoice_id))):i.jsx("p",{className:"eb-approval-empty",children:"No pending e-bill approvals"})]}),v?i.jsx(EbConfirmModal,{title:v.type==="resend"?"Resend approval email":"Send recovery to Oracle",message:v.type==="resend"?"Send another approval request to "+(v.row.display_name||"this employee")+" for "+(v.row.month_label||v.row.month)+"?":"Push AED "+Li(v.row.personal_usage??0)+" personal usage to Oracle for "+(v.row.display_name||"this employee")+"?",confirmLabel:v.type==="resend"?"Resend email":"Confirm & send",confirmTone:v.type==="recovery"?"recovery":"primary",loading:p===v.row.invoice_id,onClose:()=>y(null),onConfirm:async()=>{m(v.row.invoice_id);try{v.type==="resend"?(await De.post(ze.INVOICES_SEND_FOR_APPROVAL(v.row.invoice_id)+"?co="+a,{},{timeout:6e4}),se.success("Approval email resent")):(await De.post(ze.INVOICES_PUSH_RECOVERY(v.row.invoice_id)+"?co="+a,{},{timeout:12e4}),se.success("Recovery sent to Oracle")),y(null),g(),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}catch(N){se.error(N?.response?.data?.message||N?.message||"Action failed")}finally{m(null)}}}):null]}):i.jsx("p",{className:"eb-approval-empty",children:"Admin access required to manage e-bill approvals."})}`;

const oldShellStart = 'function pw({children:a}){const l=Ka(),r=ka(),o=xb(),{hasPermission:u,loading:f,canManage:h}=bb(),p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):u(m.id)),[u,f]),x=b.useMemo(()=>!f&&h?swAdmin:[],[f,h]);if(o)return i.jsx("div",{className:"min-h-0 bg-white",children:a});return i.jsxs("div",{className:"eb-shell-main",children:[i.jsx("aside",{className:"eb-shell-left",children:i.jsxs("div",{className:"eb-nav-inner",children:[i.jsxs("div",{className:"eb-nav-brand",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("h2",{className:"eb-nav-title",children:"eBilling"}),i.jsx("p",{className:"eb-nav-sub",children:"e& SIM Billing"}),i.jsx("span",{className:"eb-nav-co",children:r})]}),i.jsxs("nav",{className:"eb-nav-links",children:[p.map(m=>{const v=l.pathname.startsWith(m.path);return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)}),x.length?i.jsxs(i.Fragment,{children:[i.jsx("p",{className:"eb-nav-section",children:"Administration"}),x.map(m=>{const v=l.pathname.startsWith(m.path);return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)})]}):null]}),i.jsx("div",{className:"eb-nav-footer",children:"Sakour@neweast.co"})]})}),i.jsx("main",{className:"eb-shell-content",children:a}),i.jsx("aside",{className:"eb-shell-right",children:i.jsxs("div",{className:"eb-approval-inner",children:[i.jsxs("div",{className:"eb-approval-head",children:[i.jsx("div",{className:"eb-approval-icon",children:"✓"}),i.jsxs("div",{children:[i.jsx("h3",{children:"E-bill Approval"}),i.jsx("p",{children:"Pending requests"})]})]}),i.jsx(EbillApprovalPanel,{})]})})]})}';

const newShell = `function pw({children:a}){const l=Ka(),r=ka(),o=xb(),{hasPermission:u,loading:f,canManage:h}=bb(),[y,g]=b.useState(()=>localStorage.getItem("eb-shell-left")!=="0"),[_,N]=b.useState(()=>localStorage.getItem("eb-shell-right")!=="0"),A=b.useCallback(S=>{g(S),localStorage.setItem("eb-shell-left",S?"1":"0")},[]),C=b.useCallback(S=>{N(S),localStorage.setItem("eb-shell-right",S?"1":"0")},[]),p=b.useMemo(()=>swMain.filter(m=>f?!["analysis","recovery_log"].includes(m.id):u(m.id)),[u,f]),x=b.useMemo(()=>!f&&h?swAdmin:[],[f,h]);if(o)return i.jsx("div",{className:"min-h-0 bg-white",children:a});return i.jsxs("div",{className:bt("eb-shell-main",!y&&"eb-shell-left-hidden",!_&&"eb-shell-right-hidden"),children:[y?i.jsx("aside",{className:"eb-shell-left",children:i.jsxs("div",{className:"eb-nav-inner",children:[i.jsxs("div",{className:"eb-nav-brand",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("h2",{className:"eb-nav-title",children:"eBilling"}),i.jsx("p",{className:"eb-nav-sub",children:"e& SIM Billing"}),i.jsx("span",{className:"eb-nav-co",children:r}),i.jsx("button",{type:"button",className:"eb-shell-hide-btn","aria-label":"Hide navigation",onClick:()=>A(!1),children:"⟨"})]}),i.jsxs("nav",{className:"eb-nav-links",children:[p.map(m=>{const v=l.pathname.startsWith(m.path);return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)}),x.length?i.jsxs(i.Fragment,{children:[i.jsx("p",{className:"eb-nav-section",children:"Administration"}),x.map(m=>{const v=l.pathname.startsWith(m.path);return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)})]}):null]}),i.jsx("div",{className:"eb-nav-footer",children:"Sakour@neweast.co"})]})}):null,!y?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-left","aria-label":"Show navigation",onClick:()=>A(!0),children:"Menu"}):null,i.jsxs("main",{className:"eb-shell-content",children:[i.jsxs("div",{className:"eb-shell-toolbar",children:[i.jsx("button",{type:"button",className:"eb-shell-tool-btn",onClick:()=>A(!y),children:y?"Hide menu":"Show menu"}),i.jsx("button",{type:"button",className:"eb-shell-tool-btn",onClick:()=>C(!_),children:_?"Hide approvals":"Show approvals"})]}),a]}),_?i.jsx("aside",{className:"eb-shell-right",children:i.jsxs("div",{className:"eb-approval-inner",children:[i.jsxs("div",{className:"eb-approval-head",children:[i.jsx("div",{className:"eb-approval-icon",children:"✓"}),i.jsxs("div",{className:"min-w-0 flex-1",children:[i.jsx("h3",{children:"E-bill Approval"}),i.jsx("p",{children:"Pending requests"})]}),i.jsx("button",{type:"button",className:"eb-shell-hide-btn","aria-label":"Hide approvals panel",onClick:()=>C(!1),children:"⟩"})]}),i.jsx(EbillApprovalPanel,{})]})}):null,!_?i.jsx("button",{type:"button",className:"eb-shell-edge-toggle eb-shell-edge-right","aria-label":"Show approvals panel",onClick:()=>C(!0),children:"Approvals"}):null]})}`;

const patches = [
  {
    name: 'API route approvals queue',
    old: 'INVOICES_APPROVALS_PENDING:"/invoices/approvals/pending",INVOICES_SEND_APPROVAL_BULK',
    new: 'INVOICES_APPROVALS_PENDING:"/invoices/approvals/pending",INVOICES_APPROVALS_QUEUE:"/invoices/approvals/queue",INVOICES_SEND_APPROVAL_BULK',
  },
  { name: 'EbillApprovalPanel upgrade', old: oldPanel, new: newPanel },
  { name: 'collapsible shell layout', old: oldShellStart, new: newShell },
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

/* ── Collapsible shell ── */
.eb-shell-left-hidden .eb-shell-left,
.eb-shell-right-hidden .eb-shell-right {
  display: none;
}

.eb-shell-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: -0.25rem 0 1rem;
}

.eb-shell-tool-btn,
.eb-shell-hide-btn,
.eb-shell-edge-toggle {
  border: 1px solid var(--eb-border);
  background: var(--eb-surface);
  color: var(--eb-text);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.eb-shell-tool-btn {
  padding: 0.45rem 0.85rem;
}

.eb-shell-hide-btn {
  margin-top: 0.65rem;
  padding: 0.25rem 0.65rem;
}

.eb-shell-edge-toggle {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  padding: 0.65rem 0.55rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  border-radius: 0 0.85rem 0.85rem 0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.eb-shell-edge-left {
  left: 0;
}

.eb-shell-edge-right {
  right: 0;
  border-radius: 0.85rem 0 0 0.85rem;
}

.eb-shell-tool-btn:hover,
.eb-shell-hide-btn:hover,
.eb-shell-edge-toggle:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

@media (min-width: 1280px) {
  .eb-shell-toolbar {
    display: none;
  }
}

/* ── Rich approval cards ── */
.eb-approval-card-rich {
  border-radius: 1rem;
  padding: 0.9rem;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.eb-approval-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.eb-approval-ref {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
}

.eb-approval-badge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.eb-approval-badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.eb-approval-badge-ready {
  background: #dcfce7;
  color: #166534;
}

.eb-approval-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--eb-border-soft);
  font-size: 0.72rem;
}

.eb-approval-meta span {
  display: block;
  color: var(--eb-muted);
}

.eb-approval-meta strong {
  display: block;
  margin-top: 0.1rem;
  color: var(--eb-text);
  font-weight: 600;
}

.eb-approval-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  margin-top: 0.85rem;
}

.eb-approval-btn {
  width: 100%;
  border-radius: 0.85rem !important;
}

.eb-btn-primary {
  background: #0f172a !important;
  color: #fff !important;
}

.eb-btn-primary:hover {
  background: #1e293b !important;
}

.eb-btn-recovery {
  background: #047857 !important;
  color: #fff !important;
}

.eb-btn-recovery:hover {
  background: #065f46 !important;
}

.eb-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.eb-confirm-dialog {
  width: min(100%, 26rem);
  border-radius: 1.1rem;
  border: 1px solid var(--eb-border);
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.eb-confirm-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.eb-confirm-message {
  margin: 0.75rem 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #475569;
}

.eb-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

.eb-nav-link,
.eb-approval-card,
.eb-nav-brand,
.eb-approval-head,
.eb-shell-left,
.eb-shell-right {
  border-radius: 1rem;
}

.eb-nav-link {
  border-radius: 0.85rem;
}

@media (max-width: 1100px) {
  .eb-shell-left,
  .eb-shell-right {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 40;
    width: min(88vw, var(--eb-nav-w));
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  }

  .eb-shell-right {
    width: min(92vw, var(--eb-approval-w));
    right: 0;
  }

  .eb-shell-left-hidden .eb-shell-left,
  .eb-shell-right-hidden .eb-shell-right {
    display: none;
  }

  .eb-shell-content {
    padding: 1rem;
  }

  .eb-approval-meta {
    grid-template-columns: 1fr;
  }
}
`;

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('eb-shell-left-hidden')) {
  css += cssExtra;
  fs.writeFileSync(cssPath, css);
  console.log('Applied: ebilling-shell.css extras');
}

if (indexPath.includes('ebilling-shell.css?v=8')) {
  fs.writeFileSync(
    indexPath,
    fs.readFileSync(indexPath, 'utf8').replace('ebilling-shell.css?v=8', 'ebilling-shell.css?v=9'),
  );
  console.log('Bumped shell CSS cache version');
}

console.log('E-bill approval panel patches applied');
