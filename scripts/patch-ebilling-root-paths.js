#!/usr/bin/env node
/** Serve eBilling at https://ebilling.neweast.cloud/invoices (no /ebilling/ prefix on this host) */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-approval-v2.js');
const distDir = path.join(__dirname, '../client/dist');
let s = fs.readFileSync(bundlePath, 'utf8');

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler missing — abort');
  process.exit(1);
}

const patches = [
  {
    name: 'router basename by host',
    old: 'function WT(){localStorage.setItem("rectracking_co",localStorage.getItem("rectracking_co")||"BI_NEGT");const a="/ebilling/".replace(/\\/$/,"");',
    new: 'function WT(){localStorage.setItem("rectracking_co",localStorage.getItem("rectracking_co")||"BI_NEGT");const a=(typeof window<"u"&&window.location.hostname==="ebilling.neweast.cloud"?"/":"/ebilling").replace(/\\/$/,"");',
  },
  {
    name: 'api base by host',
    old: 'if(window.location.hostname==="mis.neweast.cloud"||window.location.hostname==="ebilling.neweast.cloud")return`${window.location.origin}/ebilling/api`.replace(/\\/$/,"");',
    new: 'if(window.location.hostname==="ebilling.neweast.cloud")return`${window.location.origin}/api`.replace(/\\/$/,"");if(window.location.hostname==="mis.neweast.cloud")return`${window.location.origin}/ebilling/api`.replace(/\\/$/,"");',
  },
  {
    name: 'logo asset by host',
    old: 'src:"/ebilling/assets/login/logo.png"',
    new: 'src:typeof window<"u"&&window.location.hostname==="ebilling.neweast.cloud"?"/assets/login/logo.png":"/ebilling/assets/login/logo.png"',
  },
  {
    name: 'microsoft login returnTo',
    old: 'returnTo=${encodeURIComponent(`${window.location.origin}/ebilling/login`)}',
    new: 'returnTo=${encodeURIComponent(`${window.location.origin}${window.location.hostname==="ebilling.neweast.cloud"?"/login":"/ebilling/login"}`)}',
  },
  {
    name: 'approval open invoice url',
    olds: [
      'window.open(`${window.location.origin}/ebilling/invoices?${qs.toString()}`, "_blank", "noopener,noreferrer");',
      'window.open(`${window.location.origin}${window.location.hostname==="ebilling.neweast.cloud"?"/invoices":"/ebilling/invoices"}?${s.toString()}`,"_blank","noopener,noreferrer")',
    ],
    new: 'window.open(`${window.location.origin}${window.location.hostname==="ebilling.neweast.cloud"?"/invoices":"/ebilling/invoices"}?${typeof qs<"u"?qs.toString():s.toString()}`,"_blank","noopener,noreferrer")',
    optional: true,
  },
];

for (const patch of patches) {
  if (patch.new && s.includes(patch.new)) {
    console.log(`Already applied: ${patch.name}`);
    continue;
  }
  const targets = patch.olds || (patch.old ? [patch.old] : []);
  const target = targets.find((old) => s.includes(old));
  if (!target) {
    if (patch.optional) {
      console.log(`Skipped optional: ${patch.name}`);
      continue;
    }
    console.error(`Missing target: ${patch.name}`);
    process.exit(1);
  }
  s = s.replace(target, patch.new);
  console.log(`Applied: ${patch.name}`);
}

if (!s.includes('ebApprovalReminderHandler')) {
  console.error('SAFETY: ebApprovalReminderHandler removed — abort');
  process.exit(1);
}

fs.writeFileSync(bundlePath, s);
try {
  new Function(s);
  console.log('Bundle parse OK');
} catch (e) {
  console.error('Bundle parse FAIL', e.message);
  process.exit(1);
}

const indexRoot = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <title>eBilling | NEWEAST</title>
    <script type="module" crossorigin src="/assets/index-approval-v2.js?v=202607141135root"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-fLDltgH_.css">
    <link rel="stylesheet" href="/assets/ebilling-shell.css?v=19">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index-root.html'), indexRoot);
console.log('Wrote index-root.html');

console.log('Root path patch complete');
