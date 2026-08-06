#!/usr/bin/env node
/** Add a "Configure / Approval matrix" tab to the Excess approval settings page. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bundle = path.join(root, 'client/dist/assets/index-approval-v2.js');

let s = fs.readFileSync(bundle, 'utf8');

const helpers =
  'function EbApprovalTabBar({tab:a,setTab:l}){const r=(o,u)=>i.jsx("button",{type:"button",onClick:()=>l(o),className:"rounded-lg px-4 py-2 text-sm font-medium transition "+(a===o?"bg-sky-600 text-white shadow":"text-slate-600 hover:bg-slate-100"),children:u},o);return i.jsxs("div",{className:"inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm",children:[r("config","Configure"),r("matrix","Approval matrix")]})}' +
  'function EbApprovalMatrixView({levels:a,loading:l}){if(l)return i.jsxs("div",{className:"flex items-center gap-2 p-8 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading matrix…"]});const r=(a||[]).map(o=>({approvers:(o.approvers||[]).map(u=>String(u||"").trim()).filter(Boolean)})).filter(o=>o.approvers.length);if(!r.length)return i.jsx("div",{className:"rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500",children:"No approval levels configured yet. Switch to Configure to add levels and approvers."});return i.jsxs("div",{className:"space-y-4",children:[i.jsxs("div",{className:"flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800",children:[i.jsx("span",{className:"text-base leading-none",children:"ℹ️"}),i.jsxs("span",{children:["Approvals move ",i.jsx("strong",{children:"level by level"}),". ",i.jsx("strong",{children:"Any one approver"})," in a level can approve — the request then advances to the next level automatically."]})]}),i.jsx("div",{className:"space-y-3",children:r.map((o,u)=>i.jsxs(i.Fragment,{children:[i.jsxs("div",{className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm",children:[i.jsxs("div",{className:"mb-3 flex items-center gap-3",children:[i.jsx("div",{className:"flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow",children:u+1}),i.jsxs("div",{children:[i.jsxs("div",{className:"text-sm font-semibold text-slate-900",children:["Level ",u+1]}),i.jsxs("div",{className:"text-xs text-slate-500",children:[o.approvers.length," approver",o.approvers.length>1?"s":""," · any one can approve"]})]})]}),i.jsx("div",{className:"flex flex-wrap gap-2",children:o.approvers.map((f,p)=>i.jsxs("span",{className:"inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700",children:[i.jsx("span",{className:"flex size-5 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold uppercase text-sky-700",children:String(f).charAt(0)}),f]},p))})]}),u<r.length-1?i.jsx("div",{className:"flex justify-center",children:i.jsx("div",{className:"text-lg leading-none text-slate-300",children:"↓"})}):null]},u))})]})}';

const pageAnchor = 'function EbExcessApprovalSettingsPage(){';
if (!s.includes('function EbApprovalMatrixView')) {
  if (!s.includes(pageAnchor)) {
    console.error('patch-excess-matrix-tab: settings page not found');
    process.exit(1);
  }
  s = s.replace(pageAnchor, helpers + pageAnchor);
}

const stateAnchor = 'b.useState({});b.useEffect(()=>{u(!0)';
const stateNew = 'b.useState({});const[EbTab,EbSetTab]=b.useState("config");b.useEffect(()=>{u(!0)';
if (s.includes(stateAnchor)) {
  s = s.replace(stateAnchor, stateNew);
} else if (!s.includes('EbTab,EbSetTab')) {
  console.error('patch-excess-matrix-tab: state hook anchor not found');
  process.exit(1);
}

const renderAnchor =
  'children:"Back to permissions"})})]}),i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Approval levels"})})';
const renderNew =
  'children:"Back to permissions"})})]}),i.jsx(EbApprovalTabBar,{tab:EbTab,setTab:EbSetTab}),EbTab==="matrix"?i.jsx(EbApprovalMatrixView,{levels:l,loading:o}):i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Approval levels"})})';
if (s.includes(renderAnchor)) {
  s = s.replace(renderAnchor, renderNew);
} else if (!s.includes('i.jsx(EbApprovalTabBar,{tab:EbTab')) {
  console.error('patch-excess-matrix-tab: render anchor not found');
  process.exit(1);
}

for (const fn of ['EbApprovalTabBar', 'EbApprovalMatrixView']) {
  if ((s.match(new RegExp(`function ${fn}`, 'g')) || []).length !== 1) {
    console.error(`patch-excess-matrix-tab: expected 1 ${fn}`);
    process.exit(1);
  }
}

try {
  new Function(s);
} catch (e) {
  console.error('patch-excess-matrix-tab: bundle parse failed', e.message);
  process.exit(1);
}

fs.writeFileSync(bundle, s);
console.log('patch-excess-matrix-tab: applied');
