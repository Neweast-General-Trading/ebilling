#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');

const cellStart = s.indexOf('function EbOracleDeductionCell({status:e})');
const cellEnd = s.indexOf('function EbApprovalRequestPage()', cellStart);
if (cellStart < 0 || cellEnd < 0) throw new Error('EbOracleDeductionCell anchor missing');

const cellNew =
  'function EbOracleDeductionCell({status:e}){if(!e||e.loading)return i.jsx(Kt,{className:"mx-auto size-4 animate-spin text-slate-400",title:"Checking Oracle\\u2026"});if(e.applicable===!1)return i.jsx("span",{className:"text-xs text-slate-300",title:"No excess on this invoice",children:"\\u2014"});if(e.present){const l=e.elementName?`Other Deduction present (${e.elementName}${e.existingAmount!=null?` \\xB7 AED ${Number(e.existingAmount).toFixed(2)}`:""})`:"Other Deduction present in Oracle",a=e.needsRecovery===!1?l+" \\u2014 invoice has no personal recovery amount":l;return i.jsx(Dd,{className:"mx-auto size-5 text-emerald-600",title:a})}const o=e.needsRecovery===!1?(e.error||"Other Deduction not set up in Oracle")+" \\u2014 invoice has no personal recovery amount":e.error||"Other Deduction not set up in Oracle";return i.jsx(Rf,{className:"mx-auto size-5 text-red-600",title:o})}';

s = s.slice(0, cellStart) + cellNew + s.slice(cellEnd);

const filtOld = '.filter(d=>Number(d.personalUsage)>0).map(d=>d.invoiceId)';
const filtNew = '.filter(d=>Number(d.personalUsage)>0||Number(d.excess)>0).map(d=>d.invoiceId)';
if (s.includes(filtOld)) {
  s = s.replace(filtOld, filtNew);
  console.log('updated approval queue OD filter');
}

fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-od-excess-check: applied');
