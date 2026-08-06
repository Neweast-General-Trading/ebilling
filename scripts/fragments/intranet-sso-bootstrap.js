function EbReadIntranetLinkParams() {
  const params = new URLSearchParams(window.location.search);
  let userId = (params.get("uSrId") || "").trim();
  let otp = String(params.get("LoTp") ?? "").trim();
  let co = (params.get("co") || "").trim();
  if (!userId || !otp || !co) {
    try {
      const raw = sessionStorage.getItem("eb_intranet_link");
      if (raw) {
        const saved = JSON.parse(raw);
        userId = String(saved.userId || "").trim();
        otp = String(saved.otp ?? "").trim();
        co = String(saved.companyCode || "").trim();
      }
    } catch {}
  }
  if (!userId || !otp || !co) return null;
  return { userId, otp, co };
}
function EbReadIntranetHashJwt() {
  const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const params = new URLSearchParams(window.location.search);
  let jwt = (hash.get("jwt") || params.get("jwt") || "").trim();
  let co = (hash.get("co") || params.get("co") || "BI_NEGT").trim();
  if (!jwt) {
    try {
      const raw = sessionStorage.getItem("eb_intranet_jwt");
      if (raw) {
        const saved = JSON.parse(raw);
        jwt = String(saved.jwt || "").trim();
        co = String(saved.co || co).trim();
      }
    } catch {}
  }
  if (!jwt) return null;
  return { jwt, co };
}
function EbHasPendingIntranetAuth() {
  return !!(EbReadIntranetHashJwt() || EbReadIntranetLinkParams() || sessionStorage.getItem("eb_intranet_link") || sessionStorage.getItem("eb_intranet_jwt"));
}
function EbCaptureIntranetLinkParams() {
  const link = EbReadIntranetLinkParams();
  if (link) {
    sessionStorage.setItem("eb_intranet_link", JSON.stringify(link));
  }
  return link;
}
function EbStripIntranetUrlParams() {
  const params = new URLSearchParams(window.location.search);
  params.delete("uSrId");
  params.delete("LoTp");
  params.delete("jwt");
  // Keep ?co= on approval deep links — required for company context after SSO.
  const path = (window.location.pathname || "").replace(/\/$/, "");
  if (!path.endsWith("/approval-request") && !path.endsWith("/all-requests")) {
    params.delete("co");
  }
  const nextSearch = params.toString();
  const nextHash = window.location.hash || "";
  // Drop auth material from hash after capture
  let hash = nextHash.replace(/^#/, "");
  if (hash) {
    const hp = new URLSearchParams(hash);
    hp.delete("jwt");
    const hs = hp.toString();
    hash = hs ? `#${hs}` : "";
  }
  window.history.replaceState({}, "", `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`);
}
async function EbExchangeIntranetLink(link) {
  const { data } = await De.post(`${lw}/auth/intranet-link`, {
    userId: link.userId,
    otp: link.otp,
    companyCode: link.co,
  });
  if (!data?.token) throw new Error("No token");
  Wd(data.token, link.co, data.user || null);
  sessionStorage.removeItem("eb_intranet_link");
  EbStripIntranetUrlParams();
  return data;
}
function EbShouldStayOnDeepLink() {
  const path = (window.location.pathname || "").replace(/\/$/, "");
  return (
    path.endsWith("/approval-request") ||
    path.endsWith("/all-requests") ||
    path.endsWith("/login")
  );
}
function EbGateGoDashboard() {
  if (EbShouldStayOnDeepLink()) return;
  const base = (typeof window !== "undefined" && window.location.hostname === "ebilling.neweast.cloud" ? "" : "/ebilling");
  if (!window.location.pathname.replace(/\/$/, "").endsWith("/dashboard")) {
    window.history.replaceState({}, "", `${base}/dashboard`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
function EbAppIntranetGate({ children }) {
  const [ready, setReady] = b.useState(() => !EbHasPendingIntranetAuth() && !!localStorage.getItem("jwt"));
  b.useEffect(() => {
    if (ready) return;
    let cancelled = false;
    (async () => {
      const hashAuth = EbReadIntranetHashJwt();
      if (hashAuth) {
        const email = dw(hashAuth.jwt);
        Wd(hashAuth.jwt, hashAuth.co, email ? { email, preferred_username: email } : null);
        sessionStorage.removeItem("eb_intranet_jwt");
        EbStripIntranetUrlParams();
        try {
          const { data } = await De.get(ze.AUTH_ME);
          if (!cancelled && data?.user) Wd(hashAuth.jwt, hashAuth.co, data.user);
        } catch {}
        if (!cancelled) {
          se.success("Signed in via Intranet");
          setReady(true);
          if (!window.location.pathname.endsWith("/login")) EbGateGoDashboard();
        }
        return;
      }
      const link = EbCaptureIntranetLinkParams();
      if (link) {
        EbStripIntranetUrlParams();
        try {
          await EbExchangeIntranetLink(link);
          if (!cancelled) {
            se.success("Signed in via Intranet");
            setReady(true);
            EbGateGoDashboard();
            return;
          }
        } catch {}
        if (!cancelled) se.error("Invalid or expired Intranet link — sign in again");
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [ready]);
  if (!ready) {
    return i.jsx("div", { className: "flex min-h-screen items-center justify-center text-sm text-slate-500", children: "Signing in via Intranet…" });
  }
  return children;
}
function EbIntranetLinkBootstrap({ onDone }) {
  const ran = b.useRef(false);
  b.useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (localStorage.getItem("jwt")) {
      onDone("authed");
      return;
    }
    onDone("anon");
  }, [onDone]);
  return null;
}
function EbRootRedirect() {
  const q = typeof window !== "undefined" ? window.location.search : "";
  const h = typeof window !== "undefined" ? window.location.hash : "";
  return i.jsx(Hi, { to: `/dashboard${q}${h}`, replace: !0 });
}
