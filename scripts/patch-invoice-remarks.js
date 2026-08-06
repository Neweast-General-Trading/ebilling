#!/usr/bin/env node
/** Split employee vs HR remarks in invoice grid and detail modal. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'load admin remarks into edit state',
    old: 'ie.rows.forEach(Se=>{Ae[Se.sim_employee_id]=Se.remarks||""})',
    new: 'ie.rows.forEach(Se=>{Ae[Se.sim_employee_id]=Se.admin_remarks||""})',
  },
  {
    name: 'save HR remarks separately',
    old: 'Dt=async O=>{const ie=q[O.sim_employee_id]??"";if(ie!==(O.remarks||""))try{await De.patch(`${ze.BILLING_REMARKS}?co=${a}`,{simEmployeeId:O.sim_employee_id,month:O.month,remarks:ie}),v(Ae=>Ae.map(Se=>Se.sim_employee_id===O.sim_employee_id?{...Se,remarks:ie}:Se)),se.success("Remarks saved")}catch{se.error("Could not save remarks")}}',
    new: 'Dt=async O=>{const ie=q[O.sim_employee_id]??"";if(ie!==(O.admin_remarks||""))try{const{data:pe}=await De.patch(`${ze.BILLING_REMARKS}?co=${a}`,{simEmployeeId:O.sim_employee_id,month:O.month,adminRemarks:ie});v(Ae=>Ae.map(Se=>Se.sim_employee_id===O.sim_employee_id?{...Se,admin_remarks:pe.admin_remarks,employee_remarks:pe.employee_remarks,remarks:pe.remarks}:Se)),se.success("HR remarks saved")}catch{se.error("Could not save remarks")}}',
  },
  {
    name: 'invoice grid remarks cell split',
    old: 'i.jsx("td",{className:"bg-sky-50/50 px-2 py-2 align-middle",children:i.jsx("textarea",{rows:1,"aria-label":`Remarks for ${O.display_name||O.phone_number}`,placeholder:"Add remark...",className:"h-9 min-h-9 w-full resize-none rounded-md border border-sky-300 bg-white px-2 py-2 text-sm leading-tight shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:resize-y",value:q[O.sim_employee_id]??"",onChange:Ae=>le(Se=>({...Se,[O.sim_employee_id]:Ae.target.value})),onBlur:()=>Dt(O)})})',
    new: 'i.jsx("td",{className:"bg-sky-50/50 px-2 py-2 align-middle",children:i.jsxs("div",{className:"space-y-1",children:[O.employee_remarks?i.jsx(EbEmployeeRemark,{text:O.employee_remarks}):null,i.jsx("textarea",{rows:1,"aria-label":`HR remarks for ${O.display_name||O.phone_number}`,placeholder:O.employee_remarks?"Add HR note…":"Add remark…",className:"h-9 min-h-9 w-full resize-none rounded-md border border-sky-300 bg-white px-2 py-2 text-sm leading-tight shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:resize-y",value:q[O.sim_employee_id]??"",onChange:Ae=>le(Se=>({...Se,[O.sim_employee_id]:Ae.target.value})),onBlur:()=>Dt(O)})]})})',
  },
  {
    name: 'invoice detail modal split remarks',
    old: 'i.jsx(fa,{label:"Remarks",value:a.remarks||"—"})',
    new: 'i.jsx(fa,{label:"Employee remarks",value:a.employee_remarks||"—"}),i.jsx(fa,{label:"HR remarks",value:a.admin_remarks||"—"})',
  },
  {
    name: 'legend text for split remarks',
    old: 'Blue = editable remarks',
    new: 'Blue = HR notes (employee remark shown above when submitted)',
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
console.log('Invoice remarks client patches applied');
