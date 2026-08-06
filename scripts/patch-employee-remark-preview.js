#!/usr/bin/env node
/** Truncate employee remarks to 2 words + see more pop-up in invoice grid. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const helper = `function EbEmployeeRemark({text:a}){const[l,r]=b.useState(!1),o=String(a||"").trim();if(!o)return null;const u=o.split(/\\s+/).filter(Boolean),f=u.slice(0,2).join(" "),p=u.length>2;return i.jsxs(i.Fragment,{children:[i.jsxs("p",{className:"text-xs leading-snug text-slate-600",children:[f,p?i.jsxs(i.Fragment,{children:[" ",i.jsx("button",{type:"button",className:"text-sky-700 underline underline-offset-2 hover:text-sky-900",onClick:()=>r(!0),children:"see more"})]}):null]}),l?jf.createPortal(i.jsx("div",{className:"fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4",onClick:()=>r(!1),children:i.jsxs("div",{className:"max-w-sm rounded-xl border bg-white p-4 shadow-xl",onClick:m=>m.stopPropagation(),children:[i.jsxs("div",{className:"mb-2 flex items-start justify-between gap-2",children:[i.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:"Employee remark"}),i.jsx("button",{type:"button","aria-label":"Close",className:"text-lg leading-none text-slate-400 hover:text-slate-600",onClick:()=>r(!1),children:"×"})]}),i.jsx("p",{className:"max-h-48 overflow-y-auto text-sm leading-relaxed text-slate-700 whitespace-pre-wrap",children:o})]})}),document.body):null]})}`;

const cellOld =
  'O.employee_remarks?i.jsx("p",{className:"text-xs leading-snug text-slate-600 whitespace-pre-wrap",title:"Employee remark",children:O.employee_remarks}):null';
const cellNew = 'O.employee_remarks?i.jsx(EbEmployeeRemark,{text:O.employee_remarks}):null';

if (s.includes('function EbEmployeeRemark')) {
  console.log('Helper already present');
} else {
  const anchor = 'function EbConfirmModal';
  if (!s.includes(anchor)) {
    console.error('EbConfirmModal anchor not found');
    process.exit(1);
  }
  s = s.replace(anchor, helper + anchor);
  console.log('Injected EbEmployeeRemark helper');
}

if (!s.includes(cellOld)) {
  if (s.includes(cellNew)) {
    console.log('Remarks cell already patched');
  } else {
    console.error('Remarks cell target not found');
    process.exit(1);
  }
} else {
  s = s.replace(cellOld, cellNew);
  console.log('Patched remarks cell');
}

fs.writeFileSync(bundlePath, s);
console.log('Employee remark preview patch complete');
