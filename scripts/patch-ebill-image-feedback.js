#!/usr/bin/env node
/** Image feedback: logo tagline below, approval 50/50 panels, green perm squares. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'logo tagline below logo',
    old: 'i.jsxs("div",{className:"eb-nav-brand-row",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("p",{className:"eb-nav-tagline",children:"eBilling - e& Sim"})]}',
    new: 'i.jsxs("div",{className:"eb-nav-brand-col",children:[i.jsx("img",{src:"/ebilling/assets/login/logo.png",alt:"Neweast",className:"eb-nav-logo"}),i.jsx("p",{className:"eb-nav-tagline",children:"eBilling - e& Sim"})]}',
  },
  {
    name: 'permissions green square access',
    old: 'return i.jsx("td",{className:"px-3 py-3 text-center",children:i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60","aria-label":`${D.displayName} ${pg[L]}`})},L)})',
    new: 'return i.jsx("td",{className:"px-3 py-3 text-center",children:i.jsxs("label",{className:bt("eb-perm-access",P&&"eb-perm-access-on",pe&&"eb-perm-access-disabled"),children:[i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"sr-only","aria-label":`${D.displayName} ${pg[L]}`}),i.jsx("span",{className:"eb-perm-access-fill","aria-hidden":"true"})]})},L)})',
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

const cssBlock = `
/* ── Approval panel inner layout (50/50 sections) ── */
.eb-approval-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.eb-approval-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0.65rem;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.65rem;
}

.eb-approval-section {
  flex: none;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dbeafe;
  border-radius: 0.85rem;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  padding: 0.55rem 0.6rem 0.6rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.eb-approval-section + .eb-approval-section {
  margin-top: 0;
  padding-top: 0.55rem;
  border-top: none;
}

.eb-approval-section-head {
  flex-shrink: 0;
  margin-bottom: 0.45rem;
}

.eb-approval-section-body {
  flex: 1;
  min-height: 0;
  max-height: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.15rem;
  scroll-behavior: smooth;
}

.eb-approval-empty-slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 6rem;
  margin: 0;
  padding: 0.75rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.72);
  color: var(--eb-muted);
  font-size: 0.78rem;
  text-align: center;
}

.eb-nav-brand-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
}

.eb-nav-tagline {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 300;
  letter-spacing: 0.03em;
  color: var(--eb-muted);
  line-height: 1.35;
  text-align: center;
}

.eb-perm-access {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 0.4rem;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.eb-perm-access:hover:not(.eb-perm-access-disabled):not(.eb-perm-access-on) {
  border-color: #94a3b8;
  background: #e2e8f0;
}

.eb-perm-access-on {
  border-color: #16a34a;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.16);
}

.eb-perm-access-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.eb-perm-access-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}
`;

if (!css.includes('.eb-approval-inner {')) {
  css += cssBlock;
} else {
  css = css.replace(
    /\.eb-approval-inner \{[\s\S]*?\.eb-perm-access-fill \{[\s\S]*?\}\n\}/,
    cssBlock.trim(),
  );
  if (!css.includes('.eb-approval-inner {')) css += cssBlock;
}

// Remove conflicting older rules if duplicated
css = css.replace(
  /\.eb-approval-section \{\n  flex: 1 1 0;[\s\S]*?flex-direction: column;\n\}\n\n\.eb-approval-section \+ \.eb-approval-section \{[\s\S]*?border-top: 1px dashed var\(--eb-border\);\n\}/,
  '',
);

css = css.replace(
  /\.eb-approval-section-body \{\n  flex: 1;\n  min-height: calc\(2 \* 11\.75rem \+ 0\.5rem\);[\s\S]*?scroll-behavior: smooth;\n\}\n\n\.eb-approval-empty-slot \{[\s\S]*?padding: 1rem;\n\}/,
  '',
);

css = css.replace(
  /\.eb-nav-brand-row \{[\s\S]*?text-align: left;\n\}\n\n\.eb-nav-brand-text \{[\s\S]*?text-align: left;\n\}\n\n\.eb-nav-footer-text/,
  '.eb-nav-footer-text',
);

fs.writeFileSync(cssPath, css);
console.log('Updated CSS');

const index = fs.readFileSync(indexPath, 'utf8');
const bumped = index.replace(/index-DGxZ6d5S\.js\?v=20260612\w/g, 'index-DGxZ6d5S.js?v=20260612k')
  .replace(/ebilling-shell\.css\?v=\d+/g, 'ebilling-shell.css?v=15');
if (bumped !== index) {
  fs.writeFileSync(indexPath, bumped);
  console.log('Bumped cache versions');
}

console.log('Image feedback patch applied');
