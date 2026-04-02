import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLORS = {
  converted:     "#10b981",
  new_enquiry:   "#3b82f6",
  working:       "#f59e0b",
  not_converted: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", minWidth: "200px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "8px", color: "var(--text)", fontSize: "14px" }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: "12px", color: p.fill, marginBottom: "2px", display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <span>{p.name}</span><strong>{p.value}</strong>
        </div>
      ))}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: "6px", paddingTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
        <span>Total</span><strong style={{ color: "var(--text)" }}>{total}</strong>
      </div>
    </div>
  );
};

export default function LeadByOwner({ data }) {
  if (!data?.length) return <EmptyState />;

  // Truncate long names for X-axis
  const display = data.map(d => ({
    ...d,
    short: d.lead_owner.split(" ").slice(0, 2).join(" "),
  }));

  const chartH = Math.max(340, display.length * 46);

  return (
    <div style={wrap}>
      <div style={title}>Leads by Lead Owner</div>
      <div style={sub}>Total leads per owner, stacked by status</div>
      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart data={display} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis type="category" dataKey="short" width={140} stroke="var(--text-muted)" tick={{ fill: "var(--text)", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: "12px", paddingTop: "12px" }} />
          <Bar dataKey="converted"     name="Converted"      stackId="a" fill={STATUS_COLORS.converted}     radius={[0,0,0,0]} />
          <Bar dataKey="new_enquiry"   name="New Enquiry"    stackId="a" fill={STATUS_COLORS.new_enquiry}   radius={[0,0,0,0]} />
          <Bar dataKey="working"       name="Working"        stackId="a" fill={STATUS_COLORS.working}       radius={[0,0,0,0]} />
          <Bar dataKey="not_converted" name="Not Converted"  stackId="a" fill={STATUS_COLORS.not_converted} radius={[0,6,6,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrap  = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px" };
const title = { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" };
const sub   = { color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" };
const EmptyState = () => <div style={{ ...wrap, padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No leads data. Upload a Leads file first.</div>;
