import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmtCr = (v) => {
  if (!v) return "₹0";
  const cr = v / 10000000;
  return cr >= 1 ? `₹${cr.toFixed(1)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", minWidth: "200px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px", color: "var(--text)", fontSize: "15px" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontSize: "13px", color: p.color, marginBottom: "3px" }}>
          {p.name}:{" "}
          <strong>
            {p.dataKey === "quoted_value" ? fmtCr(p.value) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

export default function OverTimeQuarterly({ data }) {
  if (!data?.length) return <EmptyState />;

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Opportunities Over Time</div>
      <div style={subStyle}>
        Total quoted value &amp; opportunity count grouped by tentative closing quarter
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="quarter"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          {/* Left Y-axis: Quoted Value */}
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={(v) => fmtCr(v)}
          />
          {/* Right Y-axis: Count */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Legend
            wrapperStyle={{ color: "var(--text-muted)", fontSize: "12px", paddingTop: "12px" }}
          />
          <Bar
            yAxisId="left"
            dataKey="quoted_value"
            name="Quoted Value"
            fill="#3b82f6"
            fillOpacity={0.85}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="count"
            name="Opportunity Count"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ fill: "#f59e0b", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrapperStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const titleStyle   = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const subStyle     = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const EmptyState   = () => <div style={{ ...wrapperStyle, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No data available.</div>;
