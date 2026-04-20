"use client";

import { useState, useEffect } from "react";
import { getTriageData, formatTimestamp } from "@/lib/triage";
import HandoffClient from "@/components/HandoffClient";
import {
  getEffectiveAlarmStats,
  getEffectiveIncidentStats,
  getEffectiveIncidentState,
  subscribe,
} from "@/lib/alarm-state";

export default function HandoffPage() {
  const [, forceUpdate] = useState(0);
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);

  const { incidents, nuisance_alarms, plant, shift, operator, all_alarms } = getTriageData();
  const alarmStats = getEffectiveAlarmStats(all_alarms);
  const incidentStats = getEffectiveIncidentStats(incidents);

  const allAcknowledged = incidentStats.active === 0 && incidentStats.total > 0;
  const anyAcknowledged = incidentStats.acknowledged > 0;
  const incidentHeading = anyAcknowledged ? "Incidents This Shift" : "Open Incidents";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-base font-semibold tracking-wide text-slate-900">
            SHIFT HANDOFF COPILOT
          </h1>
          <span className="font-mono text-xs bg-slate-100 text-[#0066B2] border border-slate-200 px-2 py-0.5 rounded">
            OPERATOR REVIEW DRAFT
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Drafts structured shift summaries from acknowledged incident data for operator review
        </p>
        <p className="text-xs text-slate-500 font-mono mt-1">
          {plant} · {shift} → Day Shift · Outgoing: {operator}
        </p>
      </div>

      {/* Stat cards — live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Total alarms — always 60, factual count */}
        <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <div className="font-mono text-lg font-bold text-slate-800">{all_alarms.length}</div>
          <div className="text-xs text-slate-500">Total alarms</div>
        </div>
        {/* CRITICAL — red when > 0, green when cleared */}
        <div className={`rounded border p-3 shadow-sm ${alarmStats.criticalAlarms > 0 ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`font-mono text-lg font-bold ${alarmStats.criticalAlarms > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {alarmStats.criticalAlarms}
          </div>
          <div className="text-xs text-slate-500">CRITICAL</div>
        </div>
        {/* Active incidents — red when > 0, green when all cleared */}
        <div className={`rounded border p-3 shadow-sm ${incidentStats.active > 0 ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`font-mono text-lg font-bold ${incidentStats.active > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {incidentStats.active}
          </div>
          <div className="text-xs text-slate-500">Active incidents</div>
        </div>
        {/* Noise suppressed — always 35, factual */}
        <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <div className="font-mono text-lg font-bold text-slate-500">{nuisance_alarms.length}</div>
          <div className="text-xs text-slate-500">Noise suppressed</div>
        </div>
      </div>

      {/* All-acknowledged completion line */}
      {allAcknowledged && (
        <p className="text-xs text-emerald-600 font-mono mb-3">
          All incidents acknowledged — shift ready for handoff
        </p>
      )}
      {!allAcknowledged && <div className="mb-3" />}

      {/* Data sources panel */}
      <div className="mb-6 rounded border border-slate-200 bg-white shadow-sm px-4 py-3">
        <div className="text-[10px] font-semibold tracking-widest text-[#0066B2] uppercase mb-1.5">
          Data Sources
        </div>
        <p className="text-xs text-slate-500 font-mono">
          This copilot synthesizes data from: DeltaV alarm stream (60 alarms) · Incident triage via Alarm Mosaic groupings · Alarm Help rationalization context (causes, consequences, responses) · AgileOps Database approved alarm attributes · Operator acknowledgment state · DeltaV Logbooks open tasks
        </p>
      </div>

      {/* Incidents summary table */}
      <div className="mb-6 rounded border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-semibold tracking-widest text-[#0066B2] uppercase">
            {incidentHeading}
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {incidents.map((inc) => {
            const isAcked = getEffectiveIncidentState(inc.id) === "ACKNOWLEDGED";
            return (
              <div
                key={inc.id}
                className={`px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 border-l-4 transition-colors ${
                  isAcked
                    ? "border-l-emerald-400 bg-emerald-50"
                    : "border-l-red-400 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2 sm:w-56 shrink-0 flex-wrap">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                      inc.severity === "CRITICAL"
                        ? "bg-red-600 text-white"
                        : inc.severity === "HIGH"
                        ? "bg-orange-500 text-white"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  {isAcked && (
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-600 text-white">
                      ACKNOWLEDGED
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-500">{inc.id}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700 font-medium">{inc.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    {inc.alarms.length} alarms · {formatTimestamp(inc.first_alarm_time)} –{" "}
                    {formatTimestamp(inc.last_alarm_time)} UTC
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LLM handoff client component */}
      <HandoffClient plant={plant} shift={shift} operator={operator} />
    </div>
  );
}
