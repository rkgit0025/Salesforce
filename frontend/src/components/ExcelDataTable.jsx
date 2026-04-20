import { useState, useEffect, useCallback, useRef } from "react";
import { getRawOpportunities, getRawLeads } from "../api";

// ── Helpers ───────────────────────────────────────────────────────────
const fmtCr = (n) => {
  if (n == null || Number(n) === 0) return "—";
  const cr = Number(n) / 10_000_000;
  if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
  const lac = Number(n) / 100_000;
  return `₹${lac.toFixed(2)} L`;
};
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Styles ────────────────────────────────────────────────────────────
const S = {
  wrap: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface2)",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "8px 12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  select: {
    padding: "8px 10px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    background: color + "22",
    color: color,
    whiteSpace: "nowrap",
  }),
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12.5px",
    fontFamily: "var(--font-body)",
  },
  th: {
    padding: "10px 14px",
    background: "var(--surface2)",
    borderBottom: "2px solid var(--border)",
    color: "var(--text-muted)",
    fontWeight: 700,
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  td: {
    padding: "9px 14px",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)",
    whiteSpace: "nowrap",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pager: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    borderTop: "1px solid var(--border)",
    background: "var(--surface2)",
    flexWrap: "wrap",
    gap: "8px",
  },
  pgBtn: (disabled) => ({
    padding: "6px 14px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: disabled ? "transparent" : "var(--accent)",
    color: disabled ? "var(--text-muted)" : "#fff",
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 600,
    opacity: disabled ? 0.4 : 1,
  }),
};

// Stage / Status badge colours
const STAGE_COLORS = {
  "Closed Won":                      "#22c55e",
  "Closed Lost":                     "#ef4444",
  "Negotiation":                     "#f59e0b",
  "Commercial Offer":                "#3b82f6",
  "Technical Offer":                 "#8b5cf6",
  "Follow-up Calls":                 "#06b6d4",
  "New":                             "#94a3b8",
  "Scheme Finalization":             "#ec4899",
  "Estimation of Proposed Scheme":   "#f97316",
  "Site Visit/Meeting (VC/In-Person)": "#14b8a6",
};
const STATUS_COLORS = {
  "Converted":           "#22c55e",
  "Not Converted":       "#ef4444",
  "New Enquiry":         "#3b82f6",
  "Working - Contacted": "#f59e0b",
  "Working":             "#06b6d4",
};

function StageBadge({ val, map }) {
  const color = map[val] || "#64748b";
  return <span style={S.badge(color)}>{val || "—"}</span>;
}

// ── Opportunities Table ───────────────────────────────────────────────
function OppTable({ dept }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [stage,   setStage]   = useState("All");
  const [limit]               = useState(50);
  const searchRef             = useRef(null);
  const debounceRef           = useRef(null);

  const load = useCallback(async (pg, srch, stg) => {
    setLoading(true);
    try {
      const res = await getRawOpportunities({
        page: pg, limit, search: srch,
        ...(dept && dept !== "All" ? { dept } : {}),
        ...(stg && stg !== "All"  ? { stage: stg } : {}),
      });
      setData(res);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [dept, limit]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); load(1, search, stage); }, [dept, stage]); // eslint-disable-line
  useEffect(() => { load(page, search, stage); }, [page]);                 // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, val, stage); }, 400);
  };

  const cols = [
    { key: "opportunity_number", label: "Opp #",        render: r => r.opportunity_number },
    { key: "created_date",       label: "Created",       render: r => fmtDate(r.created_date) },
    { key: "account_name",       label: "Account",       render: r => r.account_name || "—" },
    { key: "industry",           label: "Industry",      render: r => r.industry || "—" },
    { key: "mailing_state",      label: "State",         render: r => r.mailing_state || "—" },
    { key: "opportunity_owner",  label: "Owner",         render: r => r.opportunity_owner || "—" },
    { key: "proposal_person",    label: "Proposal By",   render: r => r.proposal_person || "—" },
    { key: "stage",              label: "Stage",         render: r => <StageBadge val={r.stage} map={STAGE_COLORS} /> },
    { key: "quoted_value",       label: "Quoted Value",  render: r => fmtCr(r.quoted_value) },
    { key: "final_price",        label: "Final Price",   render: r => fmtCr(r.final_price) },
    { key: "close_date",         label: "Close Date",    render: r => fmtDate(r.close_date) },
    { key: "department",         label: "Dept",          render: r => r.department || "—" },
  ];

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <input
          ref={searchRef}
          style={S.input}
          placeholder="🔍  Search account, owner, state, opp#, industry…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select style={S.select} value={stage} onChange={e => setStage(e.target.value)}>
          <option value="All">All Stages</option>
          {(data?.stages || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
          {loading ? "Loading…" : `${(data?.total ?? 0).toLocaleString("en-IN")} records`}
        </span>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{cols.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={cols.length} style={{ ...S.td, textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
              : !data?.rows?.length
              ? <tr><td colSpan={cols.length} style={{ ...S.td, textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No records found</td></tr>
              : data.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--surface2)" }}>
                  {cols.map(c => <td key={c.key} style={S.td} title={typeof c.render(row) === "string" ? c.render(row) : undefined}>{c.render(row)}</td>)}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={S.pager}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Page {data.page} of {data.pages} &nbsp;·&nbsp; Showing {((data.page - 1) * limit) + 1}–{Math.min(data.page * limit, data.total)} of {data.total.toLocaleString("en-IN")}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button style={S.pgBtn(page <= 1)}      disabled={page <= 1}          onClick={() => setPage(1)}>⏮</button>
            <button style={S.pgBtn(page <= 1)}      disabled={page <= 1}          onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button style={S.pgBtn(page >= data.pages)} disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <button style={S.pgBtn(page >= data.pages)} disabled={page >= data.pages} onClick={() => setPage(data.pages)}>⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leads Table ───────────────────────────────────────────────────────
function LeadsTable({ dept }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("All");
  const [limit]               = useState(50);
  const debounceRef           = useRef(null);

  const load = useCallback(async (pg, srch, st) => {
    setLoading(true);
    try {
      const res = await getRawLeads({
        page: pg, limit, search: srch,
        ...(dept && dept !== "All" ? { dept }   : {}),
        ...(st   && st   !== "All" ? { status: st } : {}),
      });
      setData(res);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [dept, limit]);

  useEffect(() => { setPage(1); load(1, search, status); }, [dept, status]); // eslint-disable-line
  useEffect(() => { load(page, search, status); }, [page]);                  // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, val, status); }, 400);
  };

  const cols = [
    { key: "lead_number",  label: "Lead #",     render: r => r.lead_number },
    { key: "create_date",  label: "Created",    render: r => fmtDate(r.create_date) },
    { key: "first_name",   label: "Name",       render: r => [r.first_name, r.last_name].filter(Boolean).join(" ") || "—" },
    { key: "company",      label: "Company",    render: r => r.company || "—" },
    { key: "industry_type",label: "Industry",   render: r => r.industry_type || "—" },
    { key: "lead_source",  label: "Source",     render: r => r.lead_source || "—" },
    { key: "rating",       label: "Rating",     render: r => r.rating || "—" },
    { key: "lead_owner",   label: "Owner",      render: r => r.lead_owner || "—" },
    { key: "lead_status",  label: "Status",     render: r => <StageBadge val={r.lead_status} map={STATUS_COLORS} /> },
    { key: "state",        label: "State",      render: r => r.state || "—" },
    { key: "department",   label: "Dept",       render: r => r.department || "—" },
  ];

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <input
          style={S.input}
          placeholder="🔍  Search name, company, owner, state, lead#, industry…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select style={S.select} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {(data?.statuses || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
          {loading ? "Loading…" : `${(data?.total ?? 0).toLocaleString("en-IN")} records`}
        </span>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{cols.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={cols.length} style={{ ...S.td, textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
              : !data?.rows?.length
              ? <tr><td colSpan={cols.length} style={{ ...S.td, textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No records found</td></tr>
              : data.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--surface2)" }}>
                  {cols.map(c => <td key={c.key} style={S.td}>{c.render(row)}</td>)}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={S.pager}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Page {data.page} of {data.pages} &nbsp;·&nbsp; Showing {((data.page - 1) * limit) + 1}–{Math.min(data.page * limit, data.total)} of {data.total.toLocaleString("en-IN")}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button style={S.pgBtn(page <= 1)}          disabled={page <= 1}          onClick={() => setPage(1)}>⏮</button>
            <button style={S.pgBtn(page <= 1)}          disabled={page <= 1}          onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button style={S.pgBtn(page >= data.pages)} disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <button style={S.pgBtn(page >= data.pages)} disabled={page >= data.pages} onClick={() => setPage(data.pages)}>⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────
// mode: "opportunity" | "lead"
export default function ExcelDataTable({ mode = "opportunity", dept = "All" }) {
  return mode === "opportunity"
    ? <OppTable  dept={dept} />
    : <LeadsTable dept={dept} />;
}
