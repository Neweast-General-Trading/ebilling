#!/usr/bin/env node
/** Safe full rebuild of index-approval-v2.js from known-good backup */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'client/dist/assets');
const backup = path.join(assets, 'index-DGxZ6d5S.js');
const bundle = path.join(assets, 'index-approval-v2.js');

if (!fs.existsSync(backup)) {
  console.error('Missing backup bundle index-DGxZ6d5S.js');
  process.exit(1);
}

fs.copyFileSync(backup, bundle);
console.log('Restored backup -> index-approval-v2.js');

const patches = [
  'patch-approval-history.js',
  'patch-invoice-status-approval-safe.js',
  'patch-ui-polish-safe.js',
  'patch-ebilling-root-paths.js',
  'patch-approval-sidebar-counts.js',
  'patch-intranet-sso.js',
  'patch-sidebar-loginby.js',
  'patch-excess-matrix-tab.js',
  'patch-recovery-report.js',
  'patch-all-requests-view.js',
  'patch-approval-request-link.js',
  'patch-approval-readonly-viewer.js',
  'patch-ebilling-allowlist-access.js',
  'patch-info-hq-excess-tracking.js',
  'patch-master-edit-display-name.js',
];

for (const patch of patches) {
  console.log('\n---', patch, '---');
  execSync(`node ${path.join(__dirname, patch)}`, { stdio: 'inherit', cwd: root });
}

const s = fs.readFileSync(bundle, 'utf8');
if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY FAIL: ebApprovalReminderHandler missing');
  process.exit(1);
}
if ((s.match(/function EbApprovalRequestPage/g) || []).length !== 1) {
  console.error('SAFETY FAIL: EbApprovalRequestPage count != 1');
  process.exit(1);
}
if (s.includes('function function')) {
  console.error('SAFETY FAIL: function function');
  process.exit(1);
}
try {
  new Function(s);
} catch (e) {
  console.error('SAFETY FAIL: bundle parse', e.message);
  process.exit(1);
}

const cacheTag = '202607162320hotfix-restore';
for (const rel of ['client/dist/index.html', 'client/dist/index-root.html']) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`));
}
// Deploy to the directory nginx actually serves (ebilling.neweast.cloud).
const deployDir = '/var/www/mis-dashboard/ebilling';
if (fs.existsSync(deployDir)) {
  fs.copyFileSync(bundle, path.join(deployDir, 'assets/index-approval-v2.js'));
  for (const rel of ['client/dist/index.html', 'client/dist/index-root.html']) {
    const src = path.join(root, rel);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(deployDir, path.basename(rel)));
  }
  const arSrc = path.join(root, 'client/dist/approval-request/index.html');
  const arDstDir = path.join(deployDir, 'approval-request');
  // NEVER deploy approval-request/ as a static directory on ebilling host —
  // it steals the SPA route (trailing-slash directory index) and breaks deep links.
  if (fs.existsSync(arDstDir)) {
    fs.rmSync(arDstDir, { recursive: true, force: true });
    console.log('Removed deploy dir approval-request/ (SPA must own this route)');
  }
  // Keep source file for other hosts / archives only
  if (fs.existsSync(arSrc)) {
    console.log('Kept source client/dist/approval-request/index.html (not deployed)');
  }
  console.log('Deployed bundle + html ->', deployDir);
} else {
  console.warn('Deploy dir not found, skipped:', deployDir);
}

console.log('\nSafe rebuild complete:', cacheTag);
