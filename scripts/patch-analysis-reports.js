#!/usr/bin/env node
/** Analysis hub: Excel reports + period export + SIM master no_auto_mail + open internal-audit to analysis permission. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'excel download helper',
    old: 'function qT(){const a=ka()',
    new: 'async function ebDlXlsx(a,l){const r=await De.get(a,{responseType:"arraybuffer"}),o=new Blob([r.data],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),u=window.URL.createObjectURL(o),f=document.createElement("a");f.href=u,f.download=l,f.click(),window.URL.revokeObjectURL(u)}function qT(){const a=ka()',
  },
  {
    name: 'analysis API routes',
    old: 'INTERNAL_AUDIT_TOP_PAIRS:"/internal-audit/top-pairs",AUDIT_LOG_OVERVIEW',
    new: 'INTERNAL_AUDIT_TOP_PAIRS:"/internal-audit/top-pairs",ANALYSIS_REPORTS_CATALOG:"/analysis-reports/catalog",ANALYSIS_REPORTS_MONTHS:"/analysis-reports/months",ANALYSIS_REPORTS_EXPORT_PERIOD:"/analysis-reports/export/period",ANALYSIS_REPORTS_EXPORT_MONTHLY:"/analysis-reports/export/monthly-invoices",ANALYSIS_REPORTS_EXPORT_MASTER:"/analysis-reports/export/master",AUDIT_LOG_OVERVIEW',
  },
  {
    name: 'analysis page title',
    old: 'children:"Call Analysis"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Extract call lines from uploaded e& invoices, review dialed numbers and durations, and identify internal New East traffic versus external calls."})',
    new: 'children:"Analysis & Reports"}),i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:"Download billing and master reports as Excel, run period summaries, and review invoice call details."})',
  },
  {
    name: 'analysis default tab + report state',
    old: '[l,r]=b.useState("analysis"),[o,u]=b.useState("")',
    new: '[l,r]=b.useState("reports"),[EbRf,EbRt]=b.useState(""),[EbRm,EbRn]=b.useState(""),[EbRmts,EbRml]=b.useState([]),[EbRx,EbRy]=b.useState(!1),[o,u]=b.useState("")',
  },
  {
    name: 'load report months effect',
    old: 'b.useEffect(()=>{ut()},[ut]),b.useEffect(()=>{l==="invoices"&&it()},[l,it])',
    new: 'b.useEffect(()=>{ut()},[ut]),b.useEffect(()=>{l!=="reports"||!a||EbRmts.length||(async()=>{try{const{data:ne}=await De.get(`${ze.ANALYSIS_REPORTS_MONTHS}?co=${a}`);EbRml(ne||[]),ne?.length&&!EbRf&&(EbRt(ne[ne.length-1]),EbRn(ne[0]))}catch{se.error("Could not load report months")}})()},[l,a,EbRmts.length,EbRf]),b.useEffect(()=>{l==="invoices"&&it()},[l,it])',
  },
  {
    name: 'analysis tabs + reports panel',
    old: 'i.jsxs("div",{className:"flex flex-wrap gap-2",children:[i.jsx(av,{active:l==="invoices",onClick:()=>r("invoices"),children:"Invoice Calls"}),i.jsx(av,{active:l==="analysis",onClick:()=>r("analysis"),children:"Call Analysis"})]}),l==="invoices"?',
    new: 'i.jsxs("div",{className:"flex flex-wrap gap-2",children:[i.jsx(av,{active:l==="reports",onClick:()=>r("reports"),children:"Reports & Excel"}),i.jsx(av,{active:l==="invoices",onClick:()=>r("invoices"),children:"Invoice Calls"}),i.jsx(av,{active:l==="analysis",onClick:()=>r("analysis"),children:"Call Analysis"})]}),l==="reports"?i.jsxs("div",{className:"grid gap-4 xl:grid-cols-2",children:[i.jsxs(Je,{className:"border-teal-100 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsxs("div",{children:[i.jsx(jt,{className:"text-base",children:"Billing report by period"}),i.jsx("p",{className:"mt-1 text-xs text-slate-500",children:"id · code · name · package · additr · total · bill · excess · personal · official · emp remarks · hr remarks"})]})}),i.jsxs(We,{className:"space-y-4",children:[i.jsxs("div",{className:"grid gap-3 sm:grid-cols-2",children:[i.jsxs("label",{className:"space-y-1 text-sm",children:[i.jsx("span",{className:"font-medium text-slate-700",children:"From month"}),i.jsx("select",{className:"h-10 w-full rounded-md border bg-white px-3 text-sm",value:EbRf,onChange:ne=>EbRt(ne.target.value),children:EbRmts.map(ne=>i.jsx("option",{value:ne,children:ne},`f-${ne}`))})]}),i.jsxs("label",{className:"space-y-1 text-sm",children:[i.jsx("span",{className:"font-medium text-slate-700",children:"To month"}),i.jsx("select",{className:"h-10 w-full rounded-md border bg-white px-3 text-sm",value:EbRm,onChange:ne=>EbRn(ne.target.value),children:EbRmts.map(ne=>i.jsx("option",{value:ne,children:ne},`t-${ne}`))})]})]}),i.jsx(Me,{disabled:!EbRf||!EbRm||EbRx||!EbRmts.length,onClick:async()=>{if(!EbRf||!EbRm)return;EbRy(!0);try{await ebDlXlsx(`${ze.ANALYSIS_REPORTS_EXPORT_PERIOD}?co=${a}&monthFrom=${EbRf}&monthTo=${EbRm}`,`ebilling-period-${EbRf}_to_${EbRm}.xlsx`),se.success("Period report downloaded")}catch{se.error("Could not download period report")}finally{EbRy(!1)}},children:EbRx?"Downloading…":"Download Excel"})]})]}),i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Other Excel exports"})}),i.jsxs(We,{className:"space-y-3",children:[i.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3",children:[i.jsxs("div",{children:[i.jsx("p",{className:"text-sm font-medium text-slate-900",children:"Monthly invoice grid"}),i.jsx("p",{className:"text-xs text-slate-500",children:"All uploaded invoices for the selected billing month"})]}),i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx("select",{className:"h-9 rounded-md border bg-white px-2 text-sm",value:o,onChange:ne=>u(ne.target.value),children:(f?.months||EbRmts).map(ne=>i.jsx("option",{value:ne,children:ne},`m-${ne}`))}),i.jsx(Me,{variant:"outline",size:"sm",disabled:!o,onClick:async()=>{try{await ebDlXlsx(`${ze.ANALYSIS_REPORTS_EXPORT_MONTHLY}?co=${a}&month=${o}`,`ebilling-invoices-${o}.xlsx`),se.success("Monthly invoices downloaded")}catch{se.error("Download failed")}},children:"Excel"})]})]}),i.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3",children:[i.jsxs("div",{children:[i.jsx("p",{className:"text-sm font-medium text-slate-900",children:"SIM master"}),i.jsx("p",{className:"text-xs text-slate-500",children:"Employees, limits, emails, and no-auto-mail flags"})]}),i.jsx(Me,{variant:"outline",size:"sm",onClick:async()=>{try{await ebDlXlsx(`${ze.ANALYSIS_REPORTS_EXPORT_MASTER}?co=${a}`,`ebilling-master-${a}.xlsx`),se.success("SIM master downloaded")}catch{se.error("Download failed")}},children:"Download Excel"})]})]})]})]}):l==="invoices"?',
  },
  {
    name: 'sim master no auto mail column header',
    old: 'i.jsx("th",{className:"p-2 text-right",children:"Total"}),i.jsx("th",{className:"w-[92px] min-w-[92px] p-2",children:"Actions"})',
    new: 'i.jsx("th",{className:"p-2 text-right",children:"Total"}),i.jsx("th",{className:"p-2 text-center",children:"No auto mail"}),i.jsx("th",{className:"w-[92px] min-w-[92px] p-2",children:"Actions"})',
  },
  {
    name: 'sim master no auto mail cell',
    old: 'i.jsx("td",{className:"p-2 text-right font-medium",children:wo(ae.total_amount)}),i.jsx("td",{className:"w-[92px] min-w-[92px] p-2 align-middle",children:i.jsxs("div",{className:"flex w-[84px] flex-col gap-1",children:[!Te&&i.jsxs(i.Fragment,{children:[i.jsx(Me,{variant:"outline",size:"sm",className:"h-8 w-full border-sky-200 bg-sky-50/90 px-2 text-xs font-medium text-sky-800 shadow-none hover:bg-sky-100",onClick:()=>Ce(ae),children:"Edit"})',
    new: 'i.jsx("td",{className:"p-2 text-right font-medium",children:wo(ae.total_amount)}),i.jsx("td",{className:"p-2 text-center",children:i.jsx("input",{type:"checkbox",checked:!!ae.no_auto_mail,disabled:Te,title:"Skip automatic email when invoice is uploaded; manual send still available",onChange:async ne=>{try{await De.patch(`${ze.SIM_MASTER}/${ae.id}?co=${a}`,{noAutoMail:ne.target.checked}),o(Xe=>Xe.map(ht=>ht.id===ae.id?{...ht,no_auto_mail:ne.target.checked}:ht)),se.success(ne.target.checked?"No auto mail enabled":"Auto mail restored")}catch{se.error("Could not update no auto mail")}}})}),i.jsx("td",{className:"w-[92px] min-w-[92px] p-2 align-middle",children:i.jsxs("div",{className:"flex w-[84px] flex-col gap-1",children:[!Te&&i.jsxs(i.Fragment,{children:[i.jsx(Me,{variant:"outline",size:"sm",className:"h-8 w-full border-sky-200 bg-sky-50/90 px-2 text-xs font-medium text-sky-800 shadow-none hover:bg-sky-100",onClick:()=>Ce(ae),children:"Edit"})',
  },
  {
    name: 'sim master edit modal no auto mail',
    old: 'function eT({employee:a,onClose:l,onSaved:r}){const o=ka(),[u,f]=b.useState(a.phone_number),[p,m]=b.useState(String(a.package_value??0)),[v,x]=b.useState(String(a.additional_amount??0)),[y,g]=b.useState(!1)',
    new: 'function eT({employee:a,onClose:l,onSaved:r}){const o=ka(),[u,f]=b.useState(a.phone_number),[p,m]=b.useState(String(a.package_value??0)),[v,x]=b.useState(String(a.additional_amount??0)),[EbNam,ebSetNam]=b.useState(!!a.no_auto_mail),[y,g]=b.useState(!1)',
  },
  {
    name: 'sim master edit save no auto mail',
    old: 'await De.patch(`${ze.SIM_MASTER}/${a.id}?co=${o}`,{phoneNumber:u,packageLimit:Number(p)||0,additionalAmount:Number(v)||0}),se.success("Employee updated")',
    new: 'await De.patch(`${ze.SIM_MASTER}/${a.id}?co=${o}`,{phoneNumber:u,packageLimit:Number(p)||0,additionalAmount:Number(v)||0,noAutoMail:EbNam}),se.success("Employee updated")',
  },
  {
    name: 'sim master edit modal checkbox',
    old: 'i.jsxs("label",{className:"block space-y-1 text-sm",children:[i.jsx("span",{children:"ADDT\'L"}),i.jsx("input",{type:"number",min:0,step:"0.01",className:"w-full rounded-md border bg-background px-3 py-2",value:v,onChange:S=>x(S.target.value)})]}),i.jsxs("div",{className:"rounded-md bg-muted/50 p-3 text-sm",children:[i.jsxs("p",{children:["VAT 5%: ",A.vat.toFixed(2)]}),i.jsxs("p",{className:"font-medium",children:["Total: ",A.total.toFixed(2)]})]}),i.jsx(Mf,{conflicts:_})',
    new: 'i.jsxs("label",{className:"block space-y-1 text-sm",children:[i.jsx("span",{children:"ADDT\'L"}),i.jsx("input",{type:"number",min:0,step:"0.01",className:"w-full rounded-md border bg-background px-3 py-2",value:v,onChange:S=>x(S.target.value)})]}),i.jsxs("label",{className:"flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm",children:[i.jsx("input",{type:"checkbox",checked:EbNam,onChange:S=>ebSetNam(S.target.checked),className:"mt-0.5"}),i.jsxs("span",{children:[i.jsx("span",{className:"font-medium text-amber-900",children:"No auto mail"}),i.jsx("span",{className:"block text-xs text-amber-800/90",children:"Do not send invoice email automatically on upload. You can still send manually from the invoice grid."})]})]}),i.jsxs("div",{className:"rounded-md bg-muted/50 p-3 text-sm",children:[i.jsxs("p",{children:["VAT 5%: ",A.vat.toFixed(2)]}),i.jsxs("p",{className:"font-medium",children:["Total: ",A.total.toFixed(2)]})]}),i.jsx(Mf,{conflicts:_})',
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

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.eb-analysis-report-card')) {
  css += `
.eb-analysis-report-card { border-color: rgba(13, 148, 136, 0.18); }
`;
  fs.writeFileSync(cssPath, css);
  console.log('Added analysis CSS hook');
}

const index = fs.readFileSync(indexPath, 'utf8');
if (index.includes('v=20260612l')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260612l', 'index-DGxZ6d5S.js?v=20260613a')
      .replace('ebilling-shell.css?v=16', 'ebilling-shell.css?v=17'),
  );
  console.log('Bumped cache versions');
}

console.log('Analysis reports patch complete');
