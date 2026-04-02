require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const uploadOppRoute    = require("./routes/upload");
const uploadLeadsRoute  = require("./routes/upload-leads");
const analyticsRoute    = require("./routes/analytics");
const analyticsLeads    = require("./routes/analytics-leads");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/upload",            uploadOppRoute);
app.use("/api/upload-leads",      uploadLeadsRoute);
app.use("/api/analytics",         analyticsRoute);
app.use("/api/analytics-leads",   analyticsLeads);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`✅  Backend running at http://localhost:${PORT}`));
