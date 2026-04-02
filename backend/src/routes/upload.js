const express = require("express");
const multer  = require("multer");
const XLSX    = require("xlsx");
const pool    = require("../db");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// B=Biofuels, P=Spares, S=Sugar, W=Water  (from first char of prefix)
function parseDepartment(num = "") {
  const deptMap = { B: "Biofuels", P: "Spares", S: "Sugar", W: "Water" };
  return deptMap[num.toString().toUpperCase()[0]] || "Unknown";
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  const str = val.toString().trim();
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(str);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const wb    = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) return res.status(400).json({ error: "Excel file is empty" });

    let inserted = 0, updated = 0, skipped = 0;
    const conn = await pool.getConnection();

    try {
      for (const row of rows) {
        const num = row["Opportunity Auto Number"];
        if (!num) { skipped++; continue; }

        const department = parseDepartment(num);

        const values = [
          num.toString().trim(),
          parseDate(row["Created Date"]),
          row["Account Name"]                         || null,
          row["Industry"] || row["Leachate"]          || null,   // "Leachate" col = industry type
          row["Mailing State/Province"]               || null,
          row["Opportunity Owner"]     || null,
          row["Proposal Person"]       || null,
          row["Stage"]                 || null,
          toNum(row["Feed Rate"]),
          row["Unit of Feed Rate"]     || null,
          toNum(row["Quoted Value"]),
          toNum(row["Final Price"]),
          parseDate(row["Close Date"]),
          department,
        ];

        const [result] = await conn.execute(
          `INSERT INTO pipeline
             (opportunity_number, created_date, account_name, industry,
              mailing_state, opportunity_owner, proposal_person, stage,
              feed_rate, unit_of_feed_rate, quoted_value, final_price,
              close_date, department)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             created_date       = VALUES(created_date),
             account_name       = VALUES(account_name),
             industry           = VALUES(industry),
             mailing_state      = VALUES(mailing_state),
             opportunity_owner  = VALUES(opportunity_owner),
             proposal_person    = VALUES(proposal_person),
             stage              = VALUES(stage),
             feed_rate          = VALUES(feed_rate),
             unit_of_feed_rate  = VALUES(unit_of_feed_rate),
             quoted_value       = VALUES(quoted_value),
             final_price        = VALUES(final_price),
             close_date         = VALUES(close_date),
             department         = VALUES(department)`,
          values
        );

        if (result.affectedRows === 1) inserted++;
        else if (result.affectedRows === 2) updated++;
        else skipped++;
      }
    } finally {
      conn.release();
    }

    const duplicates = rows.length - (inserted + updated + skipped);
    res.json({ success: true, summary: { total: rows.length, inserted, updated, skipped, duplicates: updated } });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
