import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899",
  "#14b8a6","#f97316","#84cc16","#a78bfa","#fb923c","#34d399","#60a5fa","#f472b6",
  "#facc15","#4ade80","#38bdf8","#c084fc","#fb7185"];

const LabelRight = ({ x, y, width, value }) => (
  <text x={x + width + 8} y={y + 12} fill="var(--text-muted)" fontSize={11}>{value}</text>
);

export default function LeadByState({ data }) {
  if (!data?.length) return <EmptyState />;
  const chartH = Math.max(300, data.length * 36);
  return (
    <div style={wrap}>
      <div style={title}>Leads by Region (State)</div>
      <div style={sub}>Number of leads per state · normalized state names</div>
      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis type="category" dataKey="state" width={140} stroke="var(--text-muted)" tick={{ fill: "var(--text)", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(59,130,246,0.06)" }}
            contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px" }}
            labelStyle={{ color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}
            formatter={(v) => [v, "Leads"]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} label={<LabelRight />}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrap  = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const title = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const sub   = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const EmptyState = () => <div style={{ ...wrap, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No leads data. Upload a Leads file first.</div>;
