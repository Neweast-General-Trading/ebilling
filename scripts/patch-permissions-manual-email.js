#!/usr/bin/env node
/** Classic permissions table + pagination, manual email add, approval 2-slot sections. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
const cssPath = path.join(__dirname, '../client/dist/assets/ebilling-shell.css');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const oldPermTable = 'i.jsxs(Je,{className:"eb-perm-card overflow-hidden border-slate-200 shadow-sm",children:[i.jsxs(yt,{className:"flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3",children:[i.jsxs("div",{children:[i.jsx(jt,{className:"text-base",children:"Permissions by tab"}),i.jsxs("p",{className:"mt-1 text-xs text-slate-500",children:[l.length," user",l.length===1?"":"s",Wn>1?` · page ${Bn} of ${Wn}`:""]})]}),Wn>1?i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsxs("span",{className:"min-w-[4rem] text-center text-xs font-semibold text-slate-600",children:[Bn," / ",Wn]}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]}):null]}),i.jsx(We,{className:"p-0",children:f?i.jsxs("div",{className:"flex items-center justify-center gap-2 p-10 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading users…"]}):l.length?i.jsx("div",{className:"overflow-x-auto",children:i.jsxs("table",{className:"eb-perm-table",children:[i.jsx("thead",{children:i.jsxs("tr",{children:[i.jsx("th",{children:"User"}),k.map(D=>i.jsx("th",{className:"eb-perm-col",children:i.jsx("span",{className:"eb-perm-tab",children:pg[D]})},D))]})}),i.jsx("tbody",{children:Vn.map(D=>i.jsxs("tr",{className:bt("eb-perm-row",D.isAdmin&&"eb-perm-row-admin"),children:[i.jsx("td",{className:"eb-perm-user",children:i.jsxs("div",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"eb-perm-avatar",children:(D.displayName||D.email||"?").slice(0,1).toUpperCase()}),i.jsxs("div",{className:"min-w-0",children:[i.jsx("div",{className:"font-semibold text-slate-900 truncate",children:D.displayName}),i.jsx("div",{className:"text-xs text-slate-500 truncate",children:D.email}),D.isAdmin?i.jsx("span",{className:"eb-perm-badge",children:"Super admin"}):null]})]})}),k.map(L=>{const P=D.permissions.includes(L),pe=D.isAdmin||x===D.email;return i.jsx("td",{className:"eb-perm-cell",children:i.jsxs("label",{className:bt("eb-perm-toggle",P&&"eb-perm-toggle-on",pe&&"eb-perm-toggle-disabled"),children:[i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"sr-only","aria-label":`${D.displayName} ${pg[L]}`}),i.jsx("span",{className:"eb-perm-toggle-pill","aria-hidden":"true"})]})},L)})]},D.email))})]})}):i.jsx("div",{className:"eb-perm-empty",children:"No users yet. Add someone above."})}),Wn>1?i.jsxs("div",{className:"eb-perm-footer",children:[i.jsxs("span",{children:["Showing ",(Bn-1)*Qn+1,"–",Math.min(Bn*Qn,l.length)," of ",l.length]}),i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]})]}):null]})';

const newPermTable = 'i.jsxs(Je,{className:"overflow-hidden border-slate-200 shadow-sm",children:[i.jsxs(yt,{className:"flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3",children:[i.jsxs("div",{children:[i.jsx(jt,{className:"text-base",children:"Permissions by tab"}),i.jsxs("p",{className:"mt-1 text-xs text-slate-500",children:[l.length," user",l.length===1?"":"s",Wn>1?` · page ${Bn} of ${Wn}`:""]})]}),Wn>1?i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsxs("span",{className:"min-w-[4rem] text-center text-xs font-semibold text-slate-600",children:[Bn," / ",Wn]}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]}):null]}),i.jsx(We,{className:"p-0",children:f?i.jsxs("div",{className:"flex items-center justify-center gap-2 p-10 text-sm text-slate-500",children:[i.jsx(Kt,{className:"size-4 animate-spin"}),"Loading users…"]}):l.length?i.jsx("div",{className:"overflow-x-auto",children:i.jsxs("table",{className:"min-w-full text-sm",children:[i.jsx("thead",{className:"bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500",children:i.jsxs("tr",{children:[i.jsx("th",{className:"px-4 py-3 font-semibold",children:"User"}),k.map(D=>i.jsx("th",{className:"px-3 py-3 text-center font-semibold",children:pg[D]},D))]})}),i.jsx("tbody",{children:Vn.map(D=>i.jsxs("tr",{className:"border-t border-slate-100 hover:bg-slate-50/70",children:[i.jsxs("td",{className:"px-4 py-3",children:[i.jsx("div",{className:"font-medium text-slate-900",children:D.displayName}),i.jsx("div",{className:"text-xs text-slate-500",children:D.email}),D.isAdmin?i.jsx("div",{className:"mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700",children:"Super admin"}):null]}),k.map(L=>{const P=D.permissions.includes(L),pe=D.isAdmin||x===D.email;return i.jsx("td",{className:"px-3 py-3 text-center",children:i.jsx("input",{type:"checkbox",checked:P,disabled:pe,onChange:()=>q(D,L),className:"size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60","aria-label":`${D.displayName} ${pg[L]}`})},L)})]},D.email))})]})}):i.jsx("div",{className:"p-10 text-center text-sm text-slate-500",children:"No users yet. Add someone above."})}),Wn>1?i.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500",children:[i.jsxs("span",{children:["Showing ",(Bn-1)*Qn+1,"–",Math.min(Bn*Qn,l.length)," of ",l.length]}),i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn<=1,onClick:()=>Kn(D=>Math.max(1,D-1)),children:"Previous"}),i.jsx(Me,{variant:"outline",size:"sm",disabled:Bn>=Wn,onClick:()=>Kn(D=>Math.min(Wn,D+1)),children:"Next"})]})]}):null]})';

const patches = [
  {
    name: 'permissions page size',
    old: '[Bn,Kn]=b.useState(1),Qn=8,C=b.useCallback',
    new: '[Bn,Kn]=b.useState(1),[Jn,er]=b.useState(""),Qn=6,C=b.useCallback',
  },
  {
    name: 'add user oracle + manual email',
    old: 'i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Add user"})}),i.jsxs(We,{className:"space-y-3",children:[i.jsx("p",{className:"text-xs text-slate-500",children:"Select an employee email from Oracle master data (SIM employees)."}),i.jsxs("div",{className:"flex flex-wrap items-end gap-3",children:[i.jsxs("div",{className:"min-w-[280px] flex-1 space-y-2",children:[i.jsx("input",{type:"search",value:N,onChange:D=>A(D.target.value),placeholder:"Search by name, email, or person number…",className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"}),i.jsxs("select",{value:g,onChange:D=>_(D.target.value),disabled:m,className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500",children:[i.jsx("option",{value:"",children:m?"Loading Oracle emails…":X.length>0?"Select employee email…":"No available employees found"}),X.map(D=>i.jsxs("option",{value:D.email,children:[D.displayName," — ",D.email,D.personNumber?` (#${D.personNumber})`:""]},D.email))]})]}),i.jsxs(Me,{onClick:le,disabled:!g||x===g,children:[i.jsx(__,{className:"mr-2 size-4"}),"Add user"]})]})]})]}',
    new: 'i.jsxs(Je,{className:"border-slate-200 shadow-sm",children:[i.jsx(yt,{className:"pb-3",children:i.jsx(jt,{className:"text-base",children:"Add user"})}),i.jsxs(We,{className:"space-y-4",children:[i.jsxs("div",{className:"space-y-2",children:[i.jsx("p",{className:"text-xs font-medium text-slate-700",children:"From Oracle (SIM employees)"}),i.jsx("p",{className:"text-xs text-slate-500",children:"Search and pick an employee already in master data."}),i.jsxs("div",{className:"flex flex-wrap items-end gap-3",children:[i.jsxs("div",{className:"min-w-[280px] flex-1 space-y-2",children:[i.jsx("input",{type:"search",value:N,onChange:D=>A(D.target.value),placeholder:"Search by name, email, or person number…",className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"}),i.jsxs("select",{value:g,onChange:D=>{_(D.target.value),er("")},disabled:m,className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500",children:[i.jsx("option",{value:"",children:m?"Loading Oracle emails…":X.length>0?"Select employee email…":"No available employees found"}),X.map(D=>i.jsxs("option",{value:D.email,children:[D.displayName," — ",D.email,D.personNumber?` (#${D.personNumber})`:""]},D.email))]})]}),i.jsxs(Me,{onClick:le,disabled:!g||x===g,children:[i.jsx(__,{className:"mr-2 size-4"}),"Add from Oracle"]})]})]}),i.jsxs("div",{className:"space-y-2 border-t border-slate-100 pt-4",children:[i.jsx("p",{className:"text-xs font-medium text-slate-700",children:"External email (not in Oracle)"}),i.jsx("p",{className:"text-xs text-slate-500",children:"Grant access to any work email — no SIM master record required."}),i.jsxs("div",{className:"flex flex-wrap items-end gap-3",children:[i.jsx("input",{type:"email",value:Jn,onChange:D=>{er(D.target.value),_("")},placeholder:"name@neweast.co",className:"h-10 min-w-[280px] flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"}),i.jsxs(Me,{variant:"outline",onClick:le,disabled:!Jn.trim()||x===gb(Jn),children:[i.jsx(__,{className:"mr-2 size-4"}),"Add external email"]})]})]})]})]}',
  },
  {
    name: 'add user handler any email',
    old: 'le=async()=>{const D=gb(g);if(!D){se.error("Select an employee email");return}if(l.some(L=>L.email===D)){se.error("User already exists in the list");return}y(D);try{const{data:L}=await De.put(ze.PERMISSIONS_USERS,{email:D,permissions:["dashboard","invoices","master"]});r(P=>[...P,L.user].sort((pe,Ne)=>pe.email.localeCompare(Ne.email))),_(""),A(""),mg(),se.success(`Added ${ef(D)}`)}catch(L){se.error("Could not add user"),console.error(L)}finally{y(null)}}',
    new: 'le=async()=>{const D=gb(g)||gb(Jn);if(!D){se.error("Select or enter an email");return}if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(D)){se.error("Enter a valid email address");return}if(l.some(L=>L.email===D)){se.error("User already exists in the list");return}y(D);try{const{data:L}=await De.put(ze.PERMISSIONS_USERS,{email:D,permissions:["dashboard","invoices","master"]});r(P=>[...P,L.user].sort((pe,Ne)=>pe.email.localeCompare(Ne.email))),_(""),er(""),A(""),Kn(Math.max(1,Math.ceil((l.length+1)/Qn))),mg(),se.success(`Added ${ef(D)}`)}catch(L){se.error("Could not add user"),console.error(L)}finally{y(null)}}',
  },
  {
    name: 'classic permissions table with pagination',
    old: oldPermTable,
    new: newPermTable,
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
if (!css.includes('eb-approval-section-body {') || !css.includes('max-height: calc(2 * 11.75rem')) {
  css = css.replace(
    /\.eb-approval-section-body \{[\s\S]*?scroll-behavior: smooth;\n\}/,
    `.eb-approval-section-body {
  flex: 1;
  min-height: calc(2 * 11.75rem + 0.5rem);
  max-height: calc(2 * 11.75rem + 0.5rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
  scroll-behavior: smooth;
}`,
  );
  fs.writeFileSync(cssPath, css);
  console.log('Updated approval section 2-slot height');
}

const index = fs.readFileSync(indexPath, 'utf8');
if (index.includes('v=20260612i')) {
  fs.writeFileSync(
    indexPath,
    index
      .replace('index-DGxZ6d5S.js?v=20260612i', 'index-DGxZ6d5S.js?v=20260612j')
      .replace('ebilling-shell.css?v=13', 'ebilling-shell.css?v=14'),
  );
  console.log('Bumped cache versions');
}

console.log('Permissions + approval update applied');
