#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const oldPanel = fs.readFileSync(path.join(__dirname, 'fragments/ebill-approval-panel-compact.js'), 'utf8').trim();
const fragment = fs.readFileSync(path.join(__dirname, 'fragments/ebill-approval-sidebar-counts.js'), 'utf8').trim();
let s = fs.readFileSync(bundlePath, 'utf8');

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler missing');
  process.exit(1);
}

if (s.includes('function EbApprovalNavCounts')) {
  console.log('Counts helpers already present');
} else if (s.includes(oldPanel)) {
  s = s.replace(oldPanel, fragment);
  console.log('Replaced approval panel with count version');
} else {
  console.error('Missing compact approval panel');
  process.exit(1);
}

const oldNavMap = 'return i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)';
const newNavMap = 'return m.id==="approval_request"?i.jsxs(Ts,{to:m.path,className:bt("eb-nav-link flex items-center gap-2",v&&"eb-nav-link-active"),children:[i.jsx("span",{children:m.label}),i.jsx(EbApprovalNavCounts,{})]},m.id):i.jsx(Ts,{to:m.path,className:bt("eb-nav-link",v&&"eb-nav-link-active"),children:m.label},m.id)';

if (s.includes(newNavMap)) {
  console.log('Nav counts already applied');
} else if (s.includes(oldNavMap)) {
  s = s.replace(oldNavMap, newNavMap);
  console.log('Applied sidebar nav counts');
} else {
  console.error('Missing nav map target');
  process.exit(1);
}

fs.writeFileSync(bundlePath, s);
new Function(s);
console.log('Bundle parse OK');

const cacheTag = '202607141145sidebar-counts';
for (const rel of ['../client/dist/index.html', '../client/dist/index-root.html']) {
  const p = path.join(__dirname, rel);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
}
console.log('Done');
