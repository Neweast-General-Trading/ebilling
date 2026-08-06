/**
 * Renames recovery patch variables in gT() that conflict with minified UI symbols (mt, yt, yT, etc.)
 */
const fs = require('fs');
const path = '/home/negt/RecTracking/client/dist/assets/index-DGxZ6d5S.js';
let s = fs.readFileSync(path, 'utf8');

const reps = [
  ['function yT({data:a,confirming:l', 'function Ecg({data:a,confirming:l'],
  ['[kr,Mr]=b.useState(null),[Fr,Br]=b.useState(null)', '[Hcg,Icg]=b.useState(null),[Jcg,Kcg]=b.useState(null)'],
  ['mt=async O=>{if(!ev(O,l))', 'Dcg=async O=>{if(!ev(O,l))'],
  [
    'Br(O.invoice_id);try{const{data:ie}=await De.get(`${ze.INVOICES_RECOVERY_PREVIEW(O.invoice_id)}?co=${a}`,{timeout:12e4});Mr({row:O,preview:ie})}catch(ie){se.error(Eo(ie))}finally{Br(null)}},yt=async()=>{if(!kr?.preview?.canSend)return;const O=kr.row;xe(O.invoice_id);try{const{data:ie}=await De.post(`${ze.INVOICES_PUSH_RECOVERY(O.invoice_id)}?co=${a}`,{},{timeout:12e4});se.success(`Recovery sent to Oracle (${O.person_number}, AED ${rl(O.personal_usage)})`),Mr(null),ie.row?v(Ae=>Ae.map(Se=>Se.invoice_id===O.invoice_id?ie.row:Se)):f&&await Te(f)}catch(ie){se.error(Eo(ie))}finally{xe(null)}},',
    'Kcg(O.invoice_id);try{const{data:ie}=await De.get(`${ze.INVOICES_RECOVERY_PREVIEW(O.invoice_id)}?co=${a}`,{timeout:12e4});Icg({row:O,preview:ie})}catch(ie){se.error(Eo(ie))}finally{Kcg(null)}},Fcg=async()=>{if(!Hcg?.preview?.canSend)return;const O=Hcg.row;xe(O.invoice_id);try{const{data:ie}=await De.post(`${ze.INVOICES_PUSH_RECOVERY(O.invoice_id)}?co=${a}`,{},{timeout:12e4});se.success(`Recovery sent to Oracle (${O.person_number}, AED ${rl(O.personal_usage)})`),Icg(null),ie.row?v(Ae=>Ae.map(Se=>Se.invoice_id===O.invoice_id?ie.row:Se)):f&&await Te(f)}catch(ie){se.error(Eo(ie))}finally{xe(null)}},',
  ],
  ['disabled:fe===O.invoice_id||Fr===O.invoice_id,onClick:()=>mt(O)', 'disabled:fe===O.invoice_id||Jcg===O.invoice_id,onClick:()=>Dcg(O)'],
  ['fe===O.invoice_id||Fr===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery again"]}):i.jsx("span",{className:"text-xs font-semibold text-violet-700",children:"Recovery sent"}):',
    'fe===O.invoice_id||Jcg===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery again"]}):i.jsx("span",{className:"text-xs font-semibold text-violet-700",children:"Recovery sent"}):'],
  ['fe===O.invoice_id||Fr===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]}):i.jsx("span"',
    'fe===O.invoice_id||Jcg===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]}):i.jsx("span"'],
  ['kr?i.jsx(Ecg,{data:kr,confirming:!!fe,onClose:()=>Mr(null),onConfirm:()=>void yt()}):null', 'Hcg?i.jsx(Ecg,{data:Hcg,confirming:!!fe,onClose:()=>Icg(null),onConfirm:()=>void Fcg()}):null'],
  ['i.jsx(yT,{data:kr', 'i.jsx(Ecg,{data:Hcg'],
];

let changed = 0;
for (const [old, neu] of reps) {
  if (s.includes(old)) {
    s = s.replaceAll(old, neu);
    changed++;
  }
}

fs.writeFileSync(path, s);
require('child_process').execSync(`node --check ${path}`);
console.log(`Safe-name patch applied (${changed} replacements)`);
