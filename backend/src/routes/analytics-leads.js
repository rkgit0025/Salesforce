const express = require("express");
const pool    = require("../db");

const router = express.Router();

// Helper: build department WHERE clause
function deptWhere(dept) {
  if (!dept || dept === 'All') return { clause: '', params: [] };
  const map = { 'Bio Fuels': 'Biofuels', 'Spare': 'Spares', 'Sugar': 'Sugar', 'Water': 'Water' };
  const val = map[dept] || dept;
  return { clause: 'WHERE department = ?', params: [val] };
}

function deptAnd(dept) {
  if (!dept || dept === 'All') return { clause: '', params: [] };
  const map = { 'Bio Fuels': 'Biofuels', 'Spare': 'Spares', 'Sugar': 'Sugar', 'Water': 'Water' };
  const val = map[dept] || dept;
  return { clause: 'AND department = ?', params: [val] };
}

// ── GET /api/analytics-leads/summary ────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const dept = req.query.dept || 'All';
    const { clause: wClause, params: wParams } = deptWhere(dept);

    const [[totals]] = await pool.execute(
      `SELECT
         COUNT(*)                                                                      AS total,
         SUM(CASE WHEN lead_status = 'Converted'     THEN 1 ELSE 0 END)              AS total_won,
         SUM(CASE WHEN lead_status = 'Not Converted' THEN 1 ELSE 0 END)              AS total_lost,
         SUM(CASE WHEN lead_status NOT IN ('Converted','Not Converted') THEN 1 ELSE 0 END) AS total_ongoing
       FROM leads ${wClause}`,
      wParams
    );

    const [[topOwnerRow]] = await pool.execute(
      `SELECT COALESCE(lead_owner,'Unassigned') AS top_owner, COUNT(*) AS cnt
       FROM leads ${wClause}
       GROUP BY lead_owner ORDER BY cnt DESC LIMIT 1`,
      wParams
    );

    const stateBase = wClause ? `${wClause} AND state IS NOT NULL AND state != ''` : `WHERE state IS NOT NULL AND state != ''`;
    const [[topStateRow]] = await pool.execute(
      `SELECT state AS top_state, COUNT(*) AS cnt
       FROM leads ${stateBase}
       GROUP BY state ORDER BY cnt DESC LIMIT 1`,
      wParams
    );

    const [[topIndustryRow]] = await pool.execute(
      `SELECT COALESCE(industry_type,'Unknown') AS top_industry, COUNT(*) AS cnt
       FROM leads ${wClause}
       GROUP BY industry_type ORDER BY cnt DESC LIMIT 1`,
      wParams
    );

    res.json({
      total:          totals.total,
      total_won:      totals.total_won,
      total_lost:     totals.total_lost,
      total_ongoing:  totals.total_ongoing,
      top_owner:      topOwnerRow?.top_owner || '—',
      top_state:      topStateRow?.top_state || '—',
      top_industry:   topIndustryRow?.top_industry || '—',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/status-over-time ───────────────────────
router.get("/status-over-time", async (req, res) => {
  try {
    const { clause: wClause, params: wParams } = deptWhere(req.query.dept);
    const [rows] = await pool.execute(
      `SELECT
         DATE_FORMAT(create_date, '%b %Y') AS month,
         DATE_FORMAT(create_date, '%Y-%m') AS month_sort,
         lead_status                        AS status,
         COUNT(*)                           AS count
       FROM leads
       ${wClause ? wClause + ' AND' : 'WHERE'} create_date IS NOT NULL
       GROUP BY month_sort, month, status
       ORDER BY month_sort ASC`,
      wParams
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
router.get("/by-industry", async (req, res) => {
  try {
    const { clause: wClause, params: wParams } = deptWhere(req.query.dept);
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(industry_type, 'Unknown') AS industry,
         COUNT(*) AS count
       FROM leads ${wClause}
       GROUP BY industry
       ORDER BY count DESC`,
      wParams
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/by-state ───────────────────────────────
router.get("/by-state", async (req, res) => {
  try {
    const { clause: wClause, params: wParams } = deptWhere(req.query.dept);
    const stateBase = wClause ? `${wClause} AND state IS NOT NULL AND state != ''` : `WHERE state IS NOT NULL AND state != ''`;
    const [rows] = await pool.execute(
      `SELECT state, COUNT(*) AS count
       FROM leads ${stateBase}
       GROUP BY state ORDER BY count DESC`,
      wParams
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics-leads/by-owner ───────────────────────────────
router.get("/by-owner", async (req, res) => {
  try {
    const { clause: wClause, params: wParams } = deptWhere(req.query.dept);
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(lead_owner, 'Unassigned') AS lead_owner,
         COUNT(*) AS total,
         SUM(CASE WHEN lead_status = 'Converted'     THEN 1 ELSE 0 END) AS converted,
         SUM(CASE WHEN lead_status = 'New Enquiry'   THEN 1 ELSE 0 END) AS new_enquiry,
         SUM(CASE WHEN lead_status LIKE 'Working%'   THEN 1 ELSE 0 END) AS working,
         SUM(CASE WHEN lead_status = 'Not Converted' THEN 1 ELSE 0 END) AS not_converted
       FROM leads ${wClause}
       GROUP BY lead_owner ORDER BY total DESC`,
      wParams
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
