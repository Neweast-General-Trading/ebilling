#!/usr/bin/env node
/** Deep links + highlight for recovery Teams notifications. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'shell URL deep link',
    old: 'x=b.useMemo(()=>!f&&h?swAdmin:[],[f,h]);if(o)return',
    new: 'x=b.useMemo(()=>!f&&h?swAdmin:[],[f,h]);b.useEffect(()=>{const q=new URLSearchParams(window.location.search),co=q.get("co");co&&localStorage.setItem("rectracking_co",co);const rid=q.get("recoveryRequest");rid&&ebIsRecoveryApprover(EbShellEmail)&&(C(!0),window.dispatchEvent(new CustomEvent("ebilling:recovery-open-request",{detail:{requestId:rid}})))},[EbShellEmail,C]);if(o)return',
  },
  {
    name: 'recovery panel focus state',
    old: 'function EbRecoveryRequestsPanel(){const a=ka(),{email:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState(!0),[p,m]=b.useState(null),[v,y]=b.useState(null),[g,_]=b.useState(null),N=b.useCallback',
    new: 'function EbRecoveryRequestsPanel(){const a=ka(),{email:l}=bb(),[r,o]=b.useState([]),[u,f]=b.useState(!0),[p,m]=b.useState(null),[v,y]=b.useState(null),[g,_]=b.useState(null),[EbRecFocus,SetEbRecFocus]=b.useState(null),N=b.useCallback',
  },
  {
    name: 'recovery panel focus listener',
    old: 'return window.addEventListener("ebilling:recovery-refresh",A),()=>window.removeEventListener("ebilling:recovery-refresh",A)},[N]);if(!ebIsRecoveryApprover(l))return null;return i.jsxs(i.Fragment,{children:[i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Recovery Requests"})',
    new: 'return window.addEventListener("ebilling:recovery-refresh",A),()=>window.removeEventListener("ebilling:recovery-refresh",A)},[N]),b.useEffect(()=>{const q=new URLSearchParams(window.location.search),rid=q.get("recoveryRequest");rid&&SetEbRecFocus(rid);const O=ie=>SetEbRecFocus(ie.detail?.requestId||null);return window.addEventListener("ebilling:recovery-open-request",O),()=>window.removeEventListener("ebilling:recovery-open-request",O)},[]);if(!ebIsRecoveryApprover(l))return null;return i.jsxs(i.Fragment,{children:[i.jsxs("section",{className:"eb-approval-section",children:[i.jsxs("div",{className:"eb-approval-section-head",children:[i.jsx("h4",{children:"Recovery Requests"})',
  },
  {
    name: 'recovery card highlight',
    old: 'r.map(A=>i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich",children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:A.invoiceCode||A.phoneNumber||"Invoice"})',
    new: 'r.map(A=>i.jsxs("article",{className:"eb-approval-card eb-approval-card-rich"+(EbRecFocus===String(A.id)?" eb-recovery-card-focus":""),children:[i.jsxs("div",{className:"eb-approval-card-top",children:[i.jsxs("div",{className:"min-w-0",children:[i.jsx("p",{className:"eb-approval-ref",children:A.invoiceCode||A.phoneNumber||"Invoice"})',
  },
  {
    name: 'invoices month deep link',
    old: 'b.useEffect(()=>{ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay)},[a,EbCanManage,f]),b.useEffect(()=>{const O=()=>ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay);return window.addEventListener("ebilling:recovery-refresh",O),()=>window.removeEventListener("ebilling:recovery-refresh",O)},[a,EbCanManage]);return i.jsxs("div",{className:"space-y-6"',
    new: 'b.useEffect(()=>{const q=new URLSearchParams(window.location.search),co=q.get("co");co&&localStorage.setItem("rectracking_co",co);const mo=q.get("month");mo&&p(mo)},[]),b.useEffect(()=>{ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay)},[a,EbCanManage,f]),b.useEffect(()=>{const O=()=>ebLoadRecoveryOverlay(a,EbCanManage,SetEbRecOverlay);return window.addEventListener("ebilling:recovery-refresh",O),()=>window.removeEventListener("ebilling:recovery-refresh",O)},[a,EbCanManage]);return i.jsxs("div",{className:"space-y-6"',
  },
];

for (const patch of patches) {
  if (s.includes(patch.old)) {
    s = s.replace(patch.old, patch.new);
    console.log(`Applied: ${patch.name}`);
    continue;
  }
  if (s.includes(patch.new.slice(0, 80))) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  console.error(`Missing target: ${patch.name}`);
  process.exit(1);
}

fs.writeFileSync(bundlePath, s);

const cssExtra = `
.eb-recovery-card-focus {
  outline: 2px solid #059669;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.15);
}
`;
if (!fs.readFileSync(cssPath, 'utf8').includes('.eb-recovery-card-focus')) {
  fs.appendFileSync(cssPath, cssExtra);
  console.log('Appended recovery focus CSS');
}

console.log('Recovery deeplink patch complete');
