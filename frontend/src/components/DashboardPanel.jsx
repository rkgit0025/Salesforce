import { useEffect, useState, useCallback } from "react";
import {
  getOppSummary, getOppStatusOverTime, getOppByIndustry,
  getOppStagePerformance, getOppIndustryPerformance, getOppByState, getOppOverTimeQuarterly,
  getOppProposalOwnerPerf, getOppClosedWonByState,
  getLeadSummary, getLeadStatusOverTime, getLeadByIndustry, getLeadByState, getLeadByOwner,
} from "../api";

import SummaryCards              from "./SummaryCards";
import LeadSummaryCards          from "./LeadSummaryCards";
import StatusOverTime            from "./charts/StatusOverTime";
import ByIndustry               from "./charts/ByIndustry";
import StagePerformance         from "./charts/StagePerformance";
import IndustryPerformance      from "./charts/IndustryPerformance";
import ByState                  from "./charts/ByState";
import OverTimeQuarterly        from "./charts/OverTimeQuarterly";
import ProposalOwnerPerformance from "./charts/ProposalOwnerPerformance";
import ClosedWonByState         from "./charts/ClosedWonByState";
import LeadStatusOverTime       from "./charts/LeadStatusOverTime";
import LeadByIndustry           from "./charts/LeadByIndustry";
import LeadByState              from "./charts/LeadByState";
import LeadByOwner              from "./charts/LeadByOwner";

// ── Opportunities Panel ───────────────────────────────────────────────
export function OpportunityPanel({ refreshKey }) {
  const [data, setData]     = useState({});
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const results = await Promise.allSettled([
        getOppSummary(), getOppStatusOverTime(), getOppByIndustry(),
        getOppStagePerformance(), getOppIndustryPerformance(),
        getOppByState(), getOppOverTimeQuarterly(),
        getOppProposalOwnerPerf(), getOppClosedWonByState(),
      ]);
      const names = ["sum","sot","ind","sp","ip","st","qtr","propOwner","cwState"];
      const out   = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") out[names[i]] = r.value;
        else { console.error(`API failed [${names[i]}]:`, r.reason?.message); out[names[i]] = null; }
      });
      if (!out.sum) throw new Error("Core summary API failed — is backend running?");
      setData(out);
    } catch (e) { setError(e.message || "Failed to load data. Is the backend running?"); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  if (loading) return <Loader />;
  if (error)   return <Err msg={error} />;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <SummaryCards data={data.sum} />
      <StatusOverTime data={data.sot?.data}    stages={data.sot?.stages} />
      <ByIndustry     data={data.ind} />
      <StagePerformance    data={data.sp} />
      <IndustryPerformance data={data.ip} />
      <ByState             data={data.st} />
      <OverTimeQuarterly   data={data.qtr} />
      <ProposalOwnerPerformance data={data.propOwner} />
      <ClosedWonByState         data={data.cwState} />
    </div>
  );
}

// ── Leads Panel ───────────────────────────────────────────────────────
export function LeadsPanel({ refreshKey }) {
  const [data, setData]     = useState({});
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const [sum, sot, ind, st, owner] = await Promise.all([
        getLeadSummary(), getLeadStatusOverTime(),
        getLeadByIndustry(), getLeadByState(), getLeadByOwner(),
      ]);
      setData({ sum, sot, ind, st, owner });
    } catch { setError("Failed to load data. Is the backend running?"); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  if (loading) return <Loader />;
  if (error)   return <Err msg={error} />;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <LeadSummaryCards  data={data.sum} />
      <LeadStatusOverTime data={data.sot?.data} statuses={data.sot?.statuses} />
      <LeadByIndustry    data={data.ind} />
      <LeadByState       data={data.st} />
      <LeadByOwner       data={data.owner} />
    </div>
  );
}

const Loader = () => (
  <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)" }}>
    <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>Loading charts…
  </div>
);

const Err = ({ msg }) => (
  <div style={{ padding: "32px", background: "#2e0d0d", border: "1px solid #4d1313",
    borderRadius: "var(--radius)", color: "var(--danger)", textAlign: "center" }}>
    ⚠️ {msg}
  </div>
);
