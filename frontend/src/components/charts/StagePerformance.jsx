import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#ec4899","#f97316","#84cc16","#14b8a6",
];

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(1)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill, fontSize: "13px", marginBottom: "2px" }}>
          {p.name}: <strong>{p.dataKey === "quoted_value" ? fmtCr(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function StagePerformance({ data }) {
  if (!data?.length) return <EmptyState />;

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Stage Performance</div>
      <div style={subStyle}>Opportunity count &amp; total quoted value per stage</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Count chart */}
        <div>
          <div style={miniLabel}>Opportunity Count</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" width={160} stroke="var(--text-muted)" tick={{ fill: "var(--text)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
              <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quoted Value chart */}
        <div>
          <div style={miniLabel}>Total Quoted Value</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickFormatter={(v) => fmtCr(v)} />
              <YAxis type="category" dataKey="stage" width={160} stroke="var(--text-muted)" tick={{ fill: "var(--text)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
              <Bar dataKey="quoted_value" name="Quoted Value" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

const wrapperStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const titleStyle   = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const subStyle     = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const miniLabel    = { color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" };
const EmptyState   = () => <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No data available.</div>;
