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

// ── Department filter options ─────────────────────────────────────────
const DEPT_FILTERS = [
  { key: "All",       label: "All",       emoji: "🔢" },
  { key: "Bio Fuels", label: "Bio Fuels", emoji: "🌱" },
  { key: "Spare",     label: "Spare",     emoji: "⚙️" },
  { key: "Sugar",     label: "Sugar",     emoji: "🍬" },
  { key: "Water",     label: "Water",     emoji: "💧" },
];

function DeptFilterBar({ active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: "8px", flexWrap: "wrap",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "10px 14px",
      marginBottom: "24px",
      alignItems: "center",
    }}>
      <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginRight: "4px" }}>
        Filter by Dept:
      </span>
      {DEPT_FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "6px 14px",
              borderRadius: "20px",
              border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: isActive ? "var(--accent)" : "var(--surface)",
              color: isActive ? "#fff" : "var(--text-muted)",
              fontSize: "13px", fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Opportunities Panel ───────────────────────────────────────────────
export function OpportunityPanel({ refreshKey }) {
  const [dept, setDept]     = useState("All");
  const [data, setData]     = useState({});
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async (d) => {
    setLoad(true); setError(null);
    try {
      const results = await Promise.allSettled([
        getOppSummary(d), getOppStatusOverTime(d), getOppByIndustry(d),
        getOppStagePerformance(d), getOppIndustryPerformance(d),
        getOppByState(d), getOppOverTimeQuarterly(d),
        getOppProposalOwnerPerf(d), getOppClosedWonByState(d),
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

  useEffect(() => { load(dept); }, [load, refreshKey, dept]);

  const handleDept = (d) => { setDept(d); };

  if (error) return <Err msg={error} />;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <DeptFilterBar active={dept} onChange={handleDept} />
      {loading ? <Loader /> : (
        <>
          <SummaryCards data={data.sum} />
          <StatusOverTime data={data.sot?.data}    stages={data.sot?.stages} />
          <ByIndustry     data={data.ind} />
          <StagePerformance    data={data.sp} />
          <IndustryPerformance data={data.ip} />
          <ByState             data={data.st} />
          <OverTimeQuarterly   data={data.qtr} />
          <ProposalOwnerPerformance data={data.propOwner} />
          <ClosedWonByState         data={data.cwState} />
        </>
      )}
    </div>
  );
}

// ── Leads Panel ───────────────────────────────────────────────────────
export function LeadsPanel({ refreshKey }) {
  const [dept, setDept]     = useState("All");
  const [data, setData]     = useState({});
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async (d) => {
    setLoad(true); setError(null);
    try {
      const [sum, sot, ind, st, owner] = await Promise.all([
        getLeadSummary(d), getLeadStatusOverTime(d),
        getLeadByIndustry(d), getLeadByState(d), getLeadByOwner(d),
      ]);
      setData({ sum, sot, ind, st, owner });
    } catch { setError("Failed to load data. Is the backend running?"); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(dept); }, [load, refreshKey, dept]);

  const handleDept = (d) => { setDept(d); };

  if (error) return <Err msg={error} />;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <DeptFilterBar active={dept} onChange={handleDept} />
      {loading ? <Loader /> : (
        <>
          <LeadSummaryCards  data={data.sum} />
          <LeadStatusOverTime data={data.sot?.data} statuses={data.sot?.statuses} />
          <LeadByIndustry    data={data.ind} />
          <LeadByState       data={data.st} />
          <LeadByOwner       data={data.owner} />
        </>
      )}
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

