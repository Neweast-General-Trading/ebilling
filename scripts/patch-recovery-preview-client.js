const fs = require('fs');
const path = '/home/negt/RecTracking/client/dist/assets/index-DGxZ6d5S.js';
let s = fs.readFileSync(path, 'utf8');

const apiOld =
  'INVOICES_PUSH_RECOVERY:a=>`/invoices/${a}/push-recovery`,INVOICES_PUSH_RECOVERY_BULK:"/invoices/recovery/push-ready",INVOICES_RECOVERY_SENT:"/invoices/recovery/sent"';
const apiNew =
  'INVOICES_PUSH_RECOVERY:a=>`/invoices/${a}/push-recovery`,INVOICES_RECOVERY_PREVIEW:a=>`/invoices/${a}/recovery-preview`,INVOICES_PUSH_RECOVERY_BULK:"/invoices/recovery/push-ready",INVOICES_RECOVERY_SENT:"/invoices/recovery/sent"';
if (!s.includes(apiOld)) throw new Error('API routes anchor not found');
s = s.replace(apiOld, apiNew);

const modalComponent = `function yT({data:a,confirming:l,onClose:r,onConfirm:o}){const u=a.preview,f=u.matchStatus,p=f==="matched"?"border-emerald-200 bg-emerald-50 text-emerald-900":f==="partial"?"border-amber-200 bg-amber-50 text-amber-900":"border-rose-200 bg-rose-50 text-rose-900",m=O=>O==null||O===""?"—":String(O);return jf.createPortal(i.jsxs("div",{className:"fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4",children:[i.jsxs("div",{className:"max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border bg-white shadow-xl",children:[i.jsxs("div",{className:"flex items-start justify-between border-b px-5 py-4",children:[i.jsxs("div",{children:[i.jsx("h3",{className:"text-lg font-semibold text-slate-900",children:"Confirm Oracle recovery"}),i.jsxs("p",{className:"text-sm text-slate-500",children:[a.row.display_name||a.row.phone_number," · ",u.monthLabel]})]}),i.jsx(Me,{variant:"outline",size:"sm",onClick:r,children:i.jsx(Rf,{className:"size-4"})})]}),i.jsxs("div",{className:"space-y-4 px-5 py-4",children:[i.jsxs("div",{className:\`rounded-lg border px-4 py-3 text-sm \${p}\`,children:[i.jsx("p",{className:"font-semibold",children:u.matchSummary}),i.jsxs("p",{className:"mt-1 text-xs opacity-80",children:["Match status: ",u.matchStatus]})]}),i.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[i.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50 p-4",children:[i.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-slate-500",children:"SIM master"}),i.jsxs("dl",{className:"mt-3 space-y-2 text-sm",children:[i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-slate-500",children:"Person #"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.master.personNumber)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-slate-500",children:"Name"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.master.displayName)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-slate-500",children:"Phone"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.master.phoneNumber)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-slate-500",children:"Email"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.master.email)})]})]})]}),i.jsxs("div",{className:"rounded-lg border border-violet-200 bg-violet-50/60 p-4",children:[i.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-violet-700",children:"Oracle HCM"}),u.oracle?i.jsxs("dl",{className:"mt-3 space-y-2 text-sm",children:[i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-violet-700/80",children:"Person #"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.oracle.personNumber)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-violet-700/80",children:"Name"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.oracle.displayName)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-violet-700/80",children:"Email"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.oracle.email)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-violet-700/80",children:"Department"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.oracle.departmentName)})]}),i.jsxs("div",{className:"flex justify-between gap-3",children:[i.jsx("dt",{className:"text-violet-700/80",children:"Job"}),i.jsx("dd",{className:"font-medium text-slate-900",children:m(u.oracle.jobName)})]})]}):i.jsx("p",{className:"mt-3 text-sm text-rose-700",children:"Employee not found in Oracle."})]})]}),i.jsxs("div",{className:"rounded-lg border border-slate-200",children:[i.jsx("div",{className:"border-b bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500",children:"Identifier checks"}),i.jsx("div",{className:"divide-y",children:u.checks.map((O,ie)=>i.jsxs("div",{className:"grid gap-2 px-4 py-3 text-sm md:grid-cols-[140px_1fr_1fr_auto]",children:[i.jsx("p",{className:"font-medium text-slate-700",children:O.label}),i.jsxs("p",{className:"text-slate-600",children:["Master: ",m(O.master)]}),i.jsxs("p",{className:"text-slate-600",children:["Oracle: ",m(O.oracle)]}),i.jsx("span",{className:\`inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold \${O.ok?"bg-emerald-100 text-emerald-800":"bg-rose-100 text-rose-800"}\`,children:O.ok?"Match":"Mismatch"})]},ie))})]}),i.jsxs("div",{className:"rounded-lg border border-emerald-200 bg-emerald-50/70 p-4",children:[i.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-emerald-800",children:"Planned deduction"}),i.jsxs("div",{className:"mt-3 grid gap-3 text-sm md:grid-cols-2",children:[i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Amount: "}),i.jsxs("span",{className:"text-lg font-semibold text-emerald-900",children:["AED ",Li(u.amount)]})]}),i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Element: "}),i.jsx("span",{className:"font-medium",children:m(u.deduction.elementName)})]}),i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Action: "}),i.jsx("span",{className:"font-medium",children:u.deduction.plannedAction==="update"?"Update existing entry":"Create new entry"})]}),i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Existing amount: "}),i.jsx("span",{className:"font-medium",children:u.deduction.existingAmount==null?"—":\`AED \${Li(u.deduction.existingAmount)}\`})]}),i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Source: "}),i.jsx("span",{className:"font-medium",children:m(u.deduction.resolveSource)})]}),i.jsxs("p",{children:[i.jsx("span",{className:"text-slate-500",children:"Environment: "}),i.jsx("span",{className:"font-medium",children:m(u.deduction.environment)})]})]})]}),u.warnings?.length?i.jsxs("div",{className:"rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",children:[i.jsx("p",{className:"font-semibold",children:"Warnings"}),i.jsx("ul",{className:"mt-2 list-disc space-y-1 pl-5",children:u.warnings.map((O,ie)=>i.jsx("li",{children:O},ie))})]}):null,u.errors?.length?i.jsxs("div",{className:"rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900",children:[i.jsx("p",{className:"font-semibold",children:"Blocking issues"}),i.jsx("ul",{className:"mt-2 list-disc space-y-1 pl-5",children:u.errors.map((O,ie)=>i.jsx("li",{children:O},ie))})]}):null]}),i.jsxs("div",{className:"flex flex-wrap justify-end gap-2 border-t px-5 py-4",children:[i.jsx(Me,{variant:"outline",onClick:r,disabled:l,children:"Cancel"}),i.jsxs(Me,{onClick:o,disabled:!u.canSend||l,className:"bg-emerald-700 hover:bg-emerald-800",children:[l?i.jsx(Kt,{className:"size-4 animate-spin"}):i.jsx(Dd,{className:"size-4"}),"Confirm & send to Oracle"]})]})]})]}),document.body)}`;

const gTAnchor = 'function gT(){const a=ka()';
if (!s.includes(gTAnchor)) throw new Error('gT anchor not found');
s = s.replace(gTAnchor, modalComponent.replace('function yT(', 'function Ecg(') + gTAnchor);

const stateOld = '[R,Z]=b.useState(!1),[fe,xe]=b.useState(null),[J,w]=b.useState([])';
const stateNew =
  '[R,Z]=b.useState(!1),[fe,xe]=b.useState(null),[kr,Mr]=b.useState(null),[Fr,Br]=b.useState(null),[J,w]=b.useState([])';
if (!s.includes(stateOld)) throw new Error('gT state anchor not found');
s = s.replace(stateOld, stateNew);

const ueOld =
  'ue=async O=>{if(!ev(O,l)){O.person_number?.trim()?se.error("This invoice cannot be sent for recovery"):se.error("Employee person number is missing in SIM master");return}xe(O.invoice_id);try{const{data:ie}=await De.post(`${ze.INVOICES_PUSH_RECOVERY(O.invoice_id)}?co=${a}`,{},{timeout:12e4});se.success(`Recovery sent to Oracle (${O.person_number}, AED ${rl(O.personal_usage)})`),ie.row?v(Ae=>Ae.map(Se=>Se.invoice_id===O.invoice_id?ie.row:Se)):f&&await Te(f)}catch(ie){se.error(Eo(ie))}finally{xe(null)}},';
const ueNew =
  'mt=async O=>{if(!ev(O,l)){O.person_number?.trim()?se.error("This invoice cannot be sent for recovery"):se.error("Employee person number is missing in SIM master");return}Br(O.invoice_id);try{const{data:ie}=await De.get(`${ze.INVOICES_RECOVERY_PREVIEW(O.invoice_id)}?co=${a}`,{timeout:12e4});Mr({row:O,preview:ie})}catch(ie){se.error(Eo(ie))}finally{Br(null)}},yt=async()=>{if(!kr?.preview?.canSend)return;const O=kr.row;xe(O.invoice_id);try{const{data:ie}=await De.post(`${ze.INVOICES_PUSH_RECOVERY(O.invoice_id)}?co=${a}`,{},{timeout:12e4});se.success(`Recovery sent to Oracle (${O.person_number}, AED ${rl(O.personal_usage)})`),Mr(null),ie.row?v(Ae=>Ae.map(Se=>Se.invoice_id===O.invoice_id?ie.row:Se)):f&&await Te(f)}catch(ie){se.error(Eo(ie))}finally{xe(null)}},';
if (!s.includes(ueOld)) throw new Error('ue handler anchor not found');
s = s.replace(ueOld, ueNew);

const btnOld = 'disabled:fe===O.invoice_id,onClick:()=>ue(O),className:"h-8 whitespace-nowrap border-emerald-300';
const btnNew =
  'disabled:fe===O.invoice_id||Fr===O.invoice_id,onClick:()=>mt(O),className:"h-8 whitespace-nowrap border-emerald-300';
if (!s.includes(btnOld)) throw new Error('Send recovery button anchor not found');
s = s.replace(btnOld, btnNew);

const spinOld =
  'children:[fe===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]';
const spinNew =
  'children:[fe===O.invoice_id||Fr===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery"]';
if (!s.includes(spinOld)) throw new Error('Send recovery spinner anchor not found');
s = s.replace(spinOld, spinNew);

const modalRenderAnchor = 'ce?i.jsx(fT,{prompt:ce,onRegistered:()=>Ie("registered"),onArchived:()=>Ie("archived")}):null]})}const vT=';
if (!s.includes(modalRenderAnchor)) throw new Error('gT modal render anchor not found');
s = s.replace(
  modalRenderAnchor,
  'ce?i.jsx(fT,{prompt:ce,onRegistered:()=>Ie("registered"),onArchived:()=>Ie("archived")}):null,kr?i.jsx(Ecg,{data:kr,confirming:!!fe,onClose:()=>Mr(null),onConfirm:()=>void yt()}):null]})}const vT=',
);

const vtTitleOld = 'children:"Recovery sent log"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Invoices pushed from Ready for recovery to Oracle HCM (production)."})';
const vtTitleNew =
  'children:"Recovery report"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Pending, sent, and failed Oracle recovery attempts with employee matching status."})';
if (!s.includes(vtTitleOld)) throw new Error('VT title anchor not found');
s = s.replace(vtTitleOld, vtTitleNew);

const vtCardsOld =
  'i.jsx(Id,{title:"Total sent",value:o.totalCount,subtitle:"Invoices with recovery_sent status"}),i.jsx(Id,{title:"Total recovery AED",value:ov(o.totalAmount),subtitle:"Sum of personal_usage sent"}),i.jsx(Id,{title:"Oracle target",value:"Production",subtitle:"Live payroll elementEntries"})';
const vtCardsNew =
  'i.jsx(Id,{title:"Pending",value:o.pendingCount??0,subtitle:"Ready for recovery, not sent yet"}),i.jsx(Id,{title:"Sent",value:o.sentCount??0,subtitle:"Successfully pushed to Oracle"}),i.jsx(Id,{title:"Failed",value:o.failedCount??0,subtitle:"Last Oracle push attempt failed"})';
if (!s.includes(vtCardsOld)) throw new Error('VT cards anchor not found');
s = s.replace(vtCardsOld, vtCardsNew);

const vtTableTitleOld = 'children:"Sent recoveries"}),i.jsxs("p",{className:"text-xs text-slate-500",children:[f," record"';
const vtTableTitleNew = 'children:"Recovery records"}),i.jsxs("p",{className:"text-xs text-slate-500",children:[f," record"';
if (!s.includes(vtTableTitleOld)) throw new Error('VT table title anchor not found');
s = s.replace(vtTableTitleOld, vtTableTitleNew);

const vtHeaderOld =
  'children:"Month"}),i.jsx("th",{className:"px-3 py-3",children:"Recovery AED"}),i.jsx("th",{className:"px-3 py-3",children:"Sent at"}),i.jsx("th",{className:"px-3 py-3",children:"Oracle"}),i.jsx("th",{className:"px-3 py-3"})]})}),i.jsx("tbody",{children:l.map(L=>{const P=X===L.invoice_id;';
const vtHeaderNew =
  'children:"Month"}),i.jsx("th",{className:"px-3 py-3",children:"Recovery AED"}),i.jsx("th",{className:"px-3 py-3",children:"Status"}),i.jsx("th",{className:"px-3 py-3",children:"Sent at"}),i.jsx("th",{className:"px-3 py-3",children:"Oracle"}),i.jsx("th",{className:"px-3 py-3"})]})}),i.jsx("tbody",{children:l.map(L=>{const P=X===L.invoice_id;';
if (!s.includes(vtHeaderOld)) throw new Error('VT header anchor not found');
s = s.replace(vtHeaderOld, vtHeaderNew);

const vtStatusHelper = 'function YT(a){if(!a)return"—";const l=new Date(a);return Number.isNaN(l.getTime())?a:Ji(l,"dd MMM yyyy HH:mm:ss")}function Id(';
const vtStatusFn =
  'function YT(a){if(!a)return"—";const l=new Date(a);return Number.isNaN(l.getTime())?a:Ji(l,"dd MMM yyyy HH:mm:ss")}function Rcg(a){return a==="sent"?"Sent":a==="failed"?"Failed":"Pending"}function Scg(a){return a==="sent"?"bg-violet-100 text-violet-800":a==="failed"?"bg-rose-100 text-rose-800":"bg-amber-100 text-amber-800"}function Id(';
if (!s.includes(vtStatusHelper)) throw new Error('YT helper anchor not found');
s = s.replace(vtStatusHelper, vtStatusFn);

const vtRowAnchor =
  'children:ov(L.personal_usage)}),i.jsx("td",{className:"px-3 py-3 align-top text-xs",children:YT(L.recovery_sent_at)}),i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsxs("div",{className:"space-y-1 text-xs",children:[i.jsx("p",{children:i.jsx("span",{className:"rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800",children:L.oracle_action||"—"})})';
if (!s.includes(vtRowAnchor)) throw new Error('VT row anchor not found');
s = s.replace(
  vtRowAnchor,
  'children:ov(L.personal_usage)}),i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsxs("div",{className:"space-y-1",children:[i.jsx("span",{className:\`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold \${Scg(L.status)}\`,children:Rcg(L.status)}),L.status==="failed"&&L.recovery_last_error?i.jsx("p",{className:"text-xs text-rose-700",children:L.recovery_last_error}):null]})}),i.jsx("td",{className:"px-3 py-3 align-top text-xs",children:YT(L.recovery_sent_at)}),i.jsx("td",{className:"px-3 py-3 align-top",children:i.jsxs("div",{className:"space-y-1 text-xs",children:[i.jsx("p",{children:i.jsx("span",{className:"rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800",children:L.oracle_action||"—"})})',
);

const vtColSpanOld = 'colSpan:8,className:"px-4 py-4"';
const vtColSpanNew = 'colSpan:9,className:"px-4 py-4"';
if (!s.includes(vtColSpanOld)) throw new Error('VT colspan anchor not found');
s = s.replace(vtColSpanOld, vtColSpanNew);

const vtCsvOld =
  'Os(`recovery-sent-${a}-${new Date().toISOString().slice(0,10)}.csv`,["Invoice ID","Month","Employee","Person Number","Phone","Recovery AED","Sent At","Oracle Action","Oracle Element","Oracle Source","Environment","Invoice Code"],l.map(L=>[L.invoice_id,L.month_label,L.display_name,L.person_number,L.phone_number,L.personal_usage,L.recovery_sent_at,L.oracle_action,L.oracle_element_name,L.oracle_source,L.oracle_environment,L.invoice_code])),se.success(`Exported ${l.length} recovery record(s)`)';
const vtCsvNew =
  'Os(`recovery-report-${a}-${new Date().toISOString().slice(0,10)}.csv`,["Invoice ID","Month","Employee","Person Number","Phone","Recovery AED","Status","Sent At","Last Attempt","Error","Oracle Action","Oracle Element","Oracle Source","Environment","Invoice Code"],l.map(L=>[L.invoice_id,L.month_label,L.display_name,L.person_number,L.phone_number,L.personal_usage,Rcg(L.status),L.recovery_sent_at,L.recovery_last_attempt_at,L.recovery_last_error,L.oracle_action,L.oracle_element_name,L.oracle_source,L.oracle_environment,L.invoice_code])),se.success(`Exported ${l.length} recovery record(s)`)';
if (!s.includes(vtCsvOld)) throw new Error('VT CSV anchor not found');
s = s.replace(vtCsvOld, vtCsvNew);

const vtSummaryOld = '[o,u]=b.useState({totalCount:0,totalAmount:0})';
const vtSummaryNew = '[o,u]=b.useState({totalCount:0,totalAmount:0,pendingCount:0,sentCount:0,failedCount:0})';
if (!s.includes(vtSummaryOld)) throw new Error('VT summary state anchor not found');
s = s.replace(vtSummaryOld, vtSummaryNew);

fs.writeFileSync(path, s);
console.log('Client bundle patched successfully');
