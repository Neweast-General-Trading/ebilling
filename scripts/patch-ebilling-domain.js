#!/usr/bin/env node
/**
 * Patch client bundle for ebilling.neweast.cloud (same /ebilling/ layout as mis).
 */
const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-DGxZ6d5S.js');
let s = fs.readFileSync(bundlePath, 'utf8');

const oldNw =
  'if(window.location.hostname==="mis.neweast.cloud")return`${window.location.origin}/ebilling/api`.replace(/\\/$/,"");return"http://172.1.0.14:5041".replace(/\\/$/,"")';

const newNw =
  'if(window.location.hostname==="mis.neweast.cloud"||window.location.hostname==="ebilling.neweast.cloud")return`${window.location.origin}/ebilling/api`.replace(/\\/$/,"");return"http://172.1.0.14:5041".replace(/\\/$/,"")';

if (!s.includes(oldNw)) {
  if (s.includes('ebilling.neweast.cloud')) {
    console.log('Bundle already patched for ebilling.neweast.cloud');
    process.exit(0);
  }
  console.error('Could not find nw() hostname check to patch');
  process.exit(1);
}

s = s.replace(oldNw, newNw);
fs.writeFileSync(bundlePath, s);
console.log('Patched index-DGxZ6d5S.js for ebilling.neweast.cloud');
