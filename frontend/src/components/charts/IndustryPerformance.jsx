import { useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar,
} from "recharts";

const COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16","#a78bfa","#fb923c",
  "#34d399","#60a5fa","#f472b6","#facc15",
  "#4ade80","#38bdf8","#c084fc","#fb7185",
  "#fbbf24","#a3e635","#2dd4bf","#e879f9",
];

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(1)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const BubbleTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", minWidth: "180px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>{d.industry}</div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>Count: <strong style={{ color: "var(--text)" }}>{d.count}</strong></div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Quoted: <strong style={{ color: "var(--text)" }}>{fmtCr(d.quoted_value)}</strong></div>
    </div>
  );
};

const BarTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--accent)" }}>
        {metric === "quoted_value" ? fmtCr(payload[0]?.value) : payload[0]?.value}
      </div>
    </div>
  );
};

export default function IndustryPerformance({ data }) {
  const [chartType, setChartType] = useState("bubble"); // "bubble" | "bar"
  const [metric, setMetric]       = useState("count");  // "count" | "quoted_value"

  if (!data?.length) return <EmptyState />;

  // Sort by selected metric desc, limit to 20 for bar
  const sorted = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 20);

  const toggleBtn = (val, current, setter, label) => (
    <button
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

  return (
    <div style={wrapperStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <div style={titleStyle}>Industry Performance</div>
          <div style={subStyle}>Select chart type and metric to visualize industry data</div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {toggleBtn("bubble",       chartType, setChartType, "🫧 Bubble")}
          {toggleBtn("bar",          chartType, setChartType, "📊 Bar")}
          <div style={{ width: "1px", background: "var(--border)", margin: "0 4px" }} />
          {toggleBtn("count",        metric,    setMetric,    "Opportunity Count")}
          {toggleBtn("quoted_value", metric,    setMetric,    "Total Quoted Value")}
        </div>
      </div>

      {chartType === "bubble" ? (
        <BubbleView data={data} metric={metric} />
      ) : (
        <BarView data={sorted} metric={metric} />
      )}
    </div>
  );
}

function BubbleView({ data, metric }) {
  // Sort by metric desc for consistent layout
  const sorted = [...data].sort((a, b) => b[metric] - a[metric]);

  const bubbleData = sorted.map((d, i) => ({
    ...d,
    x: i + 1,
    y: d[metric],
    z: metric === "count"
      ? Math.max(d.count * 6, 40)
      : Math.max(d.quoted_value / 8000000, 40),
  }));

  if (bubbleData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={440}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, bubbleData.length + 1]}
          tickCount={Math.min(bubbleData.length, 10)}
          stroke="var(--border)"
          tick={false}
          label={{
            value: "Industries (hover bubble for details)",
            position: "insideBottom",
            offset: -15,
            fill: "var(--text-muted)",
            fontSize: 12,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          stroke="var(--text-muted)"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickFormatter={(v) => metric === "quoted_value" ? fmtCr(v) : v}
          width={70}
        />
        <ZAxis type="number" dataKey="z" range={[60, 900]} />
        <Tooltip content={<BubbleTooltip />} cursor={false} />
        <Scatter data={bubbleData} fillOpacity={0.82}>
          {bubbleData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function BarView({ data, metric }) {
  const barH = Math.max(360, data.length * 38);
  return (
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number" stroke="var(--text-muted)"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickFormatter={(v) => metric === "quoted_value" ? fmtCr(v) : v}
        />
        <YAxis type="category" dataKey="industry" width={170} stroke="var(--text-muted)" tick={{ fill: "var(--text)", fontSize: 11 }} />
        <Tooltip
          content={<BarTooltip metric={metric} />}
          cursor={{ fill: "rgba(59,130,246,0.06)" }}
        />
        <Bar dataKey={metric} radius={[0, 6, 6, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const wrapperStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const titleStyle   = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const subStyle     = { color: "var(--text-muted)", fontSize: "13px" };
const EmptyState   = () => <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No data available.</div>;
