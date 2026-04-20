import { useState } from "react";
import { OpportunityPanel, LeadsPanel, ExcelDataPanel } from "./components/DashboardPanel";
import { uploadOpportunities, uploadLeads } from "./api";

// ── Reusable upload zone ──────────────────────────────────────────────
function UploadZone({ title, hint, uploadFn, onSuccess, color = "var(--accent)" }) {
  const [drag, setDrag]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [prog, setProg]       = useState(0);
  const [result, setResult]   = useState(null);
  const inputRef              = { current: null };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setResult({ type: "error", msg: "Please upload a valid .xlsx or .xls file." });
      return;
    }
    setLoading(true); setResult(null); setProg(0);
    try {
      const { data } = await uploadFn(file, setProg);
      const s = data.summary;
      setResult({ type: "ok", msg: `✅ ${s.total} rows · ${s.inserted} new · ${s.updated} updated · ${s.skipped} skipped` });
      onSuccess?.();
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Upload failed." });
    } finally { setLoading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); };

  return (
    <div
      onClick={() => !loading && document.getElementById(`fi-${title}`)?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      style={{
        flex: 1, minWidth: "220px",
        background: "var(--surface2)",
        border: `2px dashed ${drag ? color : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "20px 24px",
        cursor: loading ? "default" : "pointer",
        transition: "border-color 0.2s",
      }}
    >
      <input id={`fi-${title}`} type="file" accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <span style={{ fontSize: "20px" }}>📊</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color }}>
          {title}
        </span>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "8px" }}>{hint}</div>

      {loading && (
        <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${prog}%`, background: color, transition: "width 0.3s" }} />
        </div>
      )}
      {result && (
        <div style={{
          marginTop: "8px", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
          background: result.type === "ok" ? "#0d2e1f" : "#2e0d0d",
          color: result.type === "ok" ? "var(--success)" : "var(--danger)",
          border: `1px solid ${result.type === "ok" ? "#134d30" : "#4d1313"}`,
        }}>
          {result.msg}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
const TABS = [
  { key: "lead",        label: "Leads",          icon: "🌱", desc: "BLG · PLG · SLG · WLG" },
  { key: "opportunity", label: "Opportunities",  icon: "🎯", desc: "BOG · POG · SOG · WOG" },
  { key: "excel",       label: "Excel Data",     icon: "📋", desc: "Cross-verify raw records" },
];

export default function App() {
  const [activeTab,  setActiveTab]  = useState("lead");
  const [oppKey,     setOppKey]     = useState(0);
  const [leadKey,    setLeadKey]    = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={hdrStyle}>
        <div style={hdrInner}>
          <div>
            <div style={logoStyle}><span style={{ color: "var(--accent)" }}>▲</span> Salesforce Insight</div>
            <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>
              Sales Data· FY Analytics
            </div>
          </div>
          <button style={uploadBtnStyle} onClick={() => setUploadOpen(o => !o)}>
            {uploadOpen ? "✕ Close" : "⬆ Upload Data"}
          </button>
        </div>

        {/* ── Upload panel — two zones side by side ── */}
        {uploadOpen && (
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px 20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Upload files — each file goes to its own table
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <UploadZone
                title="Opportunities File"
                hint="Sales_Exec_Pipeline.xlsx · BOG / POG / SOG / WOG"
                uploadFn={uploadOpportunities}
                color="var(--accent)"
                onSuccess={() => { setOppKey(k => k + 1); setUploadOpen(false); }}
              />
              <UploadZone
                title="Leads File"
                hint="Leads_Detail_Report.xlsx · BLG / PLG / SLG / WLG"
                uploadFn={uploadLeads}
                color="var(--success)"
                onSuccess={() => { setLeadKey(k => k + 1); setUploadOpen(false); }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Tabs ── */}
      <div style={tabBarStyle}>
        <div style={tabBarInner}>
          {TABS.map(t => (
            <button key={t.key} style={{ ...tabStyle, ...(activeTab === t.key ? tabActive : {}) }}
              onClick={() => setActiveTab(t.key)}>
              <span>{t.icon}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{t.label}</span>
              <span style={{ fontSize: "11px", color: activeTab === t.key ? "rgba(255,255,255,0.55)" : "var(--text-muted)" }}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={mainStyle}>
        {activeTab === "opportunity"
          ? <OpportunityPanel refreshKey={oppKey} />
          : activeTab === "excel"
          ? <ExcelDataPanel />
          : <LeadsPanel       refreshKey={leadKey} />
        }
      </main>

    <footer
  style={{
    textAlign: "center",
    padding: "16px",
    color: "var(--text-muted)",
    fontSize: "12px",
    borderTop: "1px solid var(--border)",
  }}
>
  © {new Date().getFullYear()} Developed by{" "}
  <span style={{ color: "var(--accent)" }}>SED - IT Department</span>
</footer>
    </div>
  );
}

const hdrStyle      = { background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 };
const hdrInner      = { maxWidth: "1400px", margin: "0 auto", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const logoStyle     = { fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "8px" };
const uploadBtnStyle= { padding: "9px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "14px", cursor: "pointer" };
const tabBarStyle   = { background: "var(--surface)", borderBottom: "1px solid var(--border)" };
const tabBarInner   = { maxWidth: "1400px", margin: "0 auto", padding: "0 32px", display: "flex", gap: "4px" };
const tabStyle      = { display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px", background: "transparent", border: "none", borderBottom: "3px solid transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px", transition: "all 0.15s" };
const tabActive     = { color: "var(--text)", borderBottomColor: "var(--accent)" };
const mainStyle     = { flex: 1, maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px" };
