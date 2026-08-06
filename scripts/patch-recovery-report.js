#!/usr/bin/env node
/**
 * Recovery report tweaks:
 *  - "Oracle" column -> "Oracle entry" showing the Oracle entry id number.
 *  - Remove the JSON column (toggle button + expandable Oracle payload row).
 */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');
const before = s;

// 1) Header: rename "Oracle" and drop the trailing empty JSON header cell.
const headerOld = 'i.jsx("th",{className:"px-3 py-3",children:"Oracle"}),i.jsx("th",{className:"px-3 py-3"})';
const headerNew = 'i.jsx("th",{className:"px-3 py-3",children:"Oracle entry"})';
if (!s.includes(headerOld)) throw new Error('recovery-report: header anchor not found');
s = s.replace(headerOld, headerNew);

// 2) Oracle body cell -> entry id number.
const cellOld = 'i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsxs("div",{className:"space-y-1 text-xs",children:[i.jsx("p",{children:i.jsx("span",{className:"rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800",children:L.oracle_action||"—"})}),i.jsx("p",{className:"text-slate-600",children:L.oracle_element_name||"—"}),i.jsxs("p",{className:"text-slate-500",children:["via ",L.oracle_source||"—"]})]})})';
const cellNew = 'i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsx("span",{className:"font-mono text-xs font-semibold text-slate-800",children:L.oracle_entry_id||"—"})})';
if (!s.includes(cellOld)) throw new Error('recovery-report: oracle cell anchor not found');
s = s.replace(cellOld, cellNew);

// 3) Remove JSON toggle cell + expandable JSON detail row.
const jsonOld = ',i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsxs("button",{type:"button",className:"inline-flex items-center gap-1 text-xs font-medium text-primary",onClick:()=>q(P?null:L.invoice_id),children:[P?i.jsx(JE,{className:"size-3.5"}):i.jsx(kf,{className:"size-3.5"}),"JSON"]})})]}),P?i.jsx("tr",{className:"border-t bg-slate-50",children:i.jsxs("td",{colSpan:9,className:"px-4 py-4",children:[i.jsxs("div",{className:"mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500",children:[i.jsx(O_,{className:"size-3.5"}),"Oracle payload reference"]}),i.jsx("pre",{className:"overflow-x-auto rounded-lg border bg-white p-3 text-xs leading-relaxed text-slate-700",children:JSON.stringify(L.oracle_ref,null,2)})]})},`${L.invoice_id}-detail`):null]';
const jsonNew = ']}),null]';
if (!s.includes(jsonOld)) throw new Error('recovery-report: json column anchor not found');
s = s.replace(jsonOld, jsonNew);

if (s === before) throw new Error('recovery-report: no changes applied');
fs.writeFileSync(bundle, s);
console.log('patch-recovery-report: applied (Oracle entry column + removed JSON column)');
