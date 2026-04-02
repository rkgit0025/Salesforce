const express = require("express");
const pool    = require("../db");
const router  = express.Router();

// Indian FY quarter helper (SQL expression)
// Apr-Jun=Q1, Jul-Sep=Q2, Oct-Dec=Q3, Jan-Mar=Q4
// FY label: Apr 2025 = "Q1 2025-26"
const FY_QUARTER_EXPR = `
  CONCAT(
    'Q',
    CASE
      WHEN MONTH(close_date) BETWEEN 4  AND 6  THEN 1
      WHEN MONTH(close_date) BETWEEN 7  AND 9  THEN 2
      WHEN MONTH(close_date) BETWEEN 10 AND 12 THEN 3
      ELSE 4
    END,
    ' ',
    CASE WHEN MONTH(close_date) >= 4 THEN YEAR(close_date) ELSE YEAR(close_date)-1 END,
    '-',
    RIGHT(
      CASE WHEN MONTH(close_date) >= 4 THEN YEAR(close_date)+1 ELSE YEAR(close_date) END,
      2
    )
  )
`;

const FY_SORT_EXPR = `
  CONCAT(
    CASE WHEN MONTH(close_date) >= 4 THEN YEAR(close_date) ELSE YEAR(close_date)-1 END,
    LPAD(
      CASE
        WHEN MONTH(close_date) BETWEEN 4  AND 6  THEN 1
        WHEN MONTH(close_date) BETWEEN 7  AND 9  THEN 2
        WHEN MONTH(close_date) BETWEEN 10 AND 12 THEN 3
        ELSE 4
      END,
    2,'0')
  )
`;

// ── status-over-time ────────────────────────────────────────────────
router.get("/status-over-time", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT DATE_FORMAT(created_date,'%b %Y') AS month,
              DATE_FORMAT(created_date,'%Y-%m') AS month_sort,
              stage, COUNT(*) AS count
       FROM pipeline WHERE created_date IS NOT NULL
       GROUP BY month_sort, month, stage ORDER BY month_sort ASC`
    );
    const monthMap = {};
    const stageSet = new Set();
    for (const row of rows) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, _sort: row.month_sort };
      monthMap[row.month][row.stage] = row.count;
      stageSet.add(row.stage);
    }
    const data = Object.values(monthMap).sort((a,b) => a._sort.localeCompare(b._sort));
    res.json({ data, stages: Array.from(stageSet) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── by-industry ─────────────────────────────────────────────────────
router.get("/by-industry", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT COALESCE(industry,'Unknown') AS industry, COUNT(*) AS count
       FROM pipeline GROUP BY industry ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── summary (KPI cards) ─────────────────────────────────────────────
router.get("/summary", async (req, res) => {
  try {
    const [[totals]] = await pool.execute(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN stage='Closed Won'  THEN 1 ELSE 0 END) AS closed_won,
         SUM(CASE WHEN stage='Closed Lost' THEN 1 ELSE 0 END) AS closed_lost,
         SUM(CASE WHEN stage='Closed Won'  THEN final_price  ELSE 0 END) AS total_revenue,
         SUM(CASE WHEN stage NOT IN ('Closed Won','Closed Lost') THEN quoted_value ELSE 0 END) AS total_quoted
       FROM pipeline`
    );
    const [[deptCounts]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN department='Biofuels' THEN 1 ELSE 0 END) AS biofuels,
         SUM(CASE WHEN department='Spares'   THEN 1 ELSE 0 END) AS spares,
         SUM(CASE WHEN department='Sugar'    THEN 1 ELSE 0 END) AS sugar,
         SUM(CASE WHEN department='Water'    THEN 1 ELSE 0 END) AS water
       FROM pipeline`
    );
    res.json({ ...totals, departments: deptCounts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── stage-performance ───────────────────────────────────────────────
router.get("/stage-performance", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT stage, COUNT(*) AS count, COALESCE(SUM(quoted_value),0) AS quoted_value
       FROM pipeline GROUP BY stage ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── industry-performance ────────────────────────────────────────────
router.get("/industry-performance", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT COALESCE(industry,'Unknown') AS industry,
              COUNT(*) AS count, COALESCE(SUM(quoted_value),0) AS quoted_value
       FROM pipeline GROUP BY industry ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── by-state ────────────────────────────────────────────────────────
router.get("/by-state", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         CASE
           WHEN UPPER(TRIM(mailing_state)) IN ('TN','TAMIL NADU','TAMILNADU') THEN 'Tamil Nadu'
           WHEN UPPER(TRIM(mailing_state)) IN ('KA','KARNATAKA','BANGALORE','BENGALURU') THEN 'Karnataka'
           WHEN UPPER(TRIM(mailing_state)) IN ('MH','MAHARASHTRA','MAHARASHTA','MUMBAI','PUNE','NAGPUR') THEN 'Maharashtra'
           WHEN UPPER(TRIM(mailing_state)) IN ('UP','U.P','UTTAR PRADESH','UTTAR PRADESH, INDIA.','UTTARPRADESH','UTTAR PRADESH, INDIA') THEN 'Uttar Pradesh'
           WHEN UPPER(TRIM(mailing_state)) IN ('GJ','GUJARAT','GUJRAT','VADODARA','AHMEDABAD','SURAT') THEN 'Gujarat'
           WHEN UPPER(TRIM(mailing_state)) IN ('RJ','RAJASTHAN','JODHPUR','JAIPUR','UDAIPUR') THEN 'Rajasthan'
           WHEN UPPER(TRIM(mailing_state)) IN ('PB','PUNJAB') THEN 'Punjab'
           WHEN UPPER(TRIM(mailing_state)) IN ('HR','HARYANA') THEN 'Haryana'
           WHEN UPPER(TRIM(mailing_state)) IN ('TS','TELANGANA','HYDERABAD') THEN 'Telangana'
           WHEN UPPER(TRIM(mailing_state)) IN ('MP','MADHYA PRADESH') THEN 'Madhya Pradesh'
           WHEN UPPER(TRIM(mailing_state)) IN ('HP','HIMACHAL PRADESH','BADDI,HIMACHAL PRADESH') THEN 'Himachal Pradesh'
           WHEN UPPER(TRIM(mailing_state)) IN ('AP','ANDHRA PRADESH') THEN 'Andhra Pradesh'
           WHEN UPPER(TRIM(mailing_state)) IN ('BR','BIHAR') THEN 'Bihar'
           WHEN UPPER(TRIM(mailing_state)) IN ('CH','CHANDIGARH') THEN 'Chandigarh'
           WHEN UPPER(TRIM(mailing_state)) IN ('CHATTISGARH','CHHATTISGARH','CHHATISGARH') THEN 'Chhattisgarh'
           WHEN UPPER(TRIM(mailing_state)) IN ('WB','WEST BENGAL','KOLKATA') THEN 'West Bengal'
           WHEN UPPER(TRIM(mailing_state)) IN ('UK','UTTARAKHAND','UTTARKHAND') THEN 'Uttarakhand'
           WHEN UPPER(TRIM(mailing_state)) IN ('DL','DELHI','NEW DELHI') THEN 'Delhi'
           WHEN UPPER(TRIM(mailing_state)) IN ('KL','KERALA') THEN 'Kerala'
           WHEN UPPER(TRIM(mailing_state)) IN ('GA','GOA') THEN 'Goa'
           WHEN UPPER(TRIM(mailing_state)) IN ('OR','ODISHA','ORISSA') THEN 'Odisha'
           WHEN UPPER(TRIM(mailing_state)) IN ('SK','SIKKIM') THEN 'Sikkim'
           WHEN mailing_state IS NULL OR TRIM(mailing_state) = '' THEN NULL
           WHEN UPPER(TRIM(mailing_state)) IN ('MOSCOW','SRI LANKA','ISLAMABAD','TANZANIA','VIETNAM','VIET','DOHA','KUWAIT','QATAR','SINGAPORE','MAURITIUS','GHANA','BAGMATI','NEPAL','CA','ON','SA','FL','MA','141017','TENE','KAMULI') THEN NULL
           ELSE TRIM(mailing_state)
         END AS state,
         COUNT(*) AS count,
         COALESCE(SUM(quoted_value),0) AS quoted_value
       FROM pipeline
       GROUP BY state HAVING state IS NOT NULL AND quoted_value > 0
       ORDER BY quoted_value DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── proposal-owner-performance ──────────────────────────────────────
router.get("/proposal-owner-performance", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(TRIM(proposal_person), 'Unassigned')            AS proposal_person,
         CAST(COUNT(*) AS UNSIGNED)                               AS opp_count,
         CAST(COALESCE(SUM(quoted_value), 0) AS DECIMAL(15,2))   AS quoted_value,
         CAST(SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) AS UNSIGNED) AS closed_won,
         CAST(COALESCE(SUM(CASE WHEN stage = 'Closed Won'
              THEN COALESCE(final_price, quoted_value) ELSE 0 END), 0) AS DECIMAL(15,2)) AS won_value
       FROM pipeline
       GROUP BY COALESCE(TRIM(proposal_person), 'Unassigned')
       ORDER BY opp_count DESC`
    );
    // expose as "count" for the frontend bar chart dataKey
    const out = rows.map(r => ({
      proposal_person: r.proposal_person,
      count:           Number(r.opp_count),
      quoted_value:    Number(r.quoted_value),
      closed_won:      Number(r.closed_won),
      won_value:       Number(r.won_value),
    }));
    res.json(out);
  } catch (err) {
    console.error("proposal-owner-performance error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── state normalizer (shared expression) ────────────────────────────
const STATE_EXPR = `
  CASE
    WHEN UPPER(TRIM(mailing_state)) IN ('TN','TAMIL NADU','TAMILNADU') THEN 'Tamil Nadu'
    WHEN UPPER(TRIM(mailing_state)) IN ('KA','KARNATAKA','BANGALORE','BENGALURU') THEN 'Karnataka'
    WHEN UPPER(TRIM(mailing_state)) IN ('MH','MAHARASHTRA','MAHARASHTA','MUMBAI','PUNE','NAGPUR') THEN 'Maharashtra'
    WHEN UPPER(TRIM(mailing_state)) IN ('UP','U.P','UTTAR PRADESH','UTTAR PRADESH, INDIA.','UTTARPRADESH','UTTAR PRADESH, INDIA') THEN 'Uttar Pradesh'
    WHEN UPPER(TRIM(mailing_state)) IN ('GJ','GUJARAT','GUJRAT','VADODARA','AHMEDABAD','SURAT') THEN 'Gujarat'
    WHEN UPPER(TRIM(mailing_state)) IN ('RJ','RAJASTHAN','JODHPUR','JAIPUR','UDAIPUR') THEN 'Rajasthan'
    WHEN UPPER(TRIM(mailing_state)) IN ('PB','PUNJAB') THEN 'Punjab'
    WHEN UPPER(TRIM(mailing_state)) IN ('HR','HARYANA') THEN 'Haryana'
    WHEN UPPER(TRIM(mailing_state)) IN ('TS','TELANGANA','HYDERABAD') THEN 'Telangana'
    WHEN UPPER(TRIM(mailing_state)) IN ('MP','MADHYA PRADESH') THEN 'Madhya Pradesh'
    WHEN UPPER(TRIM(mailing_state)) IN ('HP','HIMACHAL PRADESH','BADDI,HIMACHAL PRADESH') THEN 'Himachal Pradesh'
    WHEN UPPER(TRIM(mailing_state)) IN ('AP','ANDHRA PRADESH') THEN 'Andhra Pradesh'
    WHEN UPPER(TRIM(mailing_state)) IN ('BR','BIHAR') THEN 'Bihar'
    WHEN UPPER(TRIM(mailing_state)) IN ('CH','CHANDIGARH') THEN 'Chandigarh'
    WHEN UPPER(TRIM(mailing_state)) IN ('CHATTISGARH','CHHATTISGARH','CHHATISGARH') THEN 'Chhattisgarh'
    WHEN UPPER(TRIM(mailing_state)) IN ('WB','WEST BENGAL','KOLKATA') THEN 'West Bengal'
    WHEN UPPER(TRIM(mailing_state)) IN ('UK','UTTARAKHAND','UTTARKHAND') THEN 'Uttarakhand'
    WHEN UPPER(TRIM(mailing_state)) IN ('DL','DELHI','NEW DELHI') THEN 'Delhi'
    WHEN UPPER(TRIM(mailing_state)) IN ('KL','KERALA') THEN 'Kerala'
    WHEN UPPER(TRIM(mailing_state)) IN ('GA','GOA') THEN 'Goa'
    WHEN UPPER(TRIM(mailing_state)) IN ('OR','ODISHA','ORISSA') THEN 'Odisha'
    WHEN UPPER(TRIM(mailing_state)) IN ('SK','SIKKIM') THEN 'Sikkim'
    WHEN mailing_state IS NULL OR TRIM(mailing_state) = '' THEN NULL
    WHEN UPPER(TRIM(mailing_state)) IN ('MOSCOW','SRI LANKA','ISLAMABAD','TANZANIA','VIETNAM','VIET','DOHA','KUWAIT','QATAR','SINGAPORE','MAURITIUS','GHANA','BAGMATI','NEPAL','CA','ON','SA','FL','MA','141017','TENE','KAMULI') THEN NULL
    ELSE TRIM(mailing_state)
  END
`;

// ── closed-won-by-state ─────────────────────────────────────────────
router.get("/closed-won-by-state", async (req, res) => {
  try {
    const [byOwnerRaw] = await pool.execute(
      `SELECT
         ${STATE_EXPR}                                                AS state,
         COALESCE(opportunity_owner, 'Unassigned')                   AS owner,
         CAST(COUNT(*) AS UNSIGNED)                                   AS row_count,
         CAST(COALESCE(SUM(COALESCE(final_price, quoted_value)), 0)
              AS DECIMAL(15,2))                                       AS won_value
       FROM pipeline
       WHERE stage = 'Closed Won'
       GROUP BY ${STATE_EXPR}, COALESCE(opportunity_owner, 'Unassigned')
       HAVING state IS NOT NULL
       ORDER BY state, won_value DESC`
    );
    const [byIndustryRaw] = await pool.execute(
      `SELECT
         ${STATE_EXPR}                                                AS state,
         COALESCE(industry, 'Unknown')                               AS industry,
         CAST(COUNT(*) AS UNSIGNED)                                   AS row_count,
         CAST(COALESCE(SUM(COALESCE(final_price, quoted_value)), 0)
              AS DECIMAL(15,2))                                       AS won_value
       FROM pipeline
       WHERE stage = 'Closed Won'
       GROUP BY ${STATE_EXPR}, COALESCE(industry, 'Unknown')
       HAVING state IS NOT NULL
       ORDER BY state, won_value DESC`
    );
    const normalize = r => ({ ...r, count: Number(r.row_count), won_value: Number(r.won_value) });
    res.json({ byOwner: byOwnerRaw.map(normalize), byIndustry: byIndustryRaw.map(normalize) });
  } catch (err) {
    console.error("closed-won-by-state error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── over-time-quarterly (Indian FY) ────────────────────────────────
router.get("/over-time-quarterly", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         ${FY_QUARTER_EXPR}   AS quarter,
         ${FY_SORT_EXPR}      AS sort_key,
         COUNT(*)             AS count,
         COALESCE(SUM(quoted_value),0) AS quoted_value
       FROM pipeline
       WHERE close_date IS NOT NULL
       GROUP BY quarter, sort_key
       ORDER BY sort_key ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
