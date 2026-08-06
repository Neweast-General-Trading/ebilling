#!/usr/bin/env node
/** Invoice auto-flow UI: status labels, excess display, disable recovery button. */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const patches = [
  {
    name: 'disable recovery button temporarily',
    old: 'function ev(a,l){return l&&(a.approval_status==="ready_for_recovery"||a.approval_status==="recovery_sent")&&(a.personal_usage??0)>0&&!!a.person_number?.trim()}',
    new: 'function ev(a,l){return!1}',
  },
  {
    name: 'status label confirmed ready for recovery',
    old: 'function hT(a){return a.approval_status==="ready_for_recovery"?"Ready for recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Confirmed by User"',
    new: 'function hT(a){return a.approval_status==="ready_for_recovery"?"Confirmed & Ready for recovery":a.approval_status==="recovery_sent"?"Recovery sent":a.approval_status==="confirmed_by_user"?"Confirmed"',
  },
  {
    name: 'show official usage in invoice detail',
    old: 'i.jsx(il,{label:"Personal usage",value:a.personal_usage===null?"—":`AED ${Al(a.personal_usage)}`}),i.jsx(il,{label:"Excess",value:`AED ${Al(a.excess)}`,tone:a.excess>0?"danger":"default"})',
    new: 'i.jsx(il,{label:"Official usage",value:a.official_usage===null?"—":`AED ${Al(a.official_usage)}`}),i.jsx(il,{label:"Personal usage",value:a.personal_usage===null?"—":`AED ${Al(a.personal_usage)}`}),i.jsx(il,{label:"Excess",value:a.exceeded_amount!=null&&a.exceeded_amount>0?`AED ${Al(a.excess)} (Official: AED ${Al(a.official_usage??0)}, Personal: AED ${Al(a.personal_usage??0)})`:`AED ${Al(a.excess)}`,tone:a.excess>0?"danger":"default"})',
  },
];

for (const patch of patches) {
  if (!s.includes(patch.old)) {
    if (patch.name.includes('disable') && s.includes('function ev(a,l){return!1}')) {
      console.log(`Skipped (already applied): ${patch.name}`);
      continue;
    }
    console.error(`Missing patch target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(patch.old, patch.new);
  console.log(`Applied: ${patch.name}`);
}

fs.writeFileSync(bundlePath, s);
console.log('Invoice auto-flow client patches applied');
