#!/usr/bin/env node
/**
 * Enable Microsoft login: remove dev bypass, add /login route, protect routes.
 */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'remove WT dev bypass',
    old: 'function WT(){localStorage.setItem("rectracking_co",localStorage.getItem("rectracking_co")||"BI_NEGT");localStorage.setItem("rectracking_user",JSON.stringify({email:"sakour@neweast.co",preferred_username:"sakour@neweast.co"}));const a=',
    new: 'function WT(){localStorage.setItem("rectracking_co",localStorage.getItem("rectracking_co")||"BI_NEGT");const a=',
  },
  {
    name: 'add auth guard En',
    old: 'function Mn({children:a}){return xb()?i.jsx("div",{className:"flex min-h-[200px] items-center justify-center text-sm text-slate-500",children:"Waiting for intranet session…"}):i.jsx(pw,{children:a})}',
    new: 'function En({children:a}){return xb()?i.jsx("div",{className:"flex min-h-[200px] items-center justify-center text-sm text-slate-500",children:"Waiting for intranet session…"}):localStorage.getItem("jwt")?i.jsx(pw,{children:a}):i.jsx(Hi,{to:"/login",replace:!0})}function Mn({children:a}){return xb()?i.jsx("div",{className:"flex min-h-[200px] items-center justify-center text-sm text-slate-500",children:"Waiting for intranet session…"}):i.jsx(pw,{children:a})}',
  },
  {
    name: 'protect routes with En',
    old: 'i.jsx(Mn,{children:',
    new: 'i.jsx(En,{children:',
    replaceAll: true,
  },
  {
    name: 'add /login route',
    old: 'i.jsx(ga,{path:"/embed",element:i.jsx(Ow,{})}),i.jsx(ga,{path:"/dashboard"',
    new: 'i.jsx(ga,{path:"/embed",element:i.jsx(Ow,{})}),i.jsx(ga,{path:"/login",element:i.jsx(Rw,{})}),i.jsx(ga,{path:"/dashboard"',
  },
  {
    name: 'microsoft login via server redirect',
    old: 'const v=async()=>{if(!window.isSecureContext){window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent(`${window.location.origin}/ebilling/`)}`;return}p(!0);try{const{msalInstance:y,msalReady:g}=await xg(async()=>{const{msalInstance:q,msalReady:le}=await import("./msalInstance-D_L03m9X.js");return{msalInstance:q,msalReady:le}},__vite__mapDeps([0,1])),{loginRequest:_}=await xg(async()=>{const{loginRequest:q}=await import("./authConfig-CFEuT2ty.js");return{loginRequest:q}},[]);await g;const N=await y.loginPopup(_),{data:A}=await De.post(ze.AUTH_LOGIN,{azureToken:N.accessToken}),C=A?.token;if(!C)throw new Error("No token");const S=N.account?.username||N.account?.idTokenClaims?.preferred_username||"",{data:k}=await De.get(ze.AUTH_COMPANIES,{params:{email:S},headers:{Authorization:`Bearer ${C}`}}),M=k?.result||[],X=o||M[0]?.BRANCH||"BI_NEGT";Wd(C,X,N.account),se.success("Logged in"),a("/dashboard")}catch(y){console.error(y),se.error("Login failed")}finally{p(!1)}}',
    new: 'const v=()=>{window.location.href=`${lw}/auth/microsoft/login?returnTo=${encodeURIComponent(`${window.location.origin}/ebilling/login`)}`}',
  },
  {
    name: '401 redirect to login',
    old: 'window.location.href="/ebilling/"',
    new: 'window.location.href="/ebilling/login"',
  },
];

for (const patch of patches) {
  if (patch.replaceAll) {
    if (!s.includes(patch.old)) {
      console.error(`Missing patch target: ${patch.name}`);
      process.exit(1);
    }
    s = s.split(patch.old).join(patch.new);
    console.log(`Applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    if (patch.name.includes('dev bypass') && !s.includes('sakour@neweast.co')) {
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
console.log('Microsoft login enabled in client bundle');
