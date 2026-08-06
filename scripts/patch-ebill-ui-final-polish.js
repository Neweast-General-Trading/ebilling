#!/usr/bin/env node
/** Nav tagline/footer, approval 50/50 slots, perm green pill toggles. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'nav tagline under logo',
    old: 'i.jsxs("div",{className:"eb-nav-brand-row",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsxs("div",{className:"eb-nav-brand-text",children:[i.jsx("h2",{className:"eb-nav-title",children:"eBilling"}),i.jsx("p",{className:"eb-nav-sub",children:"Etisalat SIM Billing"})]})]}',
    new: 'i.jsxs("div",{className:"eb-nav-brand-row",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("p",{className:"eb-nav-tagline",children:"eBilling - e& Sim"})]}',
  },
  {
    name: 'nav footer dynamic year',
    old: 'i.jsxs("p",{className:"eb-nav-footer-text",children:["Made with IT & Business Dept",i.jsx("br",{}),"by NEWEAST © 2026"]})',
    new: 'i.jsxs("p",{className:"eb-nav-footer-text",children:["Made By IT&Busniess DEPT",i.jsx("br",{}),"NEWEAST © ",(new Date).getFullYear()]})',
  },
  {
    name: 'approval pending always reserved slot',
    old: 'r.length?i.jsx("div",{className:"eb-approval-section-body",children:r.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}},String(C.invoice_id)))}):i.jsx("p",{className:"eb-approval-empty",children:"No invoices waiting for employee approval."})',
    new: 'i.jsx("div",{className:"eb-approval-section-body",children:r.length?r.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"pending",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:S=>_({type:"resend",row:S}),onRecovery:()=>{}},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"No invoices waiting for employee approval."})})',
  },
  {
    name: 'approval recovery always reserved slot',
    old: 'u.length?i.jsx("div",{className:"eb-approval-section-body",children:u.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"recovery",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:()=>{},onRecovery:S=>_({type:"recovery",row:S})},String(C.invoice_id)))}):i.jsx("p",{className:"eb-approval-empty",children:"No invoices ready for Oracle recovery."})',
    new: 'i.jsx("div",{className:"eb-approval-section-body",children:u.length?u.map(C=>i.jsx(EbApprovalQueueItem,{row:C,acting:v,mode:"recovery",onOpen:S=>window.open(A(S),"_blank","noopener,noreferrer"),onResend:()=>{},onRecovery:S=>_({type:"recovery",row:S})},String(C.invoice_id))):i.jsx("p",{className:"eb-approval-empty eb-approval-empty-slot",children:"No invoices ready for Oracle recovery."})})',
  },
  {
    name: 'perm toggle green pill only',
    old: 'i.jsxs("label",{className:bt("eb-perm-toggle",P&&"eb-perm-toggle-on",pe&&"eb-perm-toggle-disabled"),children:[i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"sr-only","aria-label":`${D.displayName} ${pg[L]}`}),i.jsx("span",{className:"eb-perm-toggle-dot"})]})',
    new: 'i.jsxs("label",{className:bt("eb-perm-toggle",P&&"eb-perm-toggle-on",pe&&"eb-perm-toggle-disabled"),children:[i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"sr-only","aria-label":`${D.displayName} ${pg[L]}`}),i.jsx("span",{className:"eb-perm-toggle-pill","aria-hidden":"true"})]})',
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

let css = fs.readFileSync(cssPath, 'utf8');

const cssReplacements = [
  [
    `.eb-approval-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}`,
    `.eb-approval-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}`,
  ],
  [
    `.eb-approval-section + .eb-approval-section {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--eb-border);
}`,
    `.eb-approval-section {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.eb-approval-section + .eb-approval-section {
  margin-top: 0;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--eb-border);
}`,
  ],
  [
    `.eb-approval-list {
  overflow: hidden;
  min-height: 0;
}

.eb-approval-section-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: calc(2 * 11.75rem + 0.5rem);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
  scroll-behavior: smooth;
}`,
    `.eb-approval-section-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
  scroll-behavior: smooth;
}

.eb-approval-empty-slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  margin: 0;
  padding: 1rem;
}`,
  ],
  [
    `.eb-perm-toggle {
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
}`,
    `.eb-perm-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 1.35rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #e2e8f0;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  padding: 0;
}

.eb-perm-toggle:hover:not(.eb-perm-toggle-disabled):not(.eb-perm-toggle-on) {
  border-color: #94a3b8;
  background: #cbd5e1;
}

.eb-perm-toggle-on {
  border-color: #16a34a;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18);
}

.eb-perm-toggle-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.eb-perm-toggle-pill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}`,
  ],
];

for (const [oldBlock, newBlock] of cssReplacements) {
  if (!css.includes(oldBlock)) {
    console.error('Missing CSS block');
    process.exit(1);
  }
  css = css.replace(oldBlock, newBlock);
}

if (!css.includes('.eb-nav-tagline')) {
  css = css.replace(
    '.eb-nav-brand-text .eb-nav-sub {',
    `.eb-nav-tagline {
  margin: 0.65rem 0 0;
  font-size: 0.78rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: var(--eb-muted);
  line-height: 1.35;
}

.eb-nav-brand-text .eb-nav-sub {`,
  );
}

fs.writeFileSync(cssPath, css);
console.log('Updated CSS');

const index = fs.readFileSync(indexPath, 'utf8');
if (index.includes('v=20260612h')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260612h', 'index-DGxZ6d5S.js?v=20260612i')
      .replace('ebilling-shell.css?v=12', 'ebilling-shell.css?v=13'),
  );
  console.log('Bumped cache versions');
}

console.log('Final UI polish applied');
