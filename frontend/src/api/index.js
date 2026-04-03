import axios from "axios";
const api = axios.create({ baseURL: "/api" });

// ── Uploads ──────────────────────────────────────────────────────────
export const uploadOpportunities = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });
};

export const uploadLeads = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload-leads", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });
};

// ── Opportunities analytics ───────────────────────────────────────────
const p = (dept) => dept && dept !== 'All' ? { params: { dept } } : {};

export const getOppSummary            = (dept) => api.get("/analytics/summary",                  p(dept)).then(r => r.data);
export const getOppStatusOverTime     = (dept) => api.get("/analytics/status-over-time",         p(dept)).then(r => r.data);
export const getOppByIndustry         = (dept) => api.get("/analytics/by-industry",              p(dept)).then(r => r.data);
export const getOppStagePerformance   = (dept) => api.get("/analytics/stage-performance",        p(dept)).then(r => r.data);
export const getOppIndustryPerformance= (dept) => api.get("/analytics/industry-performance",     p(dept)).then(r => r.data);
export const getOppByState            = (dept) => api.get("/analytics/by-state",                 p(dept)).then(r => r.data);
export const getOppOverTimeQuarterly  = (dept) => api.get("/analytics/over-time-quarterly",      p(dept)).then(r => r.data);
export const getOppProposalOwnerPerf  = (dept) => api.get("/analytics/proposal-owner-performance",p(dept)).then(r => r.data);
export const getOppClosedWonByState   = (dept) => api.get("/analytics/closed-won-by-state",      p(dept)).then(r => r.data);
export const getOppClosedWonValue     = (dept) => api.get("/analytics/closed-won-value",          p(dept)).then(r => r.data);

// ── Leads analytics ───────────────────────────────────────────────────
export const getLeadSummary        = (dept) => api.get("/analytics-leads/summary",        p(dept)).then(r => r.data);
export const getLeadStatusOverTime = (dept) => api.get("/analytics-leads/status-over-time",p(dept)).then(r => r.data);
export const getLeadByIndustry     = (dept) => api.get("/analytics-leads/by-industry",    p(dept)).then(r => r.data);
export const getLeadByState        = (dept) => api.get("/analytics-leads/by-state",       p(dept)).then(r => r.data);
export const getLeadByOwner        = (dept) => api.get("/analytics-leads/by-owner",       p(dept)).then(r => r.data);
