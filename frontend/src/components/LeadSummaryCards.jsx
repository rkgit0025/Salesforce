const fmt = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");

const cardStyle = (color) => ({
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderTop: `3px solid ${color}`,
  borderRadius: "var(--radius)",
  padding: "20px 24px",
  minWidth: "150px",
  flex: "1",
});

export default function LeadSummaryCards({ data }) {
  if (!data) return null;

  const cards = [
    { label: "Total Leads",    value: fmt(data.total),         color: "var(--accent)",   icon: null },
    { label: "Top Lead Owner", value: data.top_owner || "—",   color: "#06b6d4",         icon: "👤" },
    { label: "Top State",      value: data.top_state || "—",   color: "#8b5cf6",         icon: "📍" },
    { label: "Top Industry",   value: data.top_industry || "—",color: "#f59e0b",         icon: "🏭" },
    { label: "Total Won",      value: fmt(data.total_won),     color: "var(--success)",  icon: null },
    { label: "Total Lost",     value: fmt(data.total_lost),    color: "var(--danger)",   icon: null },
    { label: "Total Ongoing",  value: fmt(data.total_ongoing), color: "var(--warning)",  icon: null },
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

