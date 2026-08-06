#!/usr/bin/env node
/** Auto-refresh E-bill Approval panel on employee actions, uploads, sends, grid reload. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'approval panel silent refresh + polling',
    old: 'N=b.useCallback(()=>{if(!l){o([]),f([]),m(!1);return}m(!0),De.get(ze.INVOICES_APPROVALS_QUEUE,{params:{co:a}}).then(({data:A})=>{o(A?.pendingApproval||[]),f(A?.readyForRecovery||[])}).catch(()=>{o([]),f([])}).finally(()=>m(!1))},[a,l]);b.useEffect(()=>{N()},[N]),b.useEffect(()=>{const A=()=>N();return window.addEventListener("ebilling:approval-queue-refresh",A),()=>window.removeEventListener("ebilling:approval-queue-refresh",A)},[N]);',
    new: 'N=b.useCallback(A=>{if(!l){o([]),f([]),m(!1);return}A!==!0&&m(!0),De.get(ze.INVOICES_APPROVALS_QUEUE,{params:{co:a}}).then(({data:C})=>{o(C?.pendingApproval||[]),f(C?.readyForRecovery||[])}).catch(()=>{o([]),f([])}).finally(()=>m(!1))},[a,l]);b.useEffect(()=>{N()},[N]),b.useEffect(()=>{const A=()=>N(!0);return window.addEventListener("ebilling:approval-queue-refresh",A),()=>window.removeEventListener("ebilling:approval-queue-refresh",A)},[N]),b.useEffect(()=>{if(!l)return;const A=setInterval(()=>N(!0),2e4),C=()=>{document.visibilityState==="visible"&&N(!0)},S=()=>N(!0);return window.addEventListener("focus",S),document.addEventListener("visibilitychange",C),()=>{clearInterval(A),window.removeEventListener("focus",S),document.removeEventListener("visibilitychange",C)}},[l,N]);',
  },
  {
    name: 'dispatch refresh after invoice grid reload',
    old: 'Te=b.useCallback(async O=>{X(!0);try{const{data:ie}=await De.get(`${ze.INVOICES_GRID}?co=${a}&month=${O}`);v(ie.rows);const Ae={};ie.rows.forEach(Se=>{Ae[Se.sim_employee_id]=Se.admin_remarks||""}),le(Ae)}catch{se.error("Failed to load invoice grid")}finally{X(!1)}},[a]);',
    new: 'Te=b.useCallback(async O=>{X(!0);try{const{data:ie}=await De.get(`${ze.INVOICES_GRID}?co=${a}&month=${O}`);v(ie.rows);const Ae={};ie.rows.forEach(Se=>{Ae[Se.sim_employee_id]=Se.admin_remarks||""}),le(Ae),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}catch{se.error("Failed to load invoice grid")}finally{X(!1)}},[a]);',
  },
  {
    name: 'dispatch refresh after bulk send approval',
    old: 'Se&&se.error(Se)}}catch(ie){se.error(Eo(ie))}finally{Z(!1)}},Ye=b.useCallback(async(O,ie)=>{',
    new: 'Se&&se.error(Se)}}catch(ie){se.error(Eo(ie))}finally{Z(!1),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))}},Ye=b.useCallback(async(O,ie)=>{',
  },
  {
    name: 'panel resend/recovery use silent refresh',
    old: '_(null),N(),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))',
    new: '_(null),N(!0),window.dispatchEvent(new Event("ebilling:approval-queue-refresh"))',
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
if (index.includes('v=20260612f')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260612f', 'index-DGxZ6d5S.js?v=20260612g')
      .replace('ebilling-shell.css?v=10', 'ebilling-shell.css?v=11'),
  );
  console.log('Bumped asset cache versions');
}

console.log('E-bill Approval auto-refresh patch applied');
