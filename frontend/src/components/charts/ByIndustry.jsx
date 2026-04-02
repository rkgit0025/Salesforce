import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6","#06b6d4","#10b981","#f59e0b",
  "#ef4444","#8b5cf6","#ec4899","#14b8a6",
  "#f97316","#84cc16","#a78bfa","#fb923c",
];

const CustomLabel = ({ x, y, width, value }) => (
  <text
    x={x + width + 8}
    y={y + 12}
    fill="var(--text-muted)"
    fontSize={12}
    fontFamily="var(--font-body)"
  >
    {value}
  </text>
);

export default function ByIndustry({ data }) {
  if (!data?.length) {
    return (
      <div style={emptyStyle}>No data available for this section yet.</div>
    );
  }

  // Sort descending, cap at 20 for readability
  const sorted = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const chartHeight = Math.max(320, sorted.length * 38);

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Distribution by Industry</div>
      <div style={subStyle}>Number of records per industry type</div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="industry"
            width={170}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(59,130,246,0.08)" }}
            contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px" }}
            labelStyle={{ color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}
            itemStyle={{ color: "var(--text-muted)" }}
            formatter={(v) => [v, "Records"]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} label={<CustomLabel />}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
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
