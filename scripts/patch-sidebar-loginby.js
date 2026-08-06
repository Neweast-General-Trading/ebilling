#!/usr/bin/env node
/** Show "Logged in by: <name>" at the bottom of the eBilling sidebar. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bundle = path.join(root, 'client/dist/assets/index-approval-v2.js');

let s = fs.readFileSync(bundle, 'utf8');

const helper =
  'function EbCurrentUserName(){try{const u=JSON.parse(localStorage.getItem("rectracking_user")||"null");if(u){const n=u.name||u.username||(u.preferred_username||u.email||"").split("@")[0];if(n)return n}}catch{}const t=localStorage.getItem("jwt");if(t){try{const p=JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));return p.name||(p.email||p.preferred_username||"").split("@")[0]||""}catch{}}return""}';

const wdAnchor =
  'function Wd(a,l,r){localStorage.setItem("jwt",a.trim()),localStorage.setItem("rectracking_co",l.trim()),localStorage.setItem("rectracking_user",JSON.stringify(r)),window.dispatchEvent(new Event("rectracking:session"))}';

if (!s.includes('function EbCurrentUserName')) {
  if (!s.includes(wdAnchor)) {
    console.error('patch-sidebar-loginby: Wd anchor not found');
    process.exit(1);
  }
  s = s.replace(wdAnchor, wdAnchor + helper);
}

const footerOld =
  'i.jsx("div",{className:"eb-nav-footer",children:i.jsxs("p",{className:"eb-nav-footer-text",children:["Made By IT&Busniess DEPT",i.jsx("br",{}),"NEWEAST © ",(new Date).getFullYear()]})})';
const footerNew =
  'i.jsxs("div",{className:"eb-nav-footer",children:[EbCurrentUserName()?i.jsxs("p",{className:"eb-nav-footer-text",style:{marginBottom:"8px",fontWeight:600,color:"#0f766e"},children:["Logged in by: ",EbCurrentUserName()]}):null,i.jsxs("p",{className:"eb-nav-footer-text",children:["Made By IT&Busniess DEPT",i.jsx("br",{}),"NEWEAST © ",(new Date).getFullYear()]})]})';

if (s.includes(footerOld)) {
  s = s.replace(footerOld, footerNew);
} else if (!s.includes('Logged in by: ')) {
  console.error('patch-sidebar-loginby: sidebar footer not found');
  process.exit(1);
}

if ((s.match(/function EbCurrentUserName/g) || []).length !== 1) {
  console.error('patch-sidebar-loginby: expected 1 EbCurrentUserName');
  process.exit(1);
}

try {
  new Function(s);
} catch (e) {
  console.error('patch-sidebar-loginby: bundle parse failed', e.message);
  process.exit(1);
}

fs.writeFileSync(bundle, s);
console.log('patch-sidebar-loginby: applied');
