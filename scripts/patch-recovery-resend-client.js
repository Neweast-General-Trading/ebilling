const fs = require('fs');
const path = '/home/negt/RecTracking/client/dist/assets/index-DGxZ6d5S.js';
let s = fs.readFileSync(path, 'utf8');

const evOld =
  'function ev(a,l){return l&&a.approval_status==="ready_for_recovery"&&(a.personal_usage??0)>0&&!!a.person_number?.trim()}';
const evNew =
  'function ev(a,l){return l&&(a.approval_status==="ready_for_recovery"||a.approval_status==="recovery_sent")&&(a.personal_usage??0)>0&&!!a.person_number?.trim()}';
if (!s.includes(evOld)) throw new Error('ev() anchor not found');
s = s.replace(evOld, evNew);

const sentUiOld =
  ':O.approval_status==="recovery_sent"?i.jsx("span",{className:"text-xs font-semibold text-violet-700",children:"Recovery sent"}):';
const sentUiNew =
  ':O.approval_status==="recovery_sent"?ev(O,l)?i.jsxs(Me,{variant:"outline",size:"sm",disabled:fe===O.invoice_id||Fr===O.invoice_id,onClick:()=>mt(O),className:"h-8 whitespace-nowrap border-violet-300 text-xs text-violet-800 hover:bg-violet-50",children:[fe===O.invoice_id||Fr===O.invoice_id?i.jsx(Kt,{className:"size-3.5 animate-spin"}):i.jsx(Dd,{className:"size-3.5"}),"Send recovery again"]}):i.jsx("span",{className:"text-xs font-semibold text-violet-700",children:"Recovery sent"}):';
if (!s.includes(sentUiOld)) throw new Error('recovery_sent UI anchor not found');
s = s.replace(sentUiOld, sentUiNew);

const modalOld =
  'children:[i.jsx("p",{className:"font-semibold",children:u.matchSummary}),i.jsxs("p",{className:"mt-1 text-xs opacity-80",children:["Match status: ",u.matchStatus]})]}),i.jsxs("div",{className:"grid gap-4 md:grid-cols-2"';
const modalNew =
  'children:[i.jsx("p",{className:"font-semibold",children:u.matchSummary}),i.jsxs("p",{className:"mt-1 text-xs opacity-80",children:["Match status: ",u.matchStatus]})]}),u.isResend?i.jsxs("div",{className:"rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900",children:[i.jsx("p",{className:"font-semibold",children:"Re-send recovery"}),i.jsxs("p",{className:"mt-1",children:["This invoice was already sent to Oracle",u.previousSentAt?` on ${Kg(u.previousSentAt)}`:"",". Confirming will push the deduction amount again."]})]}):null,i.jsxs("div",{className:"grid gap-4 md:grid-cols-2"';
if (!s.includes(modalOld)) throw new Error('yT resend banner anchor not found');
s = s.replace(modalOld, modalNew);

const confirmOld = '"Confirm & send to Oracle"]})]})]})]}),document.body)}';
const confirmNew =
  'u.isResend?"Confirm & re-send to Oracle":"Confirm & send to Oracle"]})]})]})]}),document.body)}';
if (!s.includes(confirmOld)) throw new Error('yT confirm label anchor not found');
s = s.replace(confirmOld, confirmNew);

fs.writeFileSync(path, s);
console.log('Recovery re-send client patch applied');
