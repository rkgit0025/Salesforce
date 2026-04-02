const fmtNum = (n) =>
  n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtCr = (n) => {
  if (n == null || Number(n) === 0) return "₹0";
  const cr = Number(n) / 10000000;
  if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
  const lac = Number(n) / 100000;
  return `₹${lac.toFixed(2)} L`;
};

const cardStyle = (color) => ({
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderTop: `3px solid ${color}`,
  borderRadius: "var(--radius)",
  padding: "20px 24px",
  minWidth: "160px",
  flex: "1",
});

export default function SummaryCards({ data }) {
  if (!data) return null;

  const cards = [
    { label: "Total Opportunity",   value: fmtNum(data.total),              color: "var(--accent)",      icon: null },
    { label: "Closed Won",          value: fmtNum(data.closed_won),          color: "var(--success)",     icon: null },
    { label: "Total Quoted Value",  value: fmtCr(data.total_quoted_value),   color: "var(--warning)",     icon: null },
    { label: "Final Value",         value: fmtCr(data.final_value),          color: "var(--accent2)",     icon: null },
    { label: "Top Owner",           value: data.top_owner || "—",            color: "#06b6d4",            icon: "👤" },
    { label: "Top State",           value: data.top_state || "—",            color: "#8b5cf6",            icon: "📍" },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
      {cards.map((c) => (
        <div key={c.label} style={cardStyle(c.color)}>
          <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {c.label}
          </div>
          {c.icon ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "18px" }}>{c.icon}</span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.value}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
              {c.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

