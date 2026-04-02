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
export const getOppSummary            = () => api.get("/analytics/summary").then(r => r.data);
export const getOppStatusOverTime     = () => api.get("/analytics/status-over-time").then(r => r.data);
export const getOppByIndustry         = () => api.get("/analytics/by-industry").then(r => r.data);
export const getOppStagePerformance   = () => api.get("/analytics/stage-performance").then(r => r.data);
export const getOppIndustryPerformance= () => api.get("/analytics/industry-performance").then(r => r.data);
export const getOppByState            = () => api.get("/analytics/by-state").then(r => r.data);
export const getOppOverTimeQuarterly       = () => api.get("/analytics/over-time-quarterly").then(r => r.data);
export const getOppProposalOwnerPerf       = () => api.get("/analytics/proposal-owner-performance").then(r => r.data);
export const getOppClosedWonByState        = () => api.get("/analytics/closed-won-by-state").then(r => r.data);

// ── Leads analytics ───────────────────────────────────────────────────
export const getLeadSummary        = () => api.get("/analytics-leads/summary").then(r => r.data);
export const getLeadStatusOverTime = () => api.get("/analytics-leads/status-over-time").then(r => r.data);
export const getLeadByIndustry     = () => api.get("/analytics-leads/by-industry").then(r => r.data);
export const getLeadByState        = () => api.get("/analytics-leads/by-state").then(r => r.data);
export const getLeadByOwner        = () => api.get("/analytics-leads/by-owner").then(r => r.data);
