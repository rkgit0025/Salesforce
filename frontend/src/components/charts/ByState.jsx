import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16","#a78bfa","#fb923c",
  "#34d399","#60a5fa","#f472b6","#facc15",
  "#4ade80","#38bdf8","#c084fc","#fb7185",
];

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(2)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", minWidth: "200px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>
        Quoted Value: <strong style={{ color: "var(--accent2)" }}>{fmtCr(d?.quoted_value)}</strong>
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        Opportunities: <strong style={{ color: "var(--text)" }}>{d?.count}</strong>
      </div>
    </div>
  );
};

const ValueLabel = ({ x, y, width, value }) => (
  <text x={x + width + 8} y={y + 12} fill="var(--text-muted)" fontSize={11} fontFamily="var(--font-body)">
    {fmtCr(value)}
  </text>
);

export default function ByState({ data }) {
  if (!data?.length) return <EmptyState />;

  const chartHeight = Math.max(300, data.length * 40);

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Total Quoted Value by State</div>
      <div style={subStyle}>
        States with quoted value &gt; 0 · Normalized state names (TN/Tamil Nadu → Tamil Nadu, etc.)
      </div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 100, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(v) => fmtCr(v)}
          />
          <YAxis
            type="category"
            dataKey="state"
            width={140}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Bar dataKey="quoted_value" radius={[0, 6, 6, 0]} label={<ValueLabel />}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrapperStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const titleStyle   = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const subStyle     = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const EmptyState   = () => <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No data available.</div>;
