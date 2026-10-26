function EbAllRequestsRoute(){return i.jsx(EbAllRequestsPage,{});}
function EbAllReqIsNotSubmit(row){return !!(row&&(row.notSubmittedByEmp||row.requestStatus==="rejected"));}
function EbAllReqKind(row){if(EbAllReqIsNotSubmit(row))return"not-submit";if(row.requestStatus==="approved")return"approved";return"in-progress";}
function EbAllReqLevelChip(lv){var st=lv.status;var cls=st==="approved"?"bg-emerald-100 text-emerald-800":st==="rejected"?"bg-rose-100 text-rose-700":st==="current"?"bg-amber-100 text-amber-800":"bg-slate-100 text-slate-500";var label=st==="approved"?"Approved":st==="rejected"?"Rejected":st==="current"?"In progress":"Pending";var who=lv.approvedBy||lv.rejectedBy||null;return i.jsxs("div",{className:"ar-level",children:[i.jsxs("span",{className:"inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold "+cls,children:["L",lv.levelOrder," · ",label]}),who?i.jsx("span",{className:"text-[10px] text-slate-500",children:who}):null]},lv.levelOrder);}
function EbAllReqStatus(row){if(EbAllReqIsNotSubmit(row))return{cls:"bg-amber-100 text-amber-900",label:"Not submit by emp"};if(row.requestStatus==="approved")return{cls:"bg-emerald-100 text-emerald-800",label:"Approved"};return{cls:"bg-amber-100 text-amber-800",label:row.currentLevel?("In progress · L"+row.currentLevel):"In progress"};}
function EbAllReqOdStatus(row,map){var id=String(row.invoiceId||"");if(!id)return{applicable:!1,loading:!1};var excess=Number(row.excess)||0;var personal=Number(row.personalUsage)||0;if(excess<=0&&personal<=0)return{applicable:!1,loading:!1};return map[id]||{loading:!0};}
function EbAllReqField(label,child){return i.jsxs("label",{className:"ar-field",children:[i.jsx("span",{children:label}),child]});}
function EbAllReqExcelRows(filtered){
  return filtered.map(function(row){
    var empty=EbAllReqIsNotSubmit(row);
    function lv(order){
      if(empty) return "";
      var found=(row.levels||[]).filter(function(x){return Number(x.levelOrder)===order;})[0];
      if(!found) return "";
      if(found.status==="approved") return "Approved";
      if(found.status==="current") return "In progress";
      return "Pending";
    }
    return {
      Month: row.monthLabel || row.month || "",
      Employee: row.employee || "",
      Invoice: row.reference || "",
      Official: row.officialUsage == null ? "" : Number(Number(row.officialUsage).toFixed(2)),
      Personal: row.personalUsage == null ? "" : Number(Number(row.personalUsage).toFixed(2)),
      Status: EbAllReqStatus(row).label,
      L1: lv(1),
      L2: lv(2),
      L3: lv(3),
      Submitted: row.submittedAt ? YT(row.submittedAt) : ""
    };
  });
}
function EbAllReqDownloadBlob(blob, filename){
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);}, 1000);
}
function EbAllRequestsPage(){
  var co=ka();
  var d=b.useState({rows:[],totalLevels:0}),data=d[0],setData=d[1];
  var l=b.useState(!0),loading=l[0],setLoading=l[1];
  var sr=b.useState(""),search=sr[0],setSearch=sr[1];
  var mf=b.useState("all"),monthF=mf[0],setMonthF=mf[1];
  var sf=b.useState("all"),statusF=sf[0],setStatusF=sf[1];
  var uf=b.useState("all"),usageF=uf[0],setUsageF=uf[1];
  var lf=b.useState("all"),levelF=lf[0],setLevelF=lf[1];
  var pg=b.useState(1),page=pg[0],setPage=pg[1];
  var ps=b.useState(25),pageSize=ps[0],setPageSize=ps[1];
  var ex=b.useState(!1),exporting=ex[0],setExporting=ex[1];
  var dm=b.useState({}),deductionMap=dm[0],setDeductionMap=dm[1];
  var load=b.useCallback(function(){setLoading(!0);De.get(ze.EXCESS_APPROVAL_REQUESTS+"?co="+encodeURIComponent(co)).then(function(r){setData(r.data||{rows:[],totalLevels:0});}).catch(function(){se.error("Could not load requests");}).finally(function(){setLoading(!1);});},[co]);
  b.useEffect(function(){load();},[load]);
  b.useEffect(function(){var rows=data.rows||[];var seed={};var ids=[];rows.forEach(function(r){var id=String(r.invoiceId||"");if(!id)return;if(Number(r.personalUsage)>0||Number(r.excess)>0)ids.push(id);else seed[id]={applicable:!1,loading:!1};});setDeductionMap(function(prev){var next={...seed};ids.forEach(function(id){next[id]={loading:!0};});return next;});if(!ids.length)return;var cancelled=!1;var chunkSize=6;var run=function(start){if(cancelled||start>=ids.length)return;var chunk=ids.slice(start,start+chunkSize);var qs=encodeURIComponent(chunk.join(","));De.get(ze.EXCESS_APPROVAL_DEDUCTION_STATUS+"?co="+encodeURIComponent(co)+"&invoiceIds="+qs,{timeout:90000}).then(function(r){if(cancelled)return;setDeductionMap(function(prev){var next={...prev};chunk.forEach(function(id){next[id]={...(r.data&&r.data.statuses&&r.data.statuses[id]?r.data.statuses[id]:{applicable:!0,present:!1,error:"Unknown"}),loading:!1};});return next;});run(start+chunkSize);}).catch(function(){if(cancelled)return;setDeductionMap(function(prev){var next={...prev};chunk.forEach(function(id){next[id]={applicable:!0,present:!1,error:"Could not check Oracle",loading:!1};});return next;});run(start+chunkSize);});};run(0);return function(){cancelled=!0;};},[co,(data.rows||[]).map(function(r){return String(r.invoiceId||"")+":"+String(r.personalUsage||0);}).join("|")]);
  if(!EbCanViewExcessTracking()){return i.jsx("div",{className:"p-10 text-center text-sm text-slate-500",children:"This view is restricted."});}
  var rows=data.rows||[];
  var months=[];var seen={};
  rows.forEach(function(r){var k=String(r.month||"");if(!k||seen[k])return;seen[k]=1;months.push({month:k,label:r.monthLabel||k});});
  var q=search.trim().toLowerCase();
  var filtered=rows.filter(function(r){
    if(monthF!=="all"&&String(r.month||"")!==monthF)return false;
    var kind=EbAllReqKind(r);
    if(statusF!=="all"&&kind!==statusF)return false;
    var personal=Number(r.personalUsage)||0;
    var official=Number(r.officialUsage)||0;
    if(usageF==="personal"&&!(personal>0))return false;
    if(usageF==="official"&&!(official>0&&personal<=0))return false;
    if(usageF==="none"&&(personal>0||official>0))return false;
    if(levelF!=="all"){
      if(EbAllReqIsNotSubmit(r))return false;
      if(String(r.currentLevel||"")!==String(levelF))return false;
    }
    if(!q)return true;
    return ((r.employee||"")+" "+(r.reference||"")+" "+(r.monthLabel||"")+" "+(r.month||"")).toLowerCase().indexOf(q)>=0;
  });
  var pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  var cur=page;if(cur>pages)cur=pages;if(cur<1)cur=1;
  var start=(cur-1)*pageSize;
  var pageRows=filtered.slice(start,start+pageSize);
  var from=filtered.length?start+1:0;
  var to=Math.min(start+pageRows.length,filtered.length);
  function setFilter(fn){return function(e){fn(e.target.value);setPage(1);};}
  function downloadExcel(){
    if(!filtered.length || exporting) return;
    setExporting(!0);
    var filename="eBilling-all-requests-"+(monthF && monthF!=="all" ? monthF : "all")+".xlsx";
    De.post(ze.EXCESS_APPROVAL_REQUESTS+"/export?co="+encodeURIComponent(co)+(monthF && monthF!=="all" ? "&month="+encodeURIComponent(monthF) : ""), {rows: EbAllReqExcelRows(filtered)}, {responseType:"blob"}).then(function(r){
      EbAllReqDownloadBlob(new Blob([r.data],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename);
      se.success("Excel downloaded");
    }).catch(function(){se.error("Could not download Excel");}).finally(function(){setExporting(!1);});
  }
  function goto(p){if(p==="prev")setPage(Math.max(1,cur-1));else if(p==="next")setPage(Math.min(pages,cur+1));else setPage(Number(p));}
  var pStart=Math.max(1,cur-2);var pEnd=Math.min(pages,pStart+4);pStart=Math.max(1,pEnd-4);
  var pagerBtns=[i.jsx("button",{type:"button",disabled:cur<=1,onClick:function(){goto("prev");},children:"Prev"},"prev")];
  for(var n=pStart;n<=pEnd;n++)pagerBtns.push(i.jsx("button",{type:"button",className:n===cur?"on":"",onClick:function(num){return function(){goto(num);};}(n),children:String(n)},n));
  pagerBtns.push(i.jsx("button",{type:"button",disabled:cur>=pages,onClick:function(){goto("next");},children:"Next"},"next"));
  return i.jsxs("div",{className:"space-y-5",children:[
    i.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-4",children:[
      i.jsxs("div",{children:[
        i.jsx("p",{className:"text-xs font-semibold uppercase tracking-wide text-violet-700",children:"Approvals overview"}),
        i.jsx("h1",{className:"mt-1 text-xl font-semibold text-slate-900",children:EbIsExcessTrackingUser()?"Approval request tracking":"All requests"}),
        i.jsx("p",{className:"mt-1 max-w-3xl text-sm text-slate-500",children:EbIsExcessTrackingUser()?"Track every excess approval request and its level status. This view is read-only.":"Read-only view of every excess approval request and its level status. Viewing here does not approve or reject anything."})
      ]}),
      i.jsxs("div",{className:"flex items-center gap-2",children:[
        i.jsx("button",{type:"button",className:"h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50",disabled:!filtered.length||exporting,onClick:downloadExcel,children:exporting?"Downloading...":"Download Excel"}),
        i.jsx(Me,{variant:"outline",size:"sm",onClick:function(){load();},disabled:loading,children:loading?i.jsx(Kt,{className:"size-4 animate-spin"}):"Refresh"})
      ]})
    ]}),
    i.jsxs("div",{className:"flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",children:[
      EbAllReqField("Search", i.jsx("input",{type:"search",placeholder:"Employee, reference, month...",className:"h-10 w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:search,onChange:setFilter(setSearch)})),
      EbAllReqField("Month", i.jsxs("select",{className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:monthF,onChange:setFilter(setMonthF),children:[i.jsx("option",{value:"all",children:"All months"})].concat(months.map(function(m){return i.jsx("option",{value:m.month,children:m.label},m.month);}))})),
      EbAllReqField("Status", i.jsxs("select",{className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:statusF,onChange:setFilter(setStatusF),children:[
        i.jsx("option",{value:"all",children:"All"}),
        i.jsx("option",{value:"in-progress",children:"In progress"}),
        i.jsx("option",{value:"approved",children:"Approved"}),
        i.jsx("option",{value:"not-submit",children:"Not submit by emp"})
      ]})),
      EbAllReqField("Level", i.jsxs("select",{className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:levelF,onChange:setFilter(setLevelF),children:[
        i.jsx("option",{value:"all",children:"All"}),
        i.jsx("option",{value:"1",children:"L1"}),
        i.jsx("option",{value:"2",children:"L2"}),
        i.jsx("option",{value:"3",children:"L3"})
      ]})),
      EbAllReqField("Usage", i.jsxs("select",{className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:usageF,onChange:setFilter(setUsageF),children:[
        i.jsx("option",{value:"all",children:"All"}),
        i.jsx("option",{value:"personal",children:"Personal > 0"}),
        i.jsx("option",{value:"official",children:"Official only"}),
        i.jsx("option",{value:"none",children:"No split amounts"})
      ]})),
      EbAllReqField("Rows", i.jsxs("select",{className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm",value:String(pageSize),onChange:function(e){setPageSize(Number(e.target.value)||25);setPage(1);},children:[
        i.jsx("option",{value:"25",children:"25"}),
        i.jsx("option",{value:"50",children:"50"}),
        i.jsx("option",{value:"100",children:"100"})
      ]})),
      i.jsx("div",{className:"pb-1 text-sm text-slate-500",children:filtered.length+" of "+rows.length})
    ]}),
    i.jsxs("div",{className:"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",children:[
      i.jsx("div",{className:"ar-table-wrap",children:loading?i.jsx("div",{className:"p-12 text-center text-sm text-slate-500",children:"Loading..."}):pageRows.length?i.jsxs("table",{className:"ar-table",children:[
        i.jsx("thead",{children:i.jsxs("tr",{children:[
          i.jsx("th",{children:"Employee"}),
          i.jsx("th",{children:"Month"}),
          i.jsx("th",{className:"ar-num",children:"Official"}),
          i.jsx("th",{className:"ar-num",children:"Personal"}),
          i.jsx("th",{className:"text-center",title:"Other Deduction in Oracle",children:"OD"}),
          i.jsx("th",{children:"Status"}),
          i.jsx("th",{children:"Levels"}),
          i.jsx("th",{children:"Submitted"})
        ]})}),
        i.jsx("tbody",{children:pageRows.map(function(row){
          var stt=EbAllReqStatus(row);
          var emptyLevels=EbAllReqIsNotSubmit(row);
          return i.jsxs("tr",{className:emptyLevels?"ar-note":"",children:[
            i.jsxs("td",{children:[i.jsx("p",{className:"font-medium text-slate-900",children:row.employee||"—"}),i.jsx("p",{className:"font-mono text-[11px] text-slate-500",children:row.reference||"—"})]}),
            i.jsx("td",{className:"ar-now",children:row.monthLabel||"—"}),
            i.jsx("td",{className:"ar-num",children:Li(row.officialUsage)}),
            i.jsx("td",{className:"ar-num font-semibold text-amber-700",children:Li(row.personalUsage)}),
            i.jsx("td",{className:"text-center",children:i.jsx(EbOracleDeductionCell,{status:EbAllReqOdStatus(row,deductionMap)})}),
            i.jsx("td",{className:"ar-now",children:i.jsx("span",{className:"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold "+stt.cls,children:stt.label})}),
            i.jsx("td",{children:emptyLevels?null:i.jsx("div",{className:"ar-levels",children:(row.levels||[]).map(function(lv){return EbAllReqLevelChip(lv);})})}),
            i.jsx("td",{className:"ar-now text-xs text-slate-500",children:row.submittedAt?YT(row.submittedAt):"—"})
          ]},row.requestId||row.invoiceId);
        })})
      ]}):i.jsx("div",{className:"p-12 text-center text-sm text-slate-500",children:"No approval requests found."})}),
      i.jsxs("div",{className:"ar-pager",children:[
        i.jsx("span",{className:"text-sm text-slate-500",children:filtered.length?(from+"-"+to+" of "+filtered.length):"0 rows"}),
        i.jsx("div",{className:"ar-pager-btns",children:pagerBtns})
      ]})
    ]})
  ]});
}
