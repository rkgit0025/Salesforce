# 📊 Sales Salesforce Insight

A full-stack React + Node.js + MySQL dashboard for your Sales DataExcel data.

---

## 🗂 Project Structure

```
pipeline-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.js       ← Excel upload + MySQL upsert
│   │   │   └── analytics.js    ← Chart data APIs
│   │   ├── db.js               ← MySQL connection pool
│   │   └── server.js           ← Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js        ← Axios API calls
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── StatusOverTime.jsx   ← Stacked area chart
│   │   │   │   └── ByIndustry.jsx       ← Horizontal bar chart
│   │   │   ├── DashboardPanel.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   └── SummaryCards.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── database/
    └── schema.sql              ← Run this once to set up MySQL
```

---

## ⚙️ Prerequisites

- **Node.js** v18 or higher → https://nodejs.org
- **MySQL** 8.0 or higher → https://dev.mysql.com/downloads/
- **npm** (comes with Node.js)

---

## 🚀 Setup Guide

### Step 1 — Set up MySQL Database

Open MySQL Workbench or your terminal and run:

```sql
-- In MySQL terminal / Workbench
source /path/to/pipeline-dashboard/database/schema.sql
```

Or copy-paste the contents of `database/schema.sql` directly.

This creates:
- Database: `pipeline_db`
- Table: `pipeline` with all required columns + indexes

---

### Step 2 — Configure Backend

```bash
cd pipeline-dashboard/backend

# Copy environment file
cp .env.example .env
```

Now open `.env` and fill in your MySQL credentials:

```env
PORT=8003
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=pipeline_db
```

Install dependencies and start:

```bash
npm install
npm run dev
```

You should see:
```
✅  Backend running at http://localhost:8003
```

Test it: open http://localhost:8003/api/health → should return `{"status":"ok"}`

---

### Step 3 — Start Frontend

Open a **new terminal tab**:

```bash
cd pipeline-dashboard/frontend
npm install
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3007/
```

Open **http://localhost:3007** in your browser.

---

## 📤 How to Upload Data

1. Click **"⬆ Upload Excel"** button in the top-right header
2. Drag & drop your `.xlsx` file or click "Choose File"
3. Upload result shows: **X new, Y updated, Z skipped**
4. Charts refresh automatically after upload

### How Upsert Works

The `Opportunity Auto Number` column is the **unique key**.

| Scenario | What happens |
|----------|-------------|
| Row doesn't exist in DB | ✅ Inserted as new |
| Row exists, data changed | 🔄 Updated in-place |
| Row exists, nothing changed | ⏭ Skipped (no write) |

So uploading daily is safe — no duplicates ever.

---

## 🏷 Prefix Logic

| Prefix | Type | Department |
|--------|------|------------|
| BOG | Opportunity | Biofuels |
| POG | Opportunity | Spares |
| SOG | Opportunity | Sugar |
| WOG | Opportunity | Water |
| BLG | Lead | Biofuels |
| PLG | Lead | Spares |
| SLG | Lead | Sugar |
| WLG | Lead | Water |

The system **auto-detects** type and department from the prefix — no manual tagging needed.

---

## 📈 Charts (Current — v1)

### Opportunities Tab & Leads Tab (each has):

1. **Stage Status Over Time** — Stacked area chart
   - X-axis: Month of creation
   - Y-axis: Count of records
   - Stacks: Each pipeline stage (New, Follow-up, Technical Offer, etc.)

2. **Distribution by Industry** — Horizontal bar chart
   - Y-axis: Industry name
   - X-axis: Count of records
   - Sorted by volume descending

### KPI Cards (top of each tab):
- Total Records
- Closed Won
- Closed Lost
- Win Rate %
- Total Revenue (₹ Crore)
- Quoted Value (₹ Crore)
- Breakdown by Department (Biofuels / Sugar / Water / Spares)

---

## 🔧 Common Issues

**"Failed to load data. Is the backend running?"**
→ Make sure backend is running on port 8003: `cd backend && npm run dev`

**MySQL connection refused**
→ Check your `.env` credentials. Make sure MySQL service is running.

**Upload says 0 rows processed**
→ Ensure column headers in Excel exactly match the expected format (same as your original file).

---

## 🗺 Adding More Charts (Next Steps)

All you need to do is:
1. Add a new SQL query in `backend/src/routes/analytics.js`
2. Create a new chart component in `frontend/src/components/charts/`
3. Import it in `DashboardPanel.jsx`

Tell me which charts to add next!
