#!/usr/bin/env node
/** Auto-login from Intranet menu — JWT hash + OTP params (uSrId, LoTp, co). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bundle = path.join(root, 'client/dist/assets/index-approval-v2.js');
const fragment = path.join(__dirname, 'fragments/intranet-sso-bootstrap.js');
const htmlSnippets = [
  path.join(root, 'client/dist/index.html'),
  path.join(root, 'client/dist/index-root.html'),
];

const intranetCaptureScript = `    <script>
      (function () {
        var p = new URLSearchParams(window.location.search);
        var h = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
        var u = p.get("uSrId");
        var o = p.get("LoTp");
        var c = p.get("co") || h.get("co");
        var jwt = h.get("jwt") || p.get("jwt");
        if (jwt && c) {
          sessionStorage.setItem(
            "eb_intranet_jwt",
            JSON.stringify({ jwt: jwt, co: c }),
          );
        }
        if (u && o && c) {
          sessionStorage.setItem(
            "eb_intranet_link",
            JSON.stringify({ userId: u, otp: String(o), companyCode: c }),
          );
        }
      })();
    </script>`;

const newEn =
  'function En({children:a}){return xb()?i.jsx("div",{className:"flex min-h-[200px] items-center justify-center text-sm text-slate-500",children:"Waiting for intranet session…"}):localStorage.getItem("jwt")?i.jsx(pw,{children:a}):i.jsx(Hi,{to:"/login",replace:!0})}';

function removeSsoBlock(source) {
  const start = source.indexOf('function EbReadIntranetLinkParams');
  const enStart = source.indexOf('function En({children:a})');
  if (start >= 0 && enStart > start) {
    return source.slice(0, start) + source.slice(enStart);
  }
  return source;
}

let s = fs.readFileSync(bundle, 'utf8');
const insert = fs.readFileSync(fragment, 'utf8').trim();

s = removeSsoBlock(s);

const enStart = s.indexOf('function En({children:a})');
if (enStart < 0) {
  console.error('patch-intranet-sso: En block not found');
  process.exit(1);
}

s = s.slice(0, enStart) + insert + '\n' + s.slice(enStart);
s = s.replace(/function En\(\{children:a\}\)\{[\s\S]*?\}function Mn/, `${newEn}function Mn`);

const oldRoot = '{path:"/",element:i.jsx(Hi,{to:"/dashboard",replace:!0})}';
const newRoot = '{path:"/",element:i.jsx(EbRootRedirect,{})}';
if (s.includes(oldRoot)) {
  s = s.replace(oldRoot, newRoot);
}

const wtWrapOld = 'return i.jsxs(Lj,{basename:a||void 0,children:[';
const wtWrapNew = 'return i.jsx(EbAppIntranetGate,{children:i.jsxs(Lj,{basename:a||void 0,children:[';
if (s.includes(wtWrapOld) && !s.includes('EbAppIntranetGate,{children:i.jsxs(Lj')) {
  s = s.replace(wtWrapOld, wtWrapNew);
  s = s.replace(
    'i.jsx(b2,{richColors:!0,position:"top-right"})]})}',
    'i.jsx(b2,{richColors:!0,position:"top-right"})]})})}',
  );
}

for (const fn of ['EbReadIntranetLinkParams', 'EbAppIntranetGate', 'EbRootRedirect', 'EbExchangeIntranetLink']) {
  const count = (s.match(new RegExp(`function ${fn}`, 'g')) || []).length;
  if (count !== 1) {
    console.error(`patch-intranet-sso: expected 1 ${fn}, found ${count}`);
    process.exit(1);
  }
}

const loginEffectOld =
  'b.useEffect(()=>{const U=new URLSearchParams(window.location.search),EbH=new URLSearchParams((window.location.hash||"").replace(/^#/,"")),R=U.get("loginError")||EbH.get("loginError");if(R){se.error(decodeURIComponent(R.replace(/\\+/g," "))),window.history.replaceState({}, "",window.location.pathname)}const Q=EbH.get("jwt")||U.get("jwt"),EbCo=EbH.get("co")||U.get("co");if(Q){const EbU=dw(Q);Wd(Q,EbCo||"BI_NEGT",EbU?{email:EbU,preferred_username:EbU}:null),se.success("Logged in"),window.history.replaceState({}, "",window.location.pathname),a("/dashboard");return}localStorage.getItem("jwt")&&a("/dashboard")},[a]);';

const loginEffectNew =
  'b.useEffect(()=>{(async()=>{const U=new URLSearchParams(window.location.search),EbH=new URLSearchParams((window.location.hash||"").replace(/^#/,"")),R=U.get("loginError")||EbH.get("loginError");if(R){se.error(decodeURIComponent(R.replace(/\\+/g," "))),window.history.replaceState({}, "",window.location.pathname)}const Q=EbH.get("jwt")||U.get("jwt"),EbCo=EbH.get("co")||U.get("co");if(Q){const EbU=dw(Q);Wd(Q,EbCo||"BI_NEGT",EbU?{email:EbU,preferred_username:EbU}:null),se.success("Logged in"),window.history.replaceState({}, "",window.location.pathname),a("/dashboard");return}const EbLink=EbCaptureIntranetLinkParams();if(EbLink){try{await EbExchangeIntranetLink(EbLink),se.success("Signed in via Intranet"),a("/dashboard");return}catch{se.error("Invalid or expired Intranet link — sign in again")}}localStorage.getItem("jwt")&&a("/dashboard")})()},[a]);';

if (s.includes(loginEffectOld)) {
  s = s.replace(loginEffectOld, loginEffectNew);
} else if (!s.includes('EbExchangeIntranetLink(EbLink)')) {
  console.error('patch-intranet-sso: login page effect not found');
  process.exit(1);
}

fs.writeFileSync(bundle, s);

for (const htmlPath of htmlSnippets) {
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script>\s*\(function \(\) \{[\s\S]*?eb_intranet_link[\s\S]*?\}\)\(\);\s*<\/script>\s*/g, '');
  html = html.replace('<div id="root"></div>', `${intranetCaptureScript}\n    <div id="root"></div>`);
  fs.writeFileSync(htmlPath, html);
}

try {
  new Function(s);
} catch (e) {
  console.error('patch-intranet-sso: bundle parse failed', e.message);
  process.exit(1);
}

const cacheTag = '202607141345matrix-tab';
for (const rel of ['client/dist/index.html', 'client/dist/index-root.html']) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(
    p,
    fs.readFileSync(p, 'utf8').replace(/index-approval-v2\.js\?v=[^"]+/, `index-approval-v2.js?v=${cacheTag}`),
  );
}

console.log('patch-intranet-sso: applied', cacheTag);
