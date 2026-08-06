#!/usr/bin/env node
/** Safe patch: approval page + history API only */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const indexPath = path.join(__dirname, '../client/dist/index.html');
let s = fs.readFileSync(bundlePath, 'utf8');

const pageRaw = fs.readFileSync(path.join(__dirname, 'fragments/approval-request-page.js'), 'utf8').trim();
let pageCode = pageRaw;
try {
  const esbuild = require(path.join(__dirname, 'node_modules/esbuild'));
  pageCode = esbuild.transformSync(pageRaw, { loader: 'jsx', minify: true }).code;
} catch (e) {
  console.warn('esbuild minify unavailable, using raw page:', e.message);
}

const apiOld = 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_QUEUE:a=>';
const apiNew = 'EXCESS_APPROVAL_MY_QUEUE:"/excess-approval/my-queue",EXCESS_APPROVAL_MY_HISTORY:"/excess-approval/my-history",EXCESS_APPROVAL_DEDUCTION_STATUS:"/excess-approval/deduction-status",EXCESS_APPROVAL_QUEUE_DEDUCTION:a=>`/excess-approval/queue/${a}/deduction-status`,EXCESS_APPROVAL_QUEUE_HISTORY:a=>`/excess-approval/queue/${a}/history`,EXCESS_APPROVAL_QUEUE:a=>';
if (!s.includes('EXCESS_APPROVAL_DEDUCTION_STATUS')) {
  if (s.includes('EXCESS_APPROVAL_MY_HISTORY') && !s.includes('EXCESS_APPROVAL_DEDUCTION_STATUS')) {
    s = s.replace(
      'EXCESS_APPROVAL_MY_HISTORY:"/excess-approval/my-history",EXCESS_APPROVAL_QUEUE_HISTORY',
      'EXCESS_APPROVAL_MY_HISTORY:"/excess-approval/my-history",EXCESS_APPROVAL_DEDUCTION_STATUS:"/excess-approval/deduction-status",EXCESS_APPROVAL_QUEUE_DEDUCTION:a=>`/excess-approval/queue/${a}/deduction-status`,EXCESS_APPROVAL_QUEUE_HISTORY',
    );
    console.log('Applied deduction-status API constants (upgrade path)');
  } else if (!s.includes(apiOld)) {
    if (!s.includes('EXCESS_APPROVAL_MY_HISTORY')) {
      console.error('Missing API anchor');
      process.exit(1);
    }
  } else {
    s = s.replace(apiOld, apiNew);
    console.log('Applied history + deduction API constants');
  }
} else {
  console.log('API constants already present');
}

const start = s.indexOf('function EbApprovalRequestPage');
if (start < 0) {
  console.error('Missing EbApprovalRequestPage');
  process.exit(1);
}

const endMarkers = [
  'function EbApprovalRequestRoute(){return i.jsx(EbApprovalRequestPage,{})}',
  'function EbApprovalRequestRoute() {\n  return i.jsx(EbApprovalRequestPage, {});\n}',
];
let end = -1;
let endMarker = '';
for (const marker of endMarkers) {
  const idx = s.indexOf(marker, start);
  if (idx >= 0) {
    end = idx;
    endMarker = marker;
    break;
  }
}
if (end < 0) {
  console.error('Missing EbApprovalRequestRoute marker');
  process.exit(1);
}

const levelStart = s.indexOf('function EbApprovalLevelProgress', Math.max(0, start - 500));
const injectStart = levelStart >= 0 && levelStart < start ? levelStart : start;
s = s.slice(0, injectStart) + pageCode + s.slice(end + endMarker.length);
console.log('Updated approval request page with history');

fs.writeFileSync(bundlePath, s);
try {
  new Function(s);
  console.log('Bundle parse OK');
} catch (e) {
  console.error('Bundle parse FAIL', e.message);
  process.exit(1);
}

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler missing — aborting deploy');
  process.exit(1);
}

const cacheTag = '202607161130oracle-deduction-col';
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes(cacheTag)) {
  fs.writeFileSync(indexPath, index.replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
  console.log('Bumped cache version');
}
for (const rel of ['../client/dist/index-root.html']) {
  const p = path.join(__dirname, rel);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
}

console.log('Approval history patch complete');
