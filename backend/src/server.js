require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const uploadOppRoute    = require("./routes/upload");
const uploadLeadsRoute  = require("./routes/upload-leads");
const analyticsRoute    = require("./routes/analytics");
const analyticsLeads    = require("./routes/analytics-leads");

const app  = express();
const PORT = process.env.PORT;

app.use(cors({ origin: "http://localhost:3007" }));
app.use(express.json());

app.use("/api/upload",            uploadOppRoute);
app.use("/api/upload-leads",      uploadLeadsRoute);
app.use("/api/analytics",         analyticsRoute);
app.use("/api/analytics-leads",   analyticsLeads);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, '0.0.0.0', () => console.log(`✅  Backend running at http://localhost:${PORT}`));
