import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, LabelList,
} from "recharts";

const OWNER_COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16","#a78bfa","#fb923c",
  "#34d399","#60a5fa","#f472b6","#facc15",
];
const INDUSTRY_COLORS = [
  "#0ea5e9","#22c55e","#f59e0b","#e11d48",
  "#8b5cf6","#06b6d4","#f97316","#84cc16",
  "#14b8a6","#ec4899","#a78bfa","#facc15",
  "#3b82f6","#10b981","#fb923c","#60a5fa",
];

const fmtCr = (v) => {
  if (!v && v !== 0) return "₹0";
  const cr = v / 10000000;
  if (cr >= 1) return `₹${cr.toFixed(2)}Cr`;
  const lac = v / 100000;
  if (lac >= 1) return `₹${lac.toFixed(1)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const toggleBtn = (val, current, setter, label) => (
  <button
    key={val}
    onClick={() => setter(val)}
    style={{
      padding: "6px 16px", fontSize: "12px", fontFamily: "var(--font-body)",
      fontWeight: 600, borderRadius: "6px", cursor: "pointer",
      border: "1.5px solid var(--border)",
      background: current === val ? "var(--accent)" : "var(--surface2)",
      color: current === val ? "#fff" : "var(--text-muted)",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

const CustomTooltip = ({ active, payload, label, view }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: "8px", padding: "12px 16px", minWidth: "200px",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 700,
        marginBottom: "8px", color: "var(--text)", fontSize: "13px",
      }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "5px" }}>
        {view === "owner" && (
          <>
            <span>Opportunity Owner: <strong style={{ color: "var(--text)" }}>{d?.owner}</strong></span>
            <span>Industry: <strong style={{ color: "var(--accent)" }}>{d?.industry || "—"}</strong></span>
            <span>State: <strong style={{ color: "var(--text)" }}>{d?.state || "—"}</strong></span>
          </>
        )}
        {view === "industry" && (
          <span>Industry Type: <strong style={{ color: "var(--accent)" }}>{d?.industry}</strong></span>
        )}
        <span>Closed Won Count: <strong style={{ color: "#10b981" }}>{d?.count}</strong></span>
        <span>Final Value: <strong style={{ color: "#f59e0b" }}>{fmtCr(d?.final_value)}</strong></span>
      </div>
    </div>
  );
};

export default function ClosedWonValueChart({ data }) {
  const [view, setView] = useState("owner");

  if (!data) return <EmptyState />;

  const ownerData  = (data.byOwner    || []).filter(d => d.final_value > 0).sort((a, b) => b.final_value - a.final_value);
  const industryData = (data.byIndustry || []).filter(d => d.final_value > 0).sort((a, b) => b.final_value - a.final_value);

  const chartData = view === "owner" ? ownerData : industryData;
  const colors    = view === "owner" ? OWNER_COLORS : INDUSTRY_COLORS;
  const nameKey   = view === "owner" ? "owner" : "industry";

  if (!chartData.length) return <EmptyState />;

  const chartH = Math.max(360, chartData.length * 52);

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "24px",
      }}>
        <div>
          <div style={titleStyle}>
            🏆 Closed Won — Final Value Analysis
          </div>
          <div style={subStyle}>
            {view === "owner"
              ? "Final value (₹) achieved per Opportunity Owner · Stage: Closed Won"
              : "Final value (₹) achieved per Industry Type · Stage: Closed Won"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {toggleBtn("owner",    view, setView, "👤 By Owner")}
          {toggleBtn("industry", view, setView, "🏭 By Industry")}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px",
        padding: "12px 16px",
        background: "var(--surface2)", borderRadius: "8px",
        border: "1px solid var(--border)",
      }}>
        <Stat label="Total Closed Won" value={chartData.reduce((s, d) => s + (d.count || 0), 0)} icon="✅" />
        <div style={{ width: "1px", background: "var(--border)" }} />
        <Stat label="Total Final Value" value={fmtCr(chartData.reduce((s, d) => s + (d.final_value || 0), 0))} icon="💰" isStr />
        <div style={{ width: "1px", background: "var(--border)" }} />
        <Stat label={view === "owner" ? "Top Owner" : "Top Industry"}
              value={chartData[0]?.[nameKey] || "—"} icon="🥇" isStr />
      </div>

      {/* Bar Chart — vertical bars, owner on X, final value on Y */}
      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={chartData}
          margin={{ top: 24, right: 20, left: 20, bottom: view === "owner" ? 80 : 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey={nameKey}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text)", fontSize: 11, fontFamily: "var(--font-body)" }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={view === "owner" ? 90 : 70}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={fmtCr}
            width={80}
          />
          <Tooltip
            content={<CustomTooltip view={view} />}
            cursor={{ fill: "rgba(59,130,246,0.07)" }}
          />
          <Bar dataKey="final_value" radius={[6, 6, 0, 0]} maxBarSize={60}>
            <LabelList
              dataKey="final_value"
              position="top"
              style={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-body)" }}
              formatter={fmtCr}
            />
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {chartData.map((d, i) => (
          <div key={d[nameKey]} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length], flexShrink: 0 }} />
            {d[nameKey]}
          </div>
        ))}
      </div>
    </div>
  );
}

const Stat = ({ label, value, icon, isStr }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {icon} {label}
    </span>
    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>
      {isStr ? value : value.toLocaleString("en-IN")}
    </span>
  </div>
);

const wrapperStyle = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "24px",
};
const titleStyle = {
  fontFamily: "var(--font-display)", fontSize: "16px",
  fontWeight: 700, marginBottom: "4px", color: "var(--text)",
};
const subStyle = { color: "var(--text-muted)", fontSize: "13px" };
const EmptyState = () => (
  <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
    No Closed Won data with final value available.
  </div>
);
