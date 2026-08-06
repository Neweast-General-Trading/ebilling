#!/usr/bin/env node
/** Allow editing display name on SIM Master edit dialog */
const fs = require('fs');
const path = require('path');

const bundle = path.join(__dirname, '..', 'client/dist/assets/index-approval-v2.js');
let s = fs.readFileSync(bundle, 'utf8');

const oldFn =
  'function eT({employee:a,onClose:l,onSaved:r}){const o=ka(),[u,f]=b.useState(a.phone_number),[p,m]=b.useState(String(a.package_value??0)),[v,x]=b.useState(String(a.additional_amount??0)),[EbNam,ebSetNam]=b.useState(!!a.no_auto_mail),[y,g]=b.useState(!1),[_,N]=b.useState([]),A=b.useMemo(()=>qb(Number(p)||0,Number(v)||0),[p,v]),C=async()=>{g(!0),N([]);try{await De.patch(`${ze.SIM_MASTER}/${a.id}?co=${o}`,{phoneNumber:u,packageLimit:Number(p)||0,additionalAmount:Number(v)||0,noAutoMail:EbNam}),se.success("Employee updated"),r(),l()}catch(S){const k=S;k.response?.data?.conflicts&&N(k.response.data.conflicts),se.error(k.response?.data?.message||"Update failed")}finally{g(!1)}};return i.jsx(rc,{title:"Edit employee",onClose:l,children:i.jsxs("div",{className:"space-y-4",children:[i.jsxs("p",{className:"text-sm text-muted-foreground",children:[a.display_name," — SAP ",a.person_number]}),i.jsxs("label",{className:"block space-y-1 text-sm",children:[i.jsx("span",{children:"Phone"}),i.jsx("input",{className:"w-full rounded-md border bg-background px-3 py-2",value:u,onChange:S=>f(S.target.value)})]}),';

const newFn =
  'function eT({employee:a,onClose:l,onSaved:r}){const o=ka(),[EbDisp,ebSetDisp]=b.useState(a.display_name||""),[u,f]=b.useState(a.phone_number),[p,m]=b.useState(String(a.package_value??0)),[v,x]=b.useState(String(a.additional_amount??0)),[EbNam,ebSetNam]=b.useState(!!a.no_auto_mail),[y,g]=b.useState(!1),[_,N]=b.useState([]),A=b.useMemo(()=>qb(Number(p)||0,Number(v)||0),[p,v]),C=async()=>{const EbNameTrim=EbDisp.trim();if(!EbNameTrim){se.error("Name is required");return}g(!0),N([]);try{await De.patch(`${ze.SIM_MASTER}/${a.id}?co=${o}`,{displayName:EbNameTrim,phoneNumber:u,packageLimit:Number(p)||0,additionalAmount:Number(v)||0,noAutoMail:EbNam}),se.success("Employee updated"),r(),l()}catch(S){const k=S;k.response?.data?.conflicts&&N(k.response.data.conflicts),se.error(k.response?.data?.message||"Update failed")}finally{g(!1)}};return i.jsx(rc,{title:"Edit employee",onClose:l,children:i.jsxs("div",{className:"space-y-4",children:[i.jsxs("p",{className:"text-sm text-muted-foreground",children:["SAP ",a.person_number]}),i.jsxs("label",{className:"block space-y-1 text-sm",children:[i.jsx("span",{children:"Name"}),i.jsx("input",{className:"w-full rounded-md border bg-background px-3 py-2",value:EbDisp,onChange:S=>ebSetDisp(S.target.value),placeholder:"Employee display name"})]}),i.jsxs("label",{className:"block space-y-1 text-sm",children:[i.jsx("span",{children:"Phone"}),i.jsx("input",{className:"w-full rounded-md border bg-background px-3 py-2",value:u,onChange:S=>f(S.target.value)})]}),';

if (!s.includes(oldFn)) {
  console.error('patch-master-edit-display-name: anchor not found');
  process.exit(1);
}

s = s.replace(oldFn, newFn);
fs.writeFileSync(bundle, s);
new Function(s);
console.log('patch-master-edit-display-name: applied');
