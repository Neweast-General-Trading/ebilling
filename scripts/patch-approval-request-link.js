#!/usr/bin/env node
/**
 * Make /approval-request work for email/Teams links:
 * - With ?token= → open inside eBilling shell (sidebar) without Microsoft login
 * - With jwt → normal authenticated page
 * - Else → login with returnTo
 * Also prevent axios 401 interceptor from yanking token links to /login.
 */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');

// 1) Route: no En/Mn wrapper — gate handled inside EbApprovalRequestRoute
const routeTargets = [
  'path:"/approval-request",element:i.jsx(En,{children:i.jsx(EbApprovalRequestRoute,{})})}',
  'path:"/approval-request",element:i.jsx(Mn,{children:i.jsx(EbApprovalRequestRoute,{})})}',
];
const routeNew = 'path:"/approval-request",element:i.jsx(EbApprovalRequestRoute,{})}';
if (!s.includes(routeNew)) {
  let hit = false;
  for (const old of routeTargets) {
    if (s.includes(old)) {
      s = s.replace(old, routeNew);
      hit = true;
      console.log('applied: bare approval-request route');
      break;
    }
  }
  if (!hit) throw new Error('approval-link: route anchor not found');
} else {
  console.log('already: bare approval-request route');
}

// 2) Token opens inside full shell (Mn → pw); jwt uses En → pw; else login
const routeFnNew = `function EbApprovalRequestRoute(){const t=(()=>{try{var p=new URLSearchParams(window.location.search);var tok=p.get("token")||sessionStorage.getItem("eb_approval_token")||"";if(tok)sessionStorage.setItem("eb_approval_token",tok);var co=p.get("co");if(co)localStorage.setItem("rectracking_co",co);return tok;}catch(e){return sessionStorage.getItem("eb_approval_token")||""}})();if(t)return i.jsx(Mn,{children:i.jsx(EbApprovalRequestPage,{})});if(localStorage.getItem("jwt"))return i.jsx(En,{children:i.jsx(EbApprovalRequestPage,{})});return i.jsx(Hi,{to:"/login?returnTo="+encodeURIComponent(window.location.origin+window.location.pathname+window.location.search),replace:!0})}`;

const reRoute = /function EbApprovalRequestRoute\(\)\{[\s\S]*?\nfunction /;
if (s.includes('if(t)return i.jsx(Mn,{children:i.jsx(EbApprovalRequestPage,{})})')) {
  console.log('already: token page inside shell');
} else if (reRoute.test(s)) {
  s = s.replace(reRoute, routeFnNew + '\n\n\nfunction ');
  console.log('applied: token page inside shell');
} else {
  throw new Error('approval-link: EbApprovalRequestRoute replace failed');
}

// Also let the page itself fall back to session token (Jo query can be empty after normalize)
const pageOld = 'function EbApprovalRequestPage(){const s=ka(),[l]=Jo(),a=l.get("token")||"",';
const pageNew = 'function EbApprovalRequestPage(){const s=ka(),[l]=Jo(),a=l.get("token")||sessionStorage.getItem("eb_approval_token")||"",';
if (s.includes(pageNew)) {
  console.log('already: page session token fallback');
} else if (s.includes(pageOld)) {
  s = s.replace(pageOld, pageNew);
  console.log('applied: page session token fallback');
} else {
  console.warn('warn: EbApprovalRequestPage token anchor not found');
}

// 3) Axios 401: do not force login redirect on tokenized approval links
const i401 = 'if(a.response?.status===401&&!l){if(localStorage.removeItem("jwt"),r)return window.parent.postMessage({type:"rectracking:error",message:"Session expired"},"*"),Promise.reject(a);window.location.href="/ebilling/login"}';
const i401New = 'if(a.response?.status===401&&!l){if(localStorage.removeItem("jwt"),r)return window.parent.postMessage({type:"rectracking:error",message:"Session expired"},"*"),Promise.reject(a);try{var __ebT=new URLSearchParams(window.location.search||"").get("token");if(__ebT&&(window.location.pathname||"").indexOf("approval-request")>=0)return Promise.reject(a);}catch(__e){}window.location.href=(typeof window!=="undefined"&&window.location.hostname==="ebilling.neweast.cloud"?"/login":"/ebilling/login")}';
if (s.includes('__ebT&&(window.location.pathname||"").indexOf("approval-request")')) {
  console.log('already: 401 interceptor token skip');
} else if (s.includes(i401)) {
  s = s.replace(i401, i401New);
  console.log('applied: 401 interceptor token skip');
} else {
  console.warn('warn: 401 interceptor anchor not found (may already differ)');
}

// 4) Login button: honor ?returnTo= so Microsoft OAuth brings approvers back
const loginOld = 'window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent(`${window.location.origin}${window.location.hostname==="ebilling.neweast.cloud"?"/login":"/ebilling/login"}`)}`';
const loginNew = 'window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent((()=>{try{var r=new URLSearchParams(window.location.search).get("returnTo");if(r){if(/^https?:\\/\\//i.test(r))return r;if(r.charAt(0)==="/")return window.location.origin+r;}}catch(e){}return `${window.location.origin}${window.location.hostname==="ebilling.neweast.cloud"?"/login":"/ebilling/login"}`;})())}`';
if (s.includes('get("returnTo");if(r){if(/^https?')) {
  console.log('already: microsoft login returnTo honor');
} else if (s.includes(loginOld)) {
  s = s.replace(loginOld, loginNew);
  console.log('applied: microsoft login returnTo honor');
} else {
  console.warn('warn: microsoft login returnTo anchor not found');
}

fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-approval-request-link: done');
