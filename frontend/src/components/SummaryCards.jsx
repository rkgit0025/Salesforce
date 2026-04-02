const fmt = (n) =>
  n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtCr = (n) => {
  if (n == null) return "—";
  const cr = n / 10000000;
  return `₹${cr.toFixed(2)} Cr`;
};

const card = (label, value, color = "var(--accent)") => ({
  background: "var(--surface)",
  border: `1px solid var(--border)`,
  borderTop: `3px solid ${color}`,
  borderRadius: "var(--radius)",
  padding: "20px 24px",
  minWidth: "160px",
  flex: "1",
});

export default function SummaryCards({ data }) {
  if (!data) return null;

  // Win rate = Closed Won / (Closed Won + Closed Lost) — resolved deals only
  const resolved = (data.closed_won || 0) + (data.closed_lost || 0);
  const winRate =
    resolved > 0
      ? (((data.closed_won || 0) / resolved) * 100).toFixed(1)
      : "0.0";

  const cards = [
    { label: "Total Records", value: fmt(data.total), color: "var(--accent)", note: "Unique opportunities (duplicates merged on upload)" },
    { label: "Closed Won",            value: fmt(data.closed_won),       color: "var(--success)" },
    { label: "Closed Lost",           value: fmt(data.closed_lost),      color: "var(--danger)" },
    { label: "Win Rate (Resolved)",   value: `${winRate}%`,              color: "var(--warning)" },
    { label: "Revenue (Won Deals)",   value: fmtCr(data.total_revenue),  color: "var(--accent2)" },
    { label: "Active Sales Value", value: fmtCr(data.total_quoted),   color: "var(--text-muted)" },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
      {cards.map((c) => (
        <div key={c.label} style={card(c.label, c.value, c.color)}>
          <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {c.label}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
            {c.value}
          </div>
          {c.note && (
            <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px", lineHeight: 1.4 }}>
              {c.note}
            </div>
          )}
        </div>
      ))}

      {/* Department mini-badges */}
      {data.departments && (
        <div style={{ ...card("dept", null, "var(--border)"), display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            By Department
          </div>
          {[
            { key: "biofuels", label: "Biofuels 🌱", color: "#10b981" },
            { key: "sugar",    label: "Sugar 🍬",     color: "#f59e0b" },
            { key: "water",    label: "Water 💧",     color: "#06b6d4" },
            { key: "spares",   label: "Spares ⚙️",    color: "#8b5cf6" },
          ].map((d) => (
            <div key={d.key} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
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
