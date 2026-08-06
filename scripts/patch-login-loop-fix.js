#!/usr/bin/env node
/** Fix login loop: persist user from JWT, skip 401 redirect on login page. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'save user email when OAuth returns jwt',
    old: 'if(Q){Wd(Q,U.get("co")||"BI_NEGT",null),se.success("Logged in")',
    new: 'if(Q){const EbU=dw(Q);Wd(Q,U.get("co")||"BI_NEGT",EbU?{email:EbU,preferred_username:EbU}:null),se.success("Logged in")',
  },
  {
    name: 'skip 401 redirect on login page',
    old: 'const l=window.location.pathname==="/"||window.location.pathname==="/rectracking"||window.location.pathname==="/ebilling/",',
    new: 'const l=window.location.pathname==="/"||window.location.pathname==="/rectracking"||window.location.pathname==="/ebilling/"||window.location.pathname==="/ebilling/login"||window.location.pathname.endsWith("/login"),',
  },
  {
    name: 'clear stale jwt before OAuth redirect',
    old: 'const v=()=>{window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent(`${window.location.origin}/ebilling/login`)}`}',
    new: 'const v=()=>{localStorage.removeItem("jwt"),localStorage.removeItem("rectracking_user"),window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent(`${window.location.origin}/ebilling/login`)}`}',
  },
];

for (const patch of patches) {
  if (!s.includes(patch.old)) {
    if (patch.name.includes('401') && s.includes('/ebilling/login"||window.location.pathname.endsWith("/login")')) {
      console.log(`Skipped (already applied): ${patch.name}`);
      continue;
    }
    console.error(`Missing patch target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Login loop fixes applied');
