import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#ec4899","#14b8a6","#f97316","#84cc16",
  "#a78bfa","#fb923c","#34d399","#60a5fa","#f472b6",
  "#facc15","#4ade80","#38bdf8","#c084fc","#fb7185",
];

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(1)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: "8px", padding: "12px 16px", minWidth: "200px", maxWidth: "280px",
    }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px", color: "var(--text)", fontSize: "13px" }}>
        📍 {label}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", marginBottom: "6px" }}>
        Total: {fmtCr(total)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "180px", overflowY: "auto" }}>
        {[...payload].reverse().map((p) => (
          p.value > 0 && (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "11px" }}>
              <span style={{ color: p.fill, fontWeight: 500 }}>● {p.name}</span>
              <span style={{ color: "var(--text)" }}>{fmtCr(p.value)}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

function pivotData(rows, groupKey, topStates = 12, topGroups = 10) {
  // Sum total per state → pick top N states
  const stateTotals = {};
  for (const r of rows) {
    stateTotals[r.state] = (stateTotals[r.state] || 0) + r.won_value;
  }
  const topStateNames = Object.entries(stateTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topStates)
    .map(([s]) => s);

  // Sum total per group → pick top N groups (for legend/colors)
  const groupTotals = {};
  for (const r of rows) {
    groupTotals[r[groupKey]] = (groupTotals[r[groupKey]] || 0) + r.won_value;
  }
  const topGroupNames = Object.entries(groupTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topGroups)
    .map(([g]) => g);

  // Build pivot: [{state, [group]: won_value, ...}]
  const pivot = {};
  for (const state of topStateNames) pivot[state] = { state };

  for (const r of rows) {
    if (!topStateNames.includes(r.state)) continue;
    const grp = topGroupNames.includes(r[groupKey]) ? r[groupKey] : "Others";
    pivot[r.state][grp] = (pivot[r.state][grp] || 0) + r.won_value;
  }

  const chartData = topStateNames.map((s) => pivot[s]);
  const groups    = [...topGroupNames, "Others"].filter((g) =>
    chartData.some((d) => d[g] > 0)
  );

  return { chartData, groups };
}

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

export default function ClosedWonByState({ data }) {
  const [groupBy, setGroupBy] = useState("owner"); // "owner" | "industry"

  if (!data?.byOwner?.length && !data?.byIndustry?.length) return <EmptyState />;

  const rows     = groupBy === "owner" ? data.byOwner : data.byIndustry;
  const groupKey = groupBy === "owner" ? "owner" : "industry";

  const { chartData, groups } = useMemo(
    () => pivotData(rows, groupKey),
    [rows, groupKey]
  );

  if (!chartData.length) return <EmptyState />;

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <div style={titleStyle}>Closed Won Value by State</div>
          <div style={subStyle}>
            State-wise breakdown of closed won opportunities — stacked by {groupBy === "owner" ? "Opportunity Owner" : "Industry Type"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {toggleBtn("owner",    groupBy, setGroupBy, "👤 By Opportunity Owner")}
          {toggleBtn("industry", groupBy, setGroupBy, "🏭 By Industry Type")}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="state"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text)", fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={70}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={fmtCr}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Legend
            wrapperStyle={{ paddingTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}
            iconType="square"
            iconSize={10}
          />
          {groups.map((grp, i) => (
            <Bar
              key={grp}
              dataKey={grp}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              radius={i === groups.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Summary strip */}
      <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {chartData.map((d) => {
          const total = groups.reduce((s, g) => s + (d[g] || 0), 0);
          return total > 0 ? (
            <div key={d.state} style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: "6px", padding: "6px 12px", fontSize: "11px",
            }}>
              <span style={{ color: "var(--text-muted)" }}>{d.state}: </span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmtCr(total)}</span>
            </div>
          ) : null;
        })}
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
    No closed won state data available.
  </div>
);
