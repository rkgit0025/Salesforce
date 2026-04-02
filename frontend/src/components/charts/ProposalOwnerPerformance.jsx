import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, LabelList,
} from "recharts";

const COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16","#a78bfa","#fb923c",
  "#34d399","#60a5fa","#f472b6","#facc15",
];

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(1)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: "8px", padding: "12px 16px", minWidth: "200px",
    }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px", color: "var(--text)", fontSize: "13px" }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
        <span>Total Opportunities: <strong style={{ color: "var(--text)" }}>{d?.count}</strong></span>
        <span>Closed Won: <strong style={{ color: "#10b981" }}>{d?.closed_won}</strong></span>
        <span>Total Quoted: <strong style={{ color: "var(--accent)" }}>{fmtCr(d?.quoted_value)}</strong></span>
        <span>Won Value: <strong style={{ color: "#f59e0b" }}>{fmtCr(d?.won_value)}</strong></span>
      </div>
    </div>
  );
};

const toggleBtn = (val, current, setter, label) => (
  <button
    key={val}
    onClick={() => setter(val)}
    style={{
      padding: "6px 14px", fontSize: "12px", fontFamily: "var(--font-body)",
      fontWeight: 500, borderRadius: "6px", cursor: "pointer", border: "1px solid var(--border)",
      background: current === val ? "var(--accent)" : "var(--surface2)",
      color: current === val ? "#fff" : "var(--text-muted)",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

export default function ProposalOwnerPerformance({ data }) {
  const [metric, setMetric] = useState("count");

  if (!data || !Array.isArray(data) || data.length === 0) return <EmptyState />;

  // Merge case-insensitive name variants from the backend (e.g. "Pradip" vs "Pradip Gore")
  // Backend already does GROUP BY COALESCE(TRIM(...)) so true duplicates are gone.
  // This just handles capitalisation variants like "yogesh Borade" vs "Yogesh Borade".
  const mergeMap = {};
  for (const row of data) {
    const key = row.proposal_person.trim().toLowerCase();
    if (!mergeMap[key]) {
      mergeMap[key] = {
        proposal_person: row.proposal_person.trim(),
        count:           Number(row.count)        || 0,
        closed_won:      Number(row.closed_won)   || 0,
        quoted_value:    Number(row.quoted_value) || 0,
        won_value:       Number(row.won_value)    || 0,
      };
    } else {
      mergeMap[key].count        += Number(row.count)        || 0;
      mergeMap[key].closed_won   += Number(row.closed_won)   || 0;
      mergeMap[key].quoted_value += Number(row.quoted_value) || 0;
      mergeMap[key].won_value    += Number(row.won_value)    || 0;
    }
  }

  const sorted = Object.values(mergeMap)
    .filter(d => (d[metric] ?? 0) > 0 || metric === "count")
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, 15);

  if (!sorted.length) return <EmptyState />;

  const chartH = Math.max(340, sorted.length * 46);

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <div style={titleStyle}>Proposal Owner Performance</div>
          <div style={subStyle}>Number of opportunities handled by each Proposal Owner</div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {toggleBtn("count",        metric, setMetric, "📋 Count")}
          {toggleBtn("closed_won",   metric, setMetric, "✅ Won Count")}
          {toggleBtn("quoted_value", metric, setMetric, "💰 Quoted Value")}
          {toggleBtn("won_value",    metric, setMetric, "🏆 Won Value")}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(v) => metric === "quoted_value" || metric === "won_value" ? fmtCr(v) : v}
          />
          <YAxis
            type="category"
            dataKey="proposal_person"
            width={150}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Bar dataKey={metric} radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey={metric}
              position="right"
              style={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }}
              formatter={(v) => metric === "quoted_value" || metric === "won_value" ? fmtCr(v) : v}
            />
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend strip */}
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {sorted.map((d, i) => (
          <div key={d.proposal_person} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            {d.proposal_person}
          </div>
        ))}
      </div>
    </div>
  );
}

const wrapperStyle = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "24px",
};
const titleStyle = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const subStyle   = { color: "var(--text-muted)", fontSize: "13px" };
const EmptyState = () => (
  <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
    No proposal owner data available.
  </div>
);
