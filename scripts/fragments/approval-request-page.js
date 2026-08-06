function EbApprovalOpenModal({ row, co, onClose }) {
  const viewPdf = async () => {
    const invoiceId = row.invoice_id || row.invoiceId;
    if (!invoiceId) {
      se.error("Invoice attachment is not available");
      return;
    }
    try {
      const { data } = await De.get(`${ze.INVOICES}/${invoiceId}/pdf?co=${encodeURIComponent(co)}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      se.error("Could not open bill attachment");
    }
  };
  const excess = row.excess ?? (row.invoice_total != null && row.package_total != null ? Math.max(0, Number(row.invoice_total) - Number(row.package_total)) : null);
  return jf.createPortal(
    i.jsx("div", {
      className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4",
      onClick: (evt) => evt.target === evt.currentTarget && onClose(),
      children: i.jsxs("div", {
        className: "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-white shadow-xl",
        children: [
          i.jsxs("div", { className: "flex items-start justify-between border-b px-5 py-4", children: [
            i.jsxs("div", { children: [
              i.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: row.display_name || row.employee || row.phone_number || "Employee" }),
              i.jsx("p", { className: "text-sm text-slate-500", children: row.month_label || row.monthLabel || row.month || "—" }),
            ] }),
            i.jsx(Me, { variant: "outline", size: "sm", onClick: onClose, children: i.jsx(Rf, { className: "size-4" }) }),
          ] }),
          i.jsxs("div", { className: "space-y-3 px-5 py-4 text-sm", children: [
            i.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2", children: [
              i.jsx("span", { className: "text-slate-500", children: "Reference" }),
              i.jsx("span", { className: "font-medium text-slate-900", children: row.invoice_code || row.reference || row.invoiceCode || "—" }),
              i.jsx("span", { className: "text-slate-500", children: "Excess" }),
              i.jsx("span", { className: "font-semibold text-amber-700", children: Li(excess) }),
              i.jsx("span", { className: "text-slate-500", children: "Official usage" }),
              i.jsx("span", { className: "font-medium", children: Li(row.official_usage ?? row.officialUsage) }),
              i.jsx("span", { className: "text-slate-500", children: "Personal usage" }),
              i.jsx("span", { className: "font-medium", children: Li(row.personal_usage ?? row.personalUsage) }),
              i.jsx("span", { className: "text-slate-500", children: "Remarks" }),
              i.jsx("span", { className: "col-span-1 font-medium text-slate-800", children: row.employee_remarks || row.remarks || "—" }),
            ] }),
            row.pdf_filename || row.invoice_id || row.invoiceId
              ? i.jsx(Me, { variant: "outline", className: "w-full", onClick: viewPdf, children: row.pdf_filename ? `Open PDF — ${row.pdf_filename}` : "Open PDF attachment" })
              : null,
          ] }),
        ],
      }),
    }),
    document.body,
  );
}

function EbApprovalLevelProgress({ levels }) {
  if (!levels?.length) return i.jsx("p", { className: "text-xs text-slate-500", children: "No approval levels configured." });
  return i.jsx("div", { className: "space-y-2", children: levels.map((level) =>
    i.jsxs("div", {
      className: "rounded-md border border-slate-200 bg-white px-3 py-2",
      children: [
        i.jsxs("div", { className: "mb-1 flex flex-wrap items-center justify-between gap-2", children: [
          i.jsxs("span", { className: "text-xs font-semibold text-slate-800", children: ["Level ", level.levelOrder] }),
          i.jsx("span", {
            className: "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " + (level.status === "approved" ? "bg-emerald-100 text-emerald-800" : level.status === "current" ? "bg-sky-100 text-sky-800" : level.status === "rejected" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"),
            children: level.status === "current" ? "Waiting now" : level.status,
          }),
        ] }),
        i.jsx("div", { className: "space-y-1", children: (level.approvers || []).map((ap) =>
          i.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 text-[11px]", children: [
            i.jsx("span", { className: "text-slate-700", children: ap.email }),
            i.jsx("span", {
              className: "font-medium " + (ap.decision === "approved" ? "text-emerald-700" : ap.decision === "rejected" ? "text-red-700" : "text-amber-700"),
              children: ap.decision === "approved" ? "Approved" : ap.decision === "rejected" ? "Rejected" : "Pending",
            }),
          ] }, ap.email),
        ) }),
      ],
    }, String(level.levelOrder)),
  ) });
}

function EbApprovalHistoryAction({ row }) {
  if (!row.actorAction) return i.jsx("span", { className: "text-xs text-slate-500", children: "—" });
  const label = row.actorAction === "approved" ? "You approved" : row.actorAction === "rejected" ? "You rejected" : "Passed your level";
  return i.jsxs("div", { className: "inline-flex flex-col gap-0.5", children: [
    i.jsxs("span", { className: "text-xs font-semibold text-slate-800", children: [label, row.actorLevel ? ` · L${row.actorLevel}` : ""] }),
    row.actorDecidedAt ? i.jsx("span", { className: "text-[10px] text-slate-500", children: Kg(row.actorDecidedAt) }) : null,
  ] });
}

function EbOracleDeductionCell({ status }) {
  if (!status || status.loading) {
    return i.jsx(Kt, { className: "mx-auto size-4 animate-spin text-slate-400", title: "Checking Oracle…" });
  }
  if (status.applicable === false) {
    return i.jsx("span", { className: "text-xs text-slate-300", title: "No excess on this invoice", children: "—" });
  }
  if (status.present) {
    const base = status.elementName
      ? `Other Deduction present (${status.elementName}${status.existingAmount != null ? ` · AED ${Number(status.existingAmount).toFixed(2)}` : ""})`
      : "Other Deduction present in Oracle";
    const tip = status.needsRecovery === false ? `${base} — invoice has no personal recovery amount` : base;
    return i.jsx(Dd, { className: "mx-auto size-5 text-emerald-600", title: tip });
  }
  const missTip = status.needsRecovery === false
    ? (status.error || "Other Deduction not set up in Oracle") + " — invoice has no personal recovery amount"
    : (status.error || "Other Deduction not set up in Oracle");
  return i.jsx(Rf, { className: "mx-auto size-5 text-red-600", title: missTip });
}

function EbApprovalRequestPage() {
  const co = ka();
  const [params] = Jo();
  const token = params.get("token") || "";
  const [queue, setQueue] = b.useState({ rows: [], levelOrder: null, totalLevels: 0, approverEmail: "" });
  const [history, setHistory] = b.useState({ rows: [] });
  const [loading, setLoading] = b.useState(true);
  const [selected, setSelected] = b.useState([]);
  const [expanded, setExpanded] = b.useState({});
  const [busyId, setBusyId] = b.useState(null);
  const [rejectIds, setRejectIds] = b.useState(null);
  const [rejectReason, setRejectReason] = b.useState("");
  const [detailRow, setDetailRow] = b.useState(null);
  const [deductionMap, setDeductionMap] = b.useState({});

  const loadData = b.useCallback(async () => {
    setLoading(true);
    try {
      const queueReq = token
        ? De.get(`${ze.EXCESS_APPROVAL_QUEUE(token)}`).then(({ data }) => data).catch(() => ({ rows: [] }))
        : De.get(`${ze.EXCESS_APPROVAL_MY_QUEUE}?co=${encodeURIComponent(co)}`).then(({ data }) => data).catch(() => ({ rows: [] }));
      const historyReq = token
        ? De.get(`${ze.EXCESS_APPROVAL_QUEUE_HISTORY(token)}`).then(({ data }) => data).catch(() => ({ rows: [] }))
        : De.get(`${ze.EXCESS_APPROVAL_MY_HISTORY}?co=${encodeURIComponent(co)}`).then(({ data }) => data).catch(() => ({ rows: [] }));
      const [queueData, historyData] = await Promise.all([queueReq, historyReq]);
      setQueue(queueData || { rows: [] });
      setHistory(historyData || { rows: [] });
      setSelected([]);
    } catch {
      se.error("Could not load approval queue");
      setQueue({ rows: [] });
      setHistory({ rows: [] });
    } finally {
      setLoading(false);
    }
  }, [co, token]);

  b.useEffect(() => {
    const pendingRows = queue.rows || [];
    const ids = pendingRows.filter((row) => Number(row.personalUsage) > 0 || Number(row.excess) > 0).map((row) => row.invoiceId);
    if (!ids.length) {
      setDeductionMap({});
      return;
    }
    const loadingMap = {};
    ids.forEach((id) => { loadingMap[id] = { loading: true }; });
    setDeductionMap(loadingMap);
    const qs = encodeURIComponent(ids.join(","));
    const req = token
      ? De.get(`${ze.EXCESS_APPROVAL_QUEUE_DEDUCTION(token)}?invoiceIds=${qs}`, { timeout: 180000 })
      : De.get(`${ze.EXCESS_APPROVAL_DEDUCTION_STATUS}?co=${encodeURIComponent(co)}&invoiceIds=${qs}`, { timeout: 180000 });
    req.then(({ data }) => {
      const next = {};
      ids.forEach((id) => {
        next[id] = { ...(data?.statuses?.[id] || { applicable: true, present: false, error: "Unknown" }), loading: false };
      });
      setDeductionMap(next);
    }).catch(() => {
      const next = {};
      ids.forEach((id) => { next[id] = { applicable: true, present: false, error: "Could not check Oracle", loading: false }; });
      setDeductionMap(next);
    });
  }, [co, token, queue.rows]);

  b.useEffect(() => { loadData(); }, [loadData]);
  b.useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener("ebilling:approval-queue-refresh", onRefresh);
    return () => window.removeEventListener("ebilling:approval-queue-refresh", onRefresh);
  }, [loadData]);

  const rows = queue.rows || [];
  const historyRows = history.rows || [];
  const allSelected = rows.length > 0 && selected.length === rows.length;
  const levelLabel = queue.levelOrder ? `Level ${queue.levelOrder} of ${queue.totalLevels}` : "Approver queue";
  const actorEmail = queue.approverEmail || history.approverEmail || qo() || "";

  const toggleRow = (invoiceId) => {
    setSelected((prev) => prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]);
  };
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((row) => row.invoiceId));

  const approveRows = async (invoiceIds) => {
    if (!invoiceIds.length) return;
    setBusyId("bulk");
    try {
      const { data } = token
        ? await De.post(ze.EXCESS_APPROVAL_QUEUE_APPROVE(token), { invoiceIds }, { timeout: 120000 })
        : await De.post(`${ze.EXCESS_APPROVAL_MY_APPROVE}?co=${encodeURIComponent(co)}`, { invoiceIds }, { timeout: 120000 });
      const results = data?.results || [];
      const completed = results.filter((r) => r.status === "completed" || r.status === "advanced");
      const failed = results.filter((r) => r.status === "failed");
      const oracleSkipped = results.filter((r) => r.status === "completed" && r.skippedOracle).length;
      const manualOracle = results.filter((r) => r.status === "completed" && r.manualOracle).length;
      if (failed.length && completed.length) {
        se.warning(`Approved ${completed.length}, failed ${failed.length}. ${failed[0]?.error || ""}`.trim());
      } else if (failed.length) {
        se.error(failed[0]?.error || Eo({ message: "Approval failed" }));
      } else if (completed.length) {
        let msg = `Approved ${completed.length} item(s)`;
        if (oracleSkipped) msg += `. ${oracleSkipped} with no personal amount — Oracle skipped.`;
        if (manualOracle) msg += ` ${manualOracle} sent to finance for manual Oracle handling.`;
        se.success(msg);
      } else {
        se.success(`Approved ${invoiceIds.length} item(s)`);
      }
      loadData();
      window.dispatchEvent(new Event("ebilling:approval-queue-refresh"));
    } catch (err) {
      se.error(Eo(err));
    } finally {
      setBusyId(null);
    }
  };

  const rejectRows = async (invoiceIds, reason) => {
    if (!invoiceIds.length || !reason.trim()) {
      se.error("Rejection reason is required");
      return;
    }
    setBusyId("bulk");
    try {
      if (token) await De.post(ze.EXCESS_APPROVAL_QUEUE_REJECT(token), { invoiceIds, reason: reason.trim() }, { timeout: 6e4 });
      else await De.post(`${ze.EXCESS_APPROVAL_MY_REJECT}?co=${encodeURIComponent(co)}`, { invoiceIds, reason: reason.trim() }, { timeout: 6e4 });
      se.success(`Rejected ${invoiceIds.length} item(s)`);
      setRejectIds(null);
      setRejectReason("");
      loadData();
      window.dispatchEvent(new Event("ebilling:approval-queue-refresh"));
    } catch (err) {
      se.error(Eo(err));
    } finally {
      setBusyId(null);
    }
  };

  const openInvoice = (row) => {
    setDetailRow({
      ...row,
      invoice_id: row.invoiceId,
      display_name: row.employee,
      invoice_code: row.reference || row.invoiceCode,
    });
  };

  const renderHistoryTable = (items) => i.jsx("div", { className: "overflow-x-auto", children: i.jsxs("table", { className: "w-full min-w-[920px] border-collapse text-sm", children: [
    i.jsx("thead", { children: i.jsxs("tr", { className: "border-b bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: [
      i.jsx("th", { className: "px-3 py-3 w-10" }), i.jsx("th", { className: "px-3 py-3", children: "Employee" }), i.jsx("th", { className: "px-3 py-3", children: "Month" }),
      i.jsx("th", { className: "px-3 py-3 text-right", children: "Excess" }), i.jsx("th", { className: "px-3 py-3", children: "Your action" }), i.jsx("th", { className: "px-3 py-3", children: "Final status" }), i.jsx("th", { className: "px-3 py-3 text-right", children: "Open" }),
    ] }) }),
    i.jsx("tbody", { children: items.map((row) => {
      const key = "h-" + String(row.requestId || row.invoiceId);
      const isOpen = !!expanded[key];
      return i.jsxs(b.Fragment, { children: [
        i.jsxs("tr", { className: "border-b hover:bg-slate-50/80", children: [
          i.jsx("td", { className: "px-3 py-3", children: i.jsx("button", { type: "button", className: "rounded border border-slate-300 px-2 py-0.5 text-xs", onClick: () => setExpanded((prev) => ({ ...prev, [key]: !prev[key] })), children: isOpen ? "−" : "+" }) }),
          i.jsx("td", { className: "px-3 py-3 font-medium", children: row.employee || "—" }),
          i.jsx("td", { className: "px-3 py-3", children: row.monthLabel || row.month || "—" }),
          i.jsx("td", { className: "px-3 py-3 text-right tabular-nums font-semibold text-amber-700", children: Li(row.excess) }),
          i.jsx("td", { className: "px-3 py-3", children: i.jsx(EbApprovalHistoryAction, { row }) }),
          i.jsx("td", { className: "px-3 py-3", children: i.jsx("span", { className: "text-xs font-semibold " + (row.finalStatus?.includes("Rejected") ? "text-red-700" : row.finalStatus?.includes("Approved") ? "text-emerald-700" : "text-sky-700"), children: row.finalStatus || "—" }) }),
          i.jsx("td", { className: "px-3 py-3 text-right", children: i.jsx(Me, { variant: "outline", size: "sm", onClick: () => openInvoice(row), children: "Open" }) }),
        ] }),
        isOpen ? i.jsx("tr", { className: "border-b bg-slate-50/60", children: i.jsx("td", { colSpan: 7, className: "px-3 py-3", children: i.jsx(EbApprovalLevelProgress, { levels: row.levels }) }) }) : null,
      ] }, key);
    }) }),
  ] }) });

  return i.jsxs("div", { className: "space-y-6", children: [
    i.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      i.jsxs("div", { children: [
        i.jsxs("div", { className: "mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700", children: [i.jsx(Cb, { className: "size-3.5" }), "Excess approval matrix"] }),
        i.jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900", children: "APPROVAL REQUEST" }),
        i.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
          actorEmail ? i.jsx("span", { className: "text-sm text-slate-500", children: actorEmail }) : null,
          i.jsx("span", { className: "text-xs text-slate-400", children: levelLabel }),
          i.jsx("span", { className: "inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 font-mono text-base font-bold tabular-nums tracking-tight text-slate-900 shadow-sm", children: `(${rows.length} / ${historyRows.length})` }),
        ] }),
      ] }),
      i.jsxs(Me, { variant: "outline", onClick: () => loadData(), disabled: !!busyId, children: [busyId ? i.jsx(Kt, { className: "size-4 animate-spin" }) : i.jsx(af, { className: "size-4" }), " Refresh"] }),
    ] }),
    i.jsxs(Je, { className: "border-slate-200 shadow-sm", children: [
      i.jsxs(yt, { className: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3", children: [
        i.jsxs("div", { children: [
          i.jsx(jt, { className: "text-base", children: "Pending approvals" }),
          i.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Review excess invoices — approve, reject, or open details in a popup." }),
        ] }),
        i.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          i.jsxs(Me, { className: "bg-emerald-600 text-white hover:bg-emerald-700", disabled: !selected.length || !!busyId, onClick: () => approveRows(selected), children: [busyId ? i.jsx(Kt, { className: "size-4 animate-spin" }) : i.jsx(Dd, { className: "size-4" }), " Approve selected", selected.length ? ` (${selected.length})` : ""] }),
          i.jsxs(Me, { variant: "outline", className: "border-red-200 text-red-700 hover:bg-red-50", disabled: !selected.length || !!busyId, onClick: () => setRejectIds(selected), children: [i.jsx(Rf, { className: "size-4" }), " Reject selected", selected.length ? ` (${selected.length})` : ""] }),
        ] }),
      ] }),
      i.jsx(We, { className: "p-0", children: loading ? i.jsxs("div", { className: "flex items-center justify-center gap-2 p-12 text-sm text-slate-500", children: [i.jsx(Kt, { className: "size-4 animate-spin" }), "Loading approval queue…"] }) : rows.length ? i.jsx("div", { className: "overflow-x-auto", children: i.jsxs("table", { className: "w-full min-w-[1040px] border-collapse text-sm", children: [
        i.jsx("thead", { children: i.jsxs("tr", { className: "border-b bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: [
          i.jsx("th", { className: "px-3 py-3 w-10", children: i.jsx("input", { type: "checkbox", className: "size-4 rounded border-slate-300", checked: allSelected, onChange: toggleAll, "aria-label": "Select all" }) }),
          i.jsx("th", { className: "px-3 py-3", children: "Employee" }),
          i.jsx("th", { className: "px-2 py-3 w-12 text-center", title: "Other Deduction in Oracle", children: "OD" }),
          i.jsx("th", { className: "px-3 py-3", children: "Month" }), i.jsx("th", { className: "px-3 py-3 text-right", children: "Excess" }),
          i.jsx("th", { className: "px-3 py-3 text-right", children: "Official" }), i.jsx("th", { className: "px-3 py-3 text-right", children: "Personal" }), i.jsx("th", { className: "px-3 py-3", children: "Reference" }), i.jsx("th", { className: "px-3 py-3", children: "Remarks" }), i.jsx("th", { className: "px-3 py-3 text-right", children: "Actions" }),
        ] }) }),
        i.jsx("tbody", { children: rows.map((row) => i.jsxs("tr", { className: "border-b hover:bg-slate-50/80", children: [
          i.jsx("td", { className: "px-3 py-3", children: i.jsx("input", { type: "checkbox", className: "size-4 rounded border-slate-300", checked: selected.includes(row.invoiceId), onChange: () => toggleRow(row.invoiceId) }) }),
          i.jsx("td", { className: "px-3 py-3 font-medium", children: row.employee || "—" }),
          i.jsx("td", { className: "px-2 py-3 text-center", children: i.jsx(EbOracleDeductionCell, { status: deductionMap[row.invoiceId] }) }),
          i.jsx("td", { className: "px-3 py-3", children: row.monthLabel || row.month || "—" }),
          i.jsx("td", { className: "px-3 py-3 text-right tabular-nums font-semibold text-amber-700", children: Li(row.excess) }),
          i.jsx("td", { className: "px-3 py-3 text-right tabular-nums", children: Li(row.officialUsage) }),
          i.jsx("td", { className: "px-3 py-3 text-right tabular-nums", children: Li(row.personalUsage) }),
          i.jsx("td", { className: "px-3 py-3", children: row.reference || row.invoiceCode || "—" }),
          i.jsx("td", { className: "px-3 py-3 max-w-[200px] truncate text-slate-600", title: row.remarks || "", children: row.remarks || "—" }),
          i.jsx("td", { className: "px-3 py-3", children: i.jsxs("div", { className: "flex justify-end gap-1.5", children: [
            i.jsx(Me, { variant: "outline", size: "sm", onClick: () => openInvoice(row), children: "Open" }),
            i.jsx(Me, { size: "sm", className: "bg-emerald-600 text-white hover:bg-emerald-700", disabled: busyId === row.invoiceId, onClick: () => approveRows([row.invoiceId]), children: "Approve" }),
            i.jsx(Me, { size: "sm", variant: "outline", className: "border-red-200 text-red-700", disabled: busyId === row.invoiceId, onClick: () => setRejectIds([row.invoiceId]), children: "Reject" }),
          ] }) }),
        ] }, String(row.invoiceId))) }),
      ] }) }) : i.jsxs("div", { className: "p-12 text-center", children: [
        i.jsx("p", { className: "text-sm font-medium text-slate-700", children: "No invoices waiting for your approval." }),
        i.jsx("p", { className: "mt-1 text-xs text-slate-500", children: token ? "This approval link may be invalid or already completed." : "Sign in as a configured approver or wait for new requests." }),
      ] }) }),
    ] }),
    i.jsxs(Je, { className: "border-slate-200 shadow-sm", children: [
      i.jsx(yt, { className: "border-b border-slate-100 pb-3", children: i.jsxs("div", { children: [
        i.jsx(jt, { className: "text-base", children: "History" }),
        i.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Past requests that reached you — your action and the final status." }),
      ] }) }),
      i.jsx(We, { className: "p-0", children: loading ? i.jsxs("div", { className: "flex items-center justify-center gap-2 p-10 text-sm text-slate-500", children: [i.jsx(Kt, { className: "size-4 animate-spin" }), "Loading history…"] }) : historyRows.length ? renderHistoryTable(historyRows) : i.jsxs("div", { className: "p-10 text-center", children: [
        i.jsx("p", { className: "text-sm font-medium text-slate-700", children: "No history yet." }),
        i.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Requests you approve or reject will appear here." }),
      ] }) }),
    ] }),
    rejectIds ? jf.createPortal(i.jsx("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4", onClick: (evt) => evt.target === evt.currentTarget && setRejectIds(null), children: i.jsxs("div", { className: "w-full max-w-md rounded-xl border bg-white p-5 shadow-xl", children: [
      i.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Rejection reason" }),
      i.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Please explain why you are rejecting." }),
      i.jsx("textarea", { className: "mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm", rows: 4, value: rejectReason, onChange: (evt) => setRejectReason(evt.target.value), placeholder: "Reason…" }),
      i.jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [
        i.jsx(Me, { variant: "outline", onClick: () => { setRejectIds(null); setRejectReason(""); }, children: "Cancel" }),
        i.jsx(Me, { className: "bg-red-600 text-white hover:bg-red-700", disabled: !!busyId, onClick: () => rejectRows(rejectIds, rejectReason), children: busyId ? i.jsx(Kt, { className: "size-4 animate-spin" }) : "Confirm reject" }),
      ] }),
    ] }) }), document.body) : null,
    detailRow ? i.jsx(EbApprovalOpenModal, { row: detailRow, co, onClose: () => setDetailRow(null) }) : null,
  ] });
}

function EbApprovalRequestRoute() {
  return i.jsx(EbApprovalRequestPage, {});
}
