#!/usr/bin/env node
/** Integrate Excess Approval settings into SPA + permissions tab */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const settingsPage = `function EbExcessApprovalSettingsPage(){const a=ka(),[l,r]=b.useState([{approvers:[""]}]),[o,u]=b.useState(!0),[f,p]=b.useState(!1);b.useEffect(()=>{u(!0),De.get(ze.EXCESS_APPROVAL_SETTINGS,{params:{co:a}}).then(({data:m})=>{const v=(m?.levels||[]).map(x=>({approvers:x.approvers?.length?x.approvers:[""]}));r(v.length?v:[{approvers:[""]}])}).catch(()=>se.error("Could not load excess approval settings")).finally(()=>u(!1))},[a]);const m=(v,y,g)=>{r(_=>{const N=[..._];if(!N[v])return _;const A=[...N[v].approvers];g==="add"?A.push(""):g==="remove"?A.splice(y,1):A[y]=g,N[v]={approvers:A.length?A:[""]};return N})};return i.jsxs("div",{className:"space-y-6",children:[i.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[i.jsxs("div",{children:[i.jsxs("div",{className:"mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700",children:[i.jsx(Cb,{className:"size-3.5"}),"Excess approval matrix"]}),i.jsx("h2",{className:"text-2xl font-bold tracking-tight text-slate-900",children:"Excess approval settings"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Configure who approves employee excess after official/personal split. When an employee clicks Send excess to approve, approvers are notified by email and Teams level by level."})]}),i.jsx(Me,{variant:"outline",asChild:!0,children:i.jsx(Ts,{to:"/user-permissions",children:"Back to permissions"})})]}),i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Approval levels"})}),i.jsxs(We,{className:"space-y-4",children:[o?i.jsxs("div",{className:"flex items-center gap-2 p-8 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading settings…"]}):l.map((v,y)=>i.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50/70 p-4",children:[i.jsxs("div",{className:"mb-3 flex items-center justify-between",children:[i.jsxs("strong",{className:"text-sm text-slate-800",children:["Level ",y+1]}),i.jsx(Me,{variant:"outline",size:"sm",className:"text-red-700",onClick:()=>r(g=>g.filter((_,N)=>N!==y)),children:"Remove level"})]}),v.approvers.map((g,_)=>i.jsxs("div",{className:"mb-2 flex gap-2",children:[i.jsx("input",{type:"email",className:"flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm",placeholder:"approver@neweast.co",value:g,onChange:N=>m(y,_,N.target.value)}),i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>m(y,_,"remove"),children:"×"})]},String(_))),i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>m(y,0,"add"),children:"+ Add approver"})]},String(y))),i.jsxs("div",{className:"flex flex-wrap gap-2 pt-2",children:[i.jsx(Me,{variant:"outline",onClick:()=>r(v=>[...v,{approvers:[""]}]),children:"+ Add level"}),i.jsx(Me,{className:"eb-btn-primary",disabled:f,onClick:async()=>{p(!0);try{const v={levels:l.map(y=>({approvers:[...new Set(y.approvers.map(g=>g.trim().toLowerCase()).filter(Boolean))]})).filter(y=>y.approvers.length)};const{data:y}=await De.put(ze.EXCESS_APPROVAL_SETTINGS,v,{params:{co:a}});const g=(y?.levels||[]).map(_=>({approvers:_.approvers?.length?_.approvers:[""]}));r(g.length?g:[{approvers:[""]}]),se.success("Excess approval settings saved")}catch{se.error("Could not save settings")}finally{p(!1)}},children:f?i.jsxs(i.Fragment,{children:[i.jsx(Kt,{className:"size-4 animate-spin"})," Saving…"]}):"Save settings"})]})]})]})]})}function eA(){return i.jsx(zl,{permission:"excess_approval",children:i.jsx(EbExcessApprovalSettingsPage,{})})}`;

const patches = [
  {
    name: 'permission keys cw',
    old: 'cw=["dashboard","invoices","master","analysis","audit_log","recovery_log"]',
    new: 'cw=["dashboard","invoices","master","analysis","audit_log","recovery_log","excess_approval"]',
  },
  {
    name: 'permission labels pg',
    old: 'pg={dashboard:"Dashboard",invoices:"Invoices",master:"Master",analysis:"Analysis",audit_log:"Users Log",recovery_log:"Recovery"}',
    new: 'pg={dashboard:"Dashboard",invoices:"Invoices",master:"Master",analysis:"Analysis",audit_log:"Users Log",recovery_log:"Recovery",excess_approval:"Excess approval"}',
  },
  {
    name: 'api endpoint',
    old: 'PERMISSIONS_CANDIDATES:"/permissions/candidates",NOTIFICATIONS_MONTHLY:',
    new: 'PERMISSIONS_CANDIDATES:"/permissions/candidates",EXCESS_APPROVAL_SETTINGS:"/excess-approval/settings",NOTIFICATIONS_MONTHLY:',
  },
  {
    name: 'inject settings page',
    old: 'function $T(){const a=vb()',
    new: settingsPage + 'function $T(){const a=vb()',
  },
  {
    name: 'swAdmin with permissions',
    old: 'swAdmin=[{id:"upload",label:"Files upload",path:"/samples"},{id:"user_permissions",label:"Permissions",path:"/user-permissions"},{id:"audit_log",label:"Users Log",path:"/audit-log"}]',
    new: 'swAdmin=[{id:"upload",label:"Files upload",path:"/samples",adminOnly:!0},{id:"user_permissions",label:"Permissions",path:"/user-permissions",adminOnly:!0},{id:"excess_approval_settings",label:"Excess approval",path:"/excess-approval-settings",permission:"excess_approval"},{id:"audit_log",label:"Users Log",path:"/audit-log",permission:"audit_log",adminOnly:!0}]',
  },
  {
    name: 'shell admin nav filter',
    old: 'x=b.useMemo(()=>!f&&h?swAdmin:[],[f,h]);',
    new: 'x=b.useMemo(()=>f?[]:swAdmin.filter(m=>m.adminOnly&&!h?!1:h?!0:m.permission?u(m.permission):!1),[u,f,h]);',
  },
  {
    name: 'route excess approval settings',
    old: 'path:"/user-permissions",element:i.jsx(En,{children:i.jsx(ZT,{})})}),i.jsx(ga,{path:"/recovery-log"',
    new: 'path:"/user-permissions",element:i.jsx(En,{children:i.jsx(ZT,{})})}),i.jsx(ga,{path:"/excess-approval-settings",element:i.jsx(En,{children:i.jsx(eA,{})})}),i.jsx(ga,{path:"/recovery-log"',
  },
];

for (const patch of patches) {
  if (s.includes(patch.new.slice(0, Math.min(50, patch.new.length)))) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    console.error(`Missing target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Integrated excess approval settings patch complete');
