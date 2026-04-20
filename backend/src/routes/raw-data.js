const express = require("express");
const pool    = require("../db");
const router  = express.Router();

// ── GET /api/raw-data/opportunities ──────────────────────────────────
// Query params: page, limit, search, dept, stage
router.get("/opportunities", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1"));
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit || "50")));
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const dept   = req.query.dept || "All";
    const stage  = req.query.stage || "All";

    const conditions = [];
    const params     = [];

    if (dept && dept !== "All") {
      const map = { "Bio Fuels": "Biofuels", Spare: "Spares", Sugar: "Sugar", Water: "Water" };
      conditions.push("department = ?");
      params.push(map[dept] || dept);
    }
    if (stage && stage !== "All") {
      conditions.push("stage = ?");
      params.push(stage);
    }
    if (search) {
      conditions.push(
        "(account_name LIKE ? OR opportunity_owner LIKE ? OR proposal_person LIKE ? OR opportunity_number LIKE ? OR industry LIKE ? OR mailing_state LIKE ?)"
      );
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pipeline ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT
        opportunity_number, created_date, account_name, industry,
        mailing_state, opportunity_owner, proposal_person, stage,
        feed_rate, unit_of_feed_rate, quoted_value, final_price,
        close_date, department
       FROM pipeline ${where}
       ORDER BY created_date DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Also fetch distinct stage values for filter dropdown
    const [stages] = await pool.execute(
      `SELECT DISTINCT stage FROM pipeline WHERE stage IS NOT NULL ORDER BY stage`
    );

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stages: stages.map(r => r.stage),
      rows,
    });
  } catch (err) {
    console.error("raw-data/opportunities error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/raw-data/leads ───────────────────────────────────────────
// Query params: page, limit, search, dept, status
router.get("/leads", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1"));
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit || "50")));
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const dept   = req.query.dept || "All";
    const status = req.query.status || "All";

    const conditions = [];
    const params     = [];

    if (dept && dept !== "All") {
      const map = { "Bio Fuels": "Biofuels", Spare: "Spares", Sugar: "Sugar", Water: "Water" };
      conditions.push("department = ?");
      params.push(map[dept] || dept);
    }
    if (status && status !== "All") {
      conditions.push("lead_status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push(
        "(first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR lead_owner LIKE ? OR lead_number LIKE ? OR industry_type LIKE ? OR state LIKE ?)"
      );
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s, s);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM leads ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT
        lead_number, create_date, first_name, last_name, company,
        industry_type, lead_source, rating, lead_owner, lead_status,
        state, department
       FROM leads ${where}
       ORDER BY create_date DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Distinct statuses for filter
    const [statuses] = await pool.execute(
      `SELECT DISTINCT lead_status FROM leads WHERE lead_status IS NOT NULL ORDER BY lead_status`
    );

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      statuses: statuses.map(r => r.lead_status),
      rows,
    });
  } catch (err) {
    console.error("raw-data/leads error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
