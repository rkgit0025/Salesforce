const fmt    = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");

export default function LeadSummaryCards({ data }) {
  if (!data) return null;

  const cards = [
    { label: "Total Leads",        value: fmt(data.total),            color: "var(--accent)" },
    { label: "Converted",          value: fmt(data.converted),         color: "var(--success)" },
    { label: "Not Converted",      value: fmt(data.not_converted),     color: "var(--danger)" },
    { label: "Conversion Rate",    value: `${data.conversion_rate}%`,  color: "var(--warning)" },
    { label: "New Enquiry",        value: fmt(data.new_enquiry),       color: "var(--accent2)" },
    { label: "Working",            value: fmt(data.working),           color: "var(--text-muted)" },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderTop: `3px solid ${c.color}`, borderRadius: "var(--radius)",
          padding: "20px 24px", minWidth: "150px", flex: "1",
        }}>
          <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {c.label}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700 }}>
            {c.value}
          </div>
        </div>
      ))}

      {data.departments && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderTop: "3px solid var(--border)", borderRadius: "var(--radius)",
          padding: "20px 24px", flex: "1", minWidth: "160px",
        }}>
          <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            By Department
          </div>
          {[
            { key: "biofuels", label: "Biofuels 🌱", color: "#10b981" },
            { key: "sugar",    label: "Sugar 🍬",     color: "#f59e0b" },
            { key: "water",    label: "Water 💧",     color: "#06b6d4" },
            { key: "spares",   label: "Spares ⚙️",    color: "#8b5cf6" },
          ].map((d) => (
            <div key={d.key} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{d.label}</span>
              <span style={{ fontWeight: 600, color: d.color, fontFamily: "var(--font-display)" }}>
                {fmt(data.departments[d.key])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
