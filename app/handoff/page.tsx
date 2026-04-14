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
          <h1 className="text-base font-semibold tracking-wide text-zinc-100">
            SHIFT HANDOFF SUMMARY
          </h1>
          <span className="font-mono text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
            ASSISTED DRAFT
          </span>
        </div>
        <p className="text-xs text-zinc-500 font-mono">
          {plant} · {shift} → Day Shift · Outgoing: {operator}
        </p>
      </div>

      {/* Stat cards — live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Total alarms — always 60, factual count */}
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="font-mono text-lg font-bold text-zinc-200">{all_alarms.length}</div>
          <div className="text-xs text-zinc-600">Total alarms</div>
        </div>
        {/* CRITICAL — only unacknowledged CRITICAL alarms */}
        <div className="rounded border border-red-900 bg-red-950/20 p-3">
          <div className="font-mono text-lg font-bold text-red-400">
            {alarmStats.criticalAlarms}
          </div>
          <div className="text-xs text-zinc-600">CRITICAL</div>
        </div>
        {/* Active incidents — drops as incidents are acked */}
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="font-mono text-lg font-bold text-orange-400">
            {incidentStats.active}
          </div>
          <div className="text-xs text-zinc-600">Active incidents</div>
        </div>
        {/* Noise suppressed — always 35, factual */}
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="font-mono text-lg font-bold text-zinc-500">{nuisance_alarms.length}</div>
          <div className="text-xs text-zinc-600">Noise suppressed</div>
        </div>
      </div>

      {/* All-acknowledged completion line */}
      {allAcknowledged && (
        <p className="text-xs text-emerald-600 font-mono mb-6">
          All incidents acknowledged — shift ready for handoff
        </p>
      )}
      {!allAcknowledged && <div className="mb-6" />}

      {/* Incidents summary table */}
      <div className="mb-6 rounded border border-zinc-800 bg-zinc-900/30">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            {incidentHeading}
          </h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {incidents.map((inc) => {
            const isAcked = getEffectiveIncidentState(inc.id) === "ACKNOWLEDGED";
            return (
              <div
                key={inc.id}
                className={`px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 transition-opacity ${
                  isAcked ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 sm:w-56 flex-shrink-0 flex-wrap">
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
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-900 text-emerald-300 border border-emerald-700">
                      ACKNOWLEDGED
                    </span>
                  )}
                  <span className="font-mono text-xs text-zinc-500">{inc.id}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-zinc-300 font-medium">{inc.title}</div>
                  <div className="text-xs text-zinc-600 mt-0.5 font-mono">
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
