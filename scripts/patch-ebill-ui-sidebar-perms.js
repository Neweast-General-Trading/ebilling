#!/usr/bin/env node
/** Sidebar: max 2 cards per section + scroll. Permissions table polish + pagination. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'approval section scroll wrappers',
    old: 'r.length?r.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty",children:"No invoices waiting for employee approval."})]}),i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Ready for Recovery"}),i.jsx("span",{className:"eb-approval-section-count",children:u.length})]}),u.length?u.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"recovery",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:()=>{},onRecovery:S=>_({type:"recovery",row:S})},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty",children:"No invoices ready for Oracle recovery."})]',
    new: 'r.length?i.jsx("div",{className:"eb-approval-section-body",children:r.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}},String(C.invoice_id)))}):i.jsx("p",{className:"eb-approval-empty",children:"No invoices waiting for employee approval."})]}),i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Ready for Recovery"}),i.jsx("span",{className:"eb-approval-section-count",children:u.length})]}),u.length?i.jsx("div",{className:"eb-approval-section-body",children:u.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"recovery",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:()=>{},onRecovery:S=>_({type:"recovery",row:S})},String(C.invoice_id)))}):i.jsx("p",{className:"eb-approval-empty",children:"No invoices ready for Oracle recovery."})]',
  },
  {
    name: 'permissions pagination state',
    old: '[N,A]=b.useState(""),C=b.useCallback(async()=>{p(!0);try{const{data:D}=await De.get(ze.PERMISSIONS_USERS);',
    new: '[N,A]=b.useState(""),[Bn,Kn]=b.useState(1),Qn=8,C=b.useCallback(async()=>{p(!0);try{const{data:D}=await De.get(ze.PERMISSIONS_USERS);',
  },
  {
    name: 'permissions pagination computed',
    old: 'finally{y(null)}};return a?i.jsxs("div",{className:"space-y-6",children:[i.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[i.jsxs("div",{children:[i.jsxs("div",{className:"mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700",children:[i.jsx(Cb,{className:"size-3.5"}),"Admin only · link access"]}),i.jsx("h2",{className:"text-2xl font-bold tracking-tight text-slate-900",children:"User permissions"})',
    new: 'finally{y(null)}},Wn=b.useMemo(()=>Math.max(1,Math.ceil(l.length/Qn)),[l.length]),Vn=b.useMemo(()=>{const D=(Bn-1)*Qn;return l.slice(D,D+Qn)},[l,Bn]);b.useEffect(()=>{Bn>Wn&&Kn(Wn||1)},[Wn,Bn]);return a?i.jsxs("div",{className:"space-y-6",children:[i.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[i.jsxs("div",{children:[i.jsxs("div",{className:"mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700",children:[i.jsx(Cb,{className:"size-3.5"}),"Admin only · link access"]}),i.jsx("h2",{className:"text-2xl font-bold tracking-tight text-slate-900",children:"User permissions"})',
  },
  {
    name: 'permissions table redesign',
    old: 'i.jsxs(Je,{className:"overflow-hidden border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"border-b border-slate-100 pb-3",children:i.jsx(jt,{className:"text-base",children:"Permissions by tab"})}),i.jsx(We,{className:"p-0",children:f?i.jsxs("div",{className:"flex items-center justify-center gap-2 p-10 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading users…"]}):i.jsx("div",{className:"overflow-x-auto",children:i.jsxs("table",{className:"min-w-full text-sm",children:[i.jsx("thead",{className:"bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500",children:i.jsxs("tr",{children:[i.jsx("th",{className:"px-4 py-3 font-semibold",children:"User"}),k.map(D=>i.jsx("th",{className:"px-3 py-3 text-center font-semibold",children:pg[D]},D))]})}),i.jsx("tbody",{children:l.map(D=>i.jsxs("tr",{className:"border-t border-slate-100 hover:bg-slate-50/70",children:[i.jsxs("td",{className:"px-4 py-3",children:[i.jsx("div",{className:"font-medium text-slate-900",children:D.displayName}),i.jsx("div",{className:"text-xs text-slate-500",children:D.email}),D.isAdmin?i.jsx("div",{className:"mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700",children:"Super admin"}):null]}),k.map(L=>{const P=D.permissions.includes(L),pe=D.isAdmin||x===D.email;return i.jsx("td",{className:"px-3 py-3 text-center",children:i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60","aria-label":`${D.displayName} ${pg[L]}`})},L)})]},D.email))})]})})})]})',
    new: 'i.jsxs(Je,{className:"eb-perm-card overflow-hidden border-slate-200 shadow-sm",children:[i.jsxs(yt,{className:"flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3",children:[i.jsxs("div",{children:[i.jsx(jt,{className:"text-base",children:"Permissions by tab"}),i.jsxs("p",{className:"mt-1 text-xs text-slate-500",children:[l.length," user",l.length===1?"":"s",Wn>1?` · page ${Bn} of ${Wn}`:""]})]}),Wn>1?i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsxs("span",{className:"min-w-[4rem] text-center text-xs font-semibold text-slate-600",children:[Bn," / ",Wn]}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]}):null]}),i.jsx(We,{className:"p-0",children:f?i.jsxs("div",{className:"flex items-center justify-center gap-2 p-10 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading users…"]}):l.length?i.jsx("div",{className:"overflow-x-auto",children:i.jsxs("table",{className:"eb-perm-table",children:[i.jsx("thead",{children:i.jsxs("tr",{children:[i.jsx("th",{children:"User"}),k.map(D=>i.jsx("th",{className:"eb-perm-col",children:i.jsx("span",{className:"eb-perm-tab",children:pg[D]})},D))]})}),i.jsx("tbody",{children:Vn.map(D=>i.jsxs("tr",{className:bt("eb-perm-row",D.isAdmin&&"eb-perm-row-admin"),children:[i.jsx("td",{className:"eb-perm-user",children:i.jsxs("div",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"eb-perm-avatar",children:(D.displayName||D.email||"?").slice(0,1).toUpperCase()}),i.jsxs("div",{className:"min-w-0",children:[i.jsx("div",{className:"font-semibold text-slate-900 truncate",children:D.displayName}),i.jsx("div",{className:"text-xs text-slate-500 truncate",children:D.email}),D.isAdmin?i.jsx("span",{className:"eb-perm-badge",children:"Super admin"}):null]})]})}),k.map(L=>{const P=D.permissions.includes(L),pe=D.isAdmin||x===D.email;return i.jsx("td",{className:"eb-perm-cell",children:i.jsxs("label",{className:bt("eb-perm-toggle",P&&"eb-perm-toggle-on",pe&&"eb-perm-toggle-disabled"),children:[i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"sr-only","aria-label":`${D.displayName} ${pg[L]}`}),i.jsx("span",{className:"eb-perm-toggle-dot"})]})},L)})]},D.email))})]})}):i.jsx("div",{className:"eb-perm-empty",children:"No users yet. Add someone above."})}),Wn>1?i.jsxs("div",{className:"eb-perm-footer",children:[i.jsxs("span",{children:["Showing ",(Bn-1)*Qn+1,"–",Math.min(Bn*Qn,l.length)," of ",l.length]}),i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]})]}):null]})',
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

.eb-approval-list {
  overflow: hidden;
  min-height: 0;
}

.eb-approval-section-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 29rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
  scroll-behavior: smooth;
}

.eb-approval-section-body::-webkit-scrollbar {
  width: 5px;
}

.eb-approval-section-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.eb-approval-section-body .eb-approval-card-rich {
  flex-shrink: 0;
}

/* Permissions table */
.eb-perm-card {
  border-radius: 1rem;
}

.eb-perm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8125rem;
}

.eb-perm-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.85rem 0.75rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.eb-perm-table thead th:first-child {
  padding-left: 1.25rem;
  text-align: left;
}

.eb-perm-col {
  text-align: center;
  min-width: 5.5rem;
}

.eb-perm-tab {
  display: inline-block;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 0.62rem;
  line-height: 1.2;
}

.eb-perm-row {
  transition: background 0.15s ease;
}

.eb-perm-row:hover {
  background: #f8fafc;
}

.eb-perm-row td {
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.eb-perm-row-admin {
  background: linear-gradient(90deg, rgba(236, 253, 245, 0.55) 0%, rgba(255, 255, 255, 0) 28%);
}

.eb-perm-user {
  padding: 0.85rem 1.25rem;
  min-width: 14rem;
}

.eb-perm-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.eb-perm-badge {
  display: inline-flex;
  margin-top: 0.25rem;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.eb-perm-cell {
  text-align: center;
  padding: 0.75rem 0.5rem;
}

.eb-perm-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.eb-perm-toggle:hover:not(.eb-perm-toggle-disabled) {
  border-color: #86efac;
  background: #f0fdf4;
}

.eb-perm-toggle-on {
  border-color: #22c55e;
  background: #ecfdf5;
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.25);
}

.eb-perm-toggle-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.eb-perm-toggle-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.15s ease, transform 0.15s ease;
}

.eb-perm-toggle-on .eb-perm-toggle-dot {
  background: #16a34a;
  transform: scale(1.15);
}

.eb-perm-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.eb-perm-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
  font-size: 0.75rem;
  color: #64748b;
}
`;

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.eb-approval-section-body')) {
  css += cssExtra;
  fs.writeFileSync(cssPath, css);
  console.log('Added CSS for sidebar sections + permissions');
} else {
  console.log('CSS already present');
}

const index = fs.readFileSync(indexPath, 'utf8');
if (index.includes('v=20260612g')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260612g', 'index-DGxZ6d5S.js?v=20260612h')
      .replace('ebilling-shell.css?v=11', 'ebilling-shell.css?v=12'),
  );
  console.log('Bumped cache versions');
}

console.log('UI sidebar + permissions patch applied');
