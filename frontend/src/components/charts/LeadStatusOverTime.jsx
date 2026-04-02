import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = {
  "Converted":           "#10b981",
  "New Enquiry":         "#3b82f6",
  "Working - Contacted": "#f59e0b",
  "Working":             "#8b5cf6",
  "Not Converted":       "#ef4444",
};
const DEFAULT_COLORS = ["#06b6d4","#ec4899","#f97316","#84cc16","#14b8a6"];

export default function LeadStatusOverTime({ data, statuses }) {
  if (!data?.length) return <EmptyState />;

  return (
    <div style={wrap}>
      <div style={title}>Leads by Status Over Time</div>
      <div style={sub}>Count of leads per status, grouped by month of creation</div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            {statuses.map((s, i) => {
              const c = COLORS[s] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <linearGradient key={s} id={`lg-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={c} stopOpacity={0.04} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px" }}
            labelStyle={{ color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: "12px", paddingTop: "12px" }} />
          {statuses.map((s, i) => {
            const c = COLORS[s] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <Area key={s} type="monotone" dataKey={s} stackId="1"
                stroke={c} fill={`url(#lg-${i})`} strokeWidth={2} />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrap  = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const title = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const sub   = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const EmptyState = () => <div style={{ ...wrap, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No leads data. Upload a Leads file first.</div>;
