#!/usr/bin/env node
/** Fix blank invoices page + Oracle search for excess approval approvers */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const newSettingsPage = `function EbExcessApprovalSettingsPage(){const a=ka(),[l,r]=b.useState([{approvers:[""]}]),[o,u]=b.useState(!0),[f,p]=b.useState(!1),[EbCand,x]=b.useState([]),[EbCandLoad,y]=b.useState(!0),[EbSearch,g]=b.useState({});b.useEffect(()=>{u(!0),De.get(ze.EXCESS_APPROVAL_SETTINGS,{params:{co:a}}).then(({data:m})=>{const v=(m?.levels||[]).map(N=>({approvers:N.approvers?.length?N.approvers:[""]}));r(v.length?v:[{approvers:[""]}])}).catch(()=>se.error("Could not load excess approval settings")).finally(()=>u(!1))},[a]);b.useEffect(()=>{y(!0),De.get(\`\${ze.PERMISSIONS_CANDIDATES}?co=\${encodeURIComponent(a)}\`).then(({data:m})=>x(m.candidates||[])).catch(()=>se.error("Could not load Oracle employees")).finally(()=>y(!1))},[a]);const _=(m,v,A)=>{r(C=>{const S=[...C];if(!S[m])return C;const k=[...S[m].approvers];A==="add"?k.push(""):A==="remove"?k.splice(v,1):k[v]=A,S[m]={approvers:k.length?k:[""]};return S})},N=(m,v)=>{const A=\`\${m}-\${v}\`;return(EbSearch[A]||"").trim().toLowerCase()},A=(m,v,C)=>{const S=\`\${m}-\${v}\`;g(k=>({...k,[S]:C}))};return i.jsxs("div",{className:"space-y-6",children:[i.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[i.jsxs("div",{children:[i.jsxs("div",{className:"mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700",children:[i.jsx(Cb,{className:"size-3.5"}),"Excess approval matrix"]}),i.jsx("h2",{className:"text-2xl font-bold tracking-tight text-slate-900",children:"Excess approval settings"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Configure approvers from Oracle master data. Search by name, person number, or email. Approvers are notified by email and Teams level by level."})]}),i.jsx(Me,{variant:"outline",asChild:!0,children:i.jsx(Ts,{to:"/user-permissions",children:"Back to permissions"})})]}),i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Approval levels"})}),i.jsxs(We,{className:"space-y-4",children:[o?i.jsxs("div",{className:"flex items-center gap-2 p-8 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading settings…"]}):l.map((m,v)=>i.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50/70 p-4",children:[i.jsxs("div",{className:"mb-3 flex items-center justify-between",children:[i.jsxs("strong",{className:"text-sm text-slate-800",children:["Level ",v+1]}),i.jsx(Me,{variant:"outline",size:"sm",className:"text-red-700",onClick:()=>r(C=>C.filter((S,k)=>k!==v)),children:"Remove level"})]}),m.approvers.map((C,S)=>{const k=N(v,S),M=EbCand.filter(X=>!k||String(X.displayName||"").toLowerCase().includes(k)||String(X.email||"").toLowerCase().includes(k)||String(X.personNumber||"").toLowerCase().includes(k)).slice(0,10);return i.jsxs("div",{className:"mb-3 rounded-md border border-slate-200 bg-white p-3",children:[i.jsx("input",{type:"search",placeholder:"Search Oracle by name, person number, or email…",value:EbSearch[\`\${v}-\${S}\`]||"",onChange:X=>A(v,S,X.target.value),className:"mb-2 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"}),EbCandLoad?i.jsx("p",{className:"mb-2 text-xs text-slate-500",children:"Loading Oracle employees…"}):M.length?i.jsx("div",{className:"mb-2 max-h-44 space-y-1 overflow-y-auto rounded border border-slate-100 p-1",children:M.map(X=>i.jsxs("button",{type:"button",className:"flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left text-xs hover:bg-sky-50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3",onClick:()=>{_(v,S,String(X.email||"").toLowerCase()),A(v,S,[X.displayName,X.personNumber?\\`#\${X.personNumber}\`:null,X.email].filter(Boolean).join(" · "))},children:[i.jsx("span",{className:"font-semibold text-slate-900",children:X.displayName||"—"}),i.jsx("span",{className:"text-slate-600",children:X.personNumber?\\`Person #\${X.personNumber}\`:"No person #"}),i.jsx("span",{className:"text-sky-700",children:X.email||"—"})]},X.email))}):k?i.jsx("p",{className:"mb-2 text-xs text-slate-500",children:"No Oracle match — enter email manually below."}):null,i.jsxs("div",{className:"flex gap-2",children:[i.jsx("input",{type:"email",className:"flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm",placeholder:"Selected approver email",value:C,onChange:X=>_(v,S,X.target.value)}),i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>_(v,S,"remove"),children:"×"})]})]},String(S))}),i.jsx(Me,{variant:"outline",size:"sm",onClick:()=>_(v,0,"add"),children:"+ Add approver"})]},String(v))),i.jsxs("div",{className:"flex flex-wrap gap-2 pt-2",children:[i.jsx(Me,{variant:"outline",onClick:()=>r(m=>[...m,{approvers:[""]}]),children:"+ Add level"}),i.jsx(Me,{className:"eb-btn-primary",disabled:f,onClick:async()=>{p(!0);try{const m={levels:l.map(v=>({approvers:[...new Set(v.approvers.map(C=>C.trim().toLowerCase()).filter(Boolean))]})).filter(v=>v.approvers.length)};const{data:v}=await De.put(ze.EXCESS_APPROVAL_SETTINGS,m,{params:{co:a}});const C=(v?.levels||[]).map(S=>({approvers:S.approvers?.length?S.approvers:[""]}));r(C.length?C:[{approvers:[""]}]),se.success("Excess approval settings saved")}catch{se.error("Could not save settings")}finally{p(!1)}},children:f?i.jsxs(i.Fragment,{children:[i.jsx(Kt,{className:"size-4 animate-spin"})," Saving…"]}):"Save settings"})]})]})]})]})}`;

const patches = [
  {
    name: 'missing excess matrix helpers',
    old: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval"||a.approval_status==="waiting_confirmation")&&!!a.email?.trim()}function ev(a,l){return!1}',
    new: 'function Bi(a){return Vi(a)>0&&(a.approval_status==="draft"||a.approval_status==="pending_approval"||a.approval_status==="waiting_confirmation")&&!!a.email?.trim()}function EbExcessMatrixEligible(a){return Vi(a)>0&&a.approval_status!=="pending_excess_approval"}function EbInvoiceRowSelectable(a){return Bi(a)||EbExcessMatrixEligible(a)}function ev(a,l){return!1}',
    required: true,
  },
  {
    name: 'excess approval oracle search settings',
    old: /function EbExcessApprovalSettingsPage\(\)\{[\s\S]*?\}function eA\(\)/,
    new: newSettingsPage + 'function eA()',
    regex: true,
    required: true,
  },
  {
    name: 'permissions oracle search results list',
    old: 'placeholder:"Search by name, email, or person number…",className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"}),i.jsxs("select",{value:g,onChange:D=>{_(D.target.value),er("")},disabled:m,className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500",children:[i.jsx("option",{value:"",children:m?"Loading Oracle emails…":X.length>0?"Select employee email…":"No available employees found"}),X.map(D=>i.jsxs("option",{value:D.email,children:[D.displayName," — ",D.email,D.personNumber?` (#${D.personNumber})`:""]},D.email))]})]}),i.jsxs(Me,{onClick:le,disabled:!g||x===g,children:[i.jsx(__,{className:"mr-2 size-4"}),"Add from Oracle"]})',
    new: 'placeholder:"Search by name, email, or person number…",className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"}),N.trim()&&!m&&X.length?i.jsx("div",{className:"max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1",children:X.slice(0,12).map(D=>i.jsxs("button",{type:"button",className:"flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left text-xs hover:bg-emerald-50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3",onClick:()=>{_(D.email),er(""),A("")},children:[i.jsx("span",{className:"font-semibold text-slate-900",children:D.displayName||"—"}),i.jsx("span",{className:"text-slate-600",children:D.personNumber?`Person #${D.personNumber}`:"No person #"}),i.jsx("span",{className:"text-emerald-700",children:D.email||"—"})]},D.email))}):N.trim()&&!m&&!X.length?i.jsx("p",{className:"text-xs text-slate-500",children:"No Oracle match for this search."}):null,i.jsxs("select",{value:g,onChange:D=>{_(D.target.value),er("")},disabled:m,className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500",children:[i.jsx("option",{value:"",children:m?"Loading Oracle emails…":g?`Selected: ${g}`:"Pick from search results or list…"}),X.map(D=>i.jsxs("option",{value:D.email,children:[D.displayName," · ",D.personNumber?`#${D.personNumber} · `:"",D.email]},D.email))]})]}),i.jsxs(Me,{onClick:le,disabled:!g||x===g,children:[i.jsx(__,{className:"mr-2 size-4"}),"Add from Oracle"]})',
    required: false,
  },
];

for (const patch of patches) {
  if (patch.regex) {
    if (patch.new.slice(0, 40).length && s.includes(patch.new.slice(0, 40).replace(/\\/g, ''))) {
      console.log(`Already applied: ${patch.name}`);
      continue;
    }
    if (!patch.old.test(s)) {
      if (patch.required) {
        console.error(`Missing target: ${patch.name}`);
        process.exit(1);
      }
      console.log(`Skipped (not found): ${patch.name}`);
      continue;
    }
    s = s.replace(patch.old, patch.new);
    console.log(`Applied: ${patch.name}`);
    continue;
  }
  if (s.includes(patch.new.slice(0, Math.min(50, patch.new.length)))) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  if (!s.includes(patch.old)) {
    if (patch.required) {
      console.error(`Missing target: ${patch.name}`);
      process.exit(1);
    }
    console.log(`Skipped (not found): ${patch.name}`);
    continue;
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Excess approval fixes patch complete');
