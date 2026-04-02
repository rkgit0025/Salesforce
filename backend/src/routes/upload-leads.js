const express  = require("express");
const multer   = require("multer");
const XLSX     = require("xlsx");
const pool     = require("../db");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Leads file has 9 metadata rows before real headers ───────────────
const HEADER_ROW = 9;

function parseDate(val) {
  if (!val) return null;
  const s = val.toString().trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

// BLG/BLF=Biofuels, PLG/PLF=Spares, SLG/SLF=Sugar, WLG/WLF=Water
// G=current FY, F=previous FY
function parseLeadPrefix(num = "") {
  const p = num.toString().toUpperCase().slice(0, 3);
  const deptMap = { B: "Biofuels", P: "Spares", S: "Sugar", W: "Water" };
  const department = deptMap[p[0]] || "Unknown";
  const fy_suffix  = p[2] || null;
  return { department, fy_suffix };
}

// ── Comprehensive state normalization ────────────────────────────────
// Keys are always uppercased before lookup → case-insensitive matching
const STATE_MAP = {
  // Tamil Nadu
  "TN":"Tamil Nadu","TAMIL NADU":"Tamil Nadu","TAMILNADU":"Tamil Nadu","TAMILNADU":"Tamil Nadu",
  // Karnataka
  "KA":"Karnataka","KARNATAKA":"Karnataka",
  "BANGALORE":"Karnataka","BENGALURU":"Karnataka",
  // Maharashtra
  "MH":"Maharashtra","MAHARASHTRA":"Maharashtra","MAHARASHTA":"Maharashtra",
  "PUNE":"Maharashtra","MUMBAI":"Maharashtra","NAGPUR":"Maharashtra",
  // Gujarat
  "GJ":"Gujarat","GUJARAT":"Gujarat","GUJRAT":"Gujarat",
  "VADODARA":"Gujarat","AHMEDABAD":"Gujarat","SURAT":"Gujarat",
  // Uttar Pradesh
  "UP":"Uttar Pradesh","U.P":"Uttar Pradesh","UTTAR PRADESH":"Uttar Pradesh",
  "UTTARPRADESH":"Uttar Pradesh","UTTAR PRADESH, INDIA.":"Uttar Pradesh",
  "UTTAR PRADESH, INDIA":"Uttar Pradesh",
  // Rajasthan
  "RJ":"Rajasthan","RAJASTHAN":"Rajasthan",
  "JODHPUR":"Rajasthan","JAIPUR":"Rajasthan","UDAIPUR":"Rajasthan",
  // Punjab
  "PB":"Punjab","PUNJAB":"Punjab",
  // Haryana
  "HR":"Haryana","HARYANA":"Haryana",
  // Telangana
  "TS":"Telangana","TELANGANA":"Telangana","HYDERABAD":"Telangana",
  // Madhya Pradesh
  "MP":"Madhya Pradesh","MADHYA PRADESH":"Madhya Pradesh",
  // Himachal Pradesh
  "HP":"Himachal Pradesh","HIMACHAL PRADESH":"Himachal Pradesh",
  "BADDI,HIMACHAL PRADESH":"Himachal Pradesh",
  // Andhra Pradesh
  "AP":"Andhra Pradesh","ANDHRA PRADESH":"Andhra Pradesh",
  // Bihar
  "BR":"Bihar","BIHAR":"Bihar",
  // Chandigarh
  "CH":"Chandigarh","CHANDIGARH":"Chandigarh",
  // Chhattisgarh
  "CHATTISGARH":"Chhattisgarh","CHHATTISGARH":"Chhattisgarh","CHHATISGARH":"Chhattisgarh",
  // West Bengal
  "WB":"West Bengal","WEST BENGAL":"West Bengal","KOLKATA":"West Bengal",
  // Uttarakhand
  "UK":"Uttarakhand","UTTARAKHAND":"Uttarakhand","UTTARKHAND":"Uttarakhand",
  // Delhi
  "DL":"Delhi","DELHI":"Delhi","NEW DELHI":"Delhi",
  // Kerala
  "KL":"Kerala","KERALA":"Kerala",
  // Goa
  "GA":"Goa","GOA":"Goa",
  // Odisha
  "OR":"Odisha","ODISHA":"Odisha","ORISSA":"Odisha",
  // Jharkhand
  "JH":"Jharkhand","JHARKHAND":"Jharkhand",
  // Sikkim
  "SK":"Sikkim","SIKKIM":"Sikkim",
  // Assam
  "AS":"Assam","ASSAM":"Assam",
  // Tripura
  "TR":"Tripura","TRIPURA":"Tripura",
};

// Returns normalized Indian state name, or null for foreign/unrecognized values
const FOREIGN = new Set([
  "MOSCOW","SRI LANKA","ISLAMABAD","TANZANIA","VIETNAM","VIET","DOHA","KUWAIT",
  "QATAR","SINGAPORE","MAURITIUS","GHANA","BAGMATI","NEPAL","CA","ON","SA","FL",
  "MA","141017","KAMULI",
]);

function normalizeState(s) {
  if (!s || !s.toString().trim()) return null;
  const raw = s.toString().trim();
  const key = raw.toUpperCase();
  // Drop foreign/junk entries
  if (FOREIGN.has(key)) return null;
  // Lookup in map
  return STATE_MAP[key] || raw;
}

// ── POST /api/upload-leads ───────────────────────────────────────────
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const wb    = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw   = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (raw.length < HEADER_ROW + 1)
      return res.status(400).json({ error: "File does not match expected Leads format (too few rows)" });

    const headers  = raw[HEADER_ROW].map(h => (h || "").toString().trim());
    const dataRows = raw.slice(HEADER_ROW + 1);

    const col = (name) => headers.findIndex(h => h === name);
    const C = {
      firstName : col("First Name"),
      lastName  : col("Last Name"),
      company   : col("Company / Account"),
      industry  : col("Industry Type"),
      email     : col("Email"),
      source    : col("Lead Source"),
      rating    : col("Rating"),
      street    : col("Street"),
      leadNum   : col("Lead Auto Number"),
      owner     : col("Lead Owner"),
      status    : col("Lead Status"),
      date      : col("Create Date"),
      state     : col("State/Province"),
    };

    if (C.leadNum === -1 || C.status === -1)
      return res.status(400).json({ error: "Required columns not found. Check file format." });

    let inserted = 0, skipped = 0;
    const conn = await pool.getConnection();

    try {
      // Drop unique index if still present (safe migration, runs once)
      await conn.execute(
        `ALTER TABLE leads DROP INDEX lead_number`
      ).catch(() => {/* already removed — ignore */});

      // Wipe existing data so every upload is a fresh load
      await conn.execute(`TRUNCATE TABLE leads`);

      for (const row of dataRows) {
        const num = row[C.leadNum];
        if (!num) { skipped++; continue; }

        const { department, fy_suffix } = parseLeadPrefix(num);
        const values = [
          num.toString().trim(),
          C.firstName >= 0 ? row[C.firstName] || null : null,
          C.lastName  >= 0 ? row[C.lastName]  || null : null,
          C.company   >= 0 ? row[C.company]   || null : null,
          C.industry  >= 0 ? row[C.industry]  || null : null,
          C.email     >= 0 ? row[C.email]     || null : null,
          C.source    >= 0 ? row[C.source]    || null : null,
          C.rating    >= 0 ? row[C.rating]    || null : null,
          C.street    >= 0 ? row[C.street]    || null : null,
          C.owner     >= 0 ? row[C.owner]     || null : null,
          C.status    >= 0 ? row[C.status]    || null : null,
          parseDate(C.date >= 0 ? row[C.date] : null),
          normalizeState(C.state >= 0 ? row[C.state] : null),
          department,
          fy_suffix,
        ];

        await conn.execute(
          `INSERT INTO leads
             (lead_number, first_name, last_name, company, industry_type,
              email, lead_source, rating, street, lead_owner, lead_status,
              create_date, state, department, fy_suffix)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          values
        );
        inserted++;
      }
    } finally {
      conn.release();
    }

    res.json({ success: true, summary: { total: dataRows.length, inserted, updated: 0, skipped } });
  } catch (err) {
    console.error("Lead upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
