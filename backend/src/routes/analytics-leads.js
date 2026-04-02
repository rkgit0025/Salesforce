const express = require("express");
const pool    = require("../db");

const router = express.Router();

// ── GET /api/analytics-leads/summary ────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const [[totals]] = await pool.execute(
      `SELECT
         COUNT(*)                                                          AS total,
         SUM(CASE WHEN lead_status = 'Converted'           THEN 1 ELSE 0 END) AS converted,
         SUM(CASE WHEN lead_status = 'Not Converted'       THEN 1 ELSE 0 END) AS not_converted,
         SUM(CASE WHEN lead_status = 'New Enquiry'         THEN 1 ELSE 0 END) AS new_enquiry,
         SUM(CASE WHEN lead_status LIKE 'Working%'         THEN 1 ELSE 0 END) AS working
       FROM leads`
    );

    const [[deptCounts]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN department = 'Biofuels' THEN 1 ELSE 0 END) AS biofuels,
         SUM(CASE WHEN department = 'Spares'   THEN 1 ELSE 0 END) AS spares,
         SUM(CASE WHEN department = 'Sugar'    THEN 1 ELSE 0 END) AS sugar,
         SUM(CASE WHEN department = 'Water'    THEN 1 ELSE 0 END) AS water
       FROM leads`
    );

    const resolved = (totals.converted || 0) + (totals.not_converted || 0);
    const conversion_rate = resolved > 0
      ? ((totals.converted / resolved) * 100).toFixed(1)
      : "0.0";

    res.json({ ...totals, conversion_rate, departments: deptCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/status-over-time ───────────────────────
// Stacked area: X=month of create_date, stacks=lead_status
router.get("/status-over-time", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         DATE_FORMAT(create_date, '%b %Y') AS month,
         DATE_FORMAT(create_date, '%Y-%m') AS month_sort,
         lead_status                        AS status,
         COUNT(*)                           AS count
       FROM leads
       WHERE create_date IS NOT NULL
       GROUP BY month_sort, month, status
       ORDER BY month_sort ASC`
    );

    const monthMap = {};
    const statusSet = new Set();
    for (const row of rows) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, _sort: row.month_sort };
      monthMap[row.month][row.status] = row.count;
      statusSet.add(row.status);
    }
    const data = Object.values(monthMap).sort((a, b) => a._sort.localeCompare(b._sort));
    res.json({ data, statuses: Array.from(statusSet) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/by-industry ────────────────────────────
// Horizontal bar: Y=industry, X=count
router.get("/by-industry", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(industry_type, 'Unknown') AS industry,
         COUNT(*) AS count
       FROM leads
       GROUP BY industry
       ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/by-state ───────────────────────────────
// State already normalized at insert time
router.get("/by-state", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         state,
         COUNT(*) AS count
       FROM leads
       WHERE state IS NOT NULL AND state != ''
       GROUP BY state
       ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/by-owner ───────────────────────────────
// Bar: X=lead owner, Y=count
router.get("/by-owner", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(lead_owner, 'Unassigned') AS lead_owner,
         COUNT(*) AS total,
         SUM(CASE WHEN lead_status = 'Converted'     THEN 1 ELSE 0 END) AS converted,
         SUM(CASE WHEN lead_status = 'New Enquiry'   THEN 1 ELSE 0 END) AS new_enquiry,
         SUM(CASE WHEN lead_status LIKE 'Working%'   THEN 1 ELSE 0 END) AS working,
         SUM(CASE WHEN lead_status = 'Not Converted' THEN 1 ELSE 0 END) AS not_converted
       FROM leads
       GROUP BY lead_owner
       ORDER BY total DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
