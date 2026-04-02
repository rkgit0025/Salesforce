import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// Distinct palette for up to 10 stages
const COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16",
];

export default function StatusOverTime({ data, stages }) {
  if (!data?.length) {
    return (
      <div style={emptyStyle}>No data available for this section yet.</div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Stage Status Over Time</div>
      <div style={subStyle}>Count of records per stage, grouped by month of creation</div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            {stages.map((s, i) => (
              <linearGradient key={s} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS[i % COLORS.length]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px" }}
            labelStyle={{ color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}
            itemStyle={{ color: "var(--text-muted)" }}
          />
          <Legend
            wrapperStyle={{ color: "var(--text-muted)", fontSize: "12px", paddingTop: "12px" }}
          />
          {stages.map((s, i) => (
            <Area
              key={s}
              type="monotone"
              dataKey={s}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={`url(#grad-${i})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrapperStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "24px",
};
const titleStyle = {
  fontFamily: "var(--font-display)",
  fontSize: "16px",
  fontWeight: 700,
  marginBottom: "4px",
};
const subStyle = {
  color: "var(--text-muted)",
  fontSize: "13px",
  marginBottom: "20px",
};
const emptyStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "48px",
  textAlign: "center",
  color: "var(--text-muted)",
};
