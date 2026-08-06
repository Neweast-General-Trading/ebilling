#!/usr/bin/env node
/** Security hardening: JWT hash login, fail-closed permissions. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'JWT from hash fragment',
    old: 'const U=new URLSearchParams(window.location.search),R=U.get("loginError");if(R){se.error(decodeURIComponent(R.replace(/\\+/g," "))),window.history.replaceState({}, "",window.location.pathname+window.location.hash)}const Q=U.get("jwt");if(Q){const EbU=dw(Q);Wd(Q,U.get("co")||"BI_NEGT",EbU?{email:EbU,preferred_username:EbU}:null),se.success("Logged in"),window.history.replaceState({}, "",window.location.pathname+window.location.hash),a("/dashboard");return}',
    new: 'const U=new URLSearchParams(window.location.search),EbH=new URLSearchParams((window.location.hash||"").replace(/^#/,"")),R=U.get("loginError")||EbH.get("loginError");if(R){se.error(decodeURIComponent(R.replace(/\\+/g," "))),window.history.replaceState({}, "",window.location.pathname)}const Q=EbH.get("jwt")||U.get("jwt"),EbCo=EbH.get("co")||U.get("co");if(Q){const EbU=dw(Q);Wd(Q,EbCo||"BI_NEGT",EbU?{email:EbU,preferred_username:EbU}:null),se.success("Logged in"),window.history.replaceState({}, "",window.location.pathname),a("/dashboard");return}',
  },
  {
    name: 'permissions API default dashboard only',
    old: 'return{permissions:l.permissions?.length?l.permissions:[...Ii],canManage:!!l.canManage,loading:!1}}function bb()',
    new: 'return{permissions:l.permissions?.length?l.permissions:["dashboard"],canManage:!!l.canManage,loading:!1}}function bb()',
  },
  {
    name: 'permissions hook fail closed',
    old: 'catch{const u={permissions:[...Ii],canManage:Po(qo()),loading:!1};return Rl=u,l(u),u}',
    new: 'catch{const u={permissions:["dashboard"],canManage:!1,loading:!1};return Rl=u,l(u),u}',
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

const index = fs.readFileSync(indexPath, 'utf8');
if (index.includes('v=20260613a')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260613a', 'index-DGxZ6d5S.js?v=20260613b')
      .replace('ebilling-shell.css?v=17', 'ebilling-shell.css?v=18'),
  );
  console.log('Bumped cache versions');
}

console.log('Security client patch complete');
