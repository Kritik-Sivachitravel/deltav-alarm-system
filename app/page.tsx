"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getTriageData,
  getPriorityBadgeClass,
  getPriorityColor,
  formatTimestamp,
  type Incident,
} from "@/lib/triage";
import {
  getEffectiveIncidentStats,
  getEffectiveIncidentState,
  getAcknowledgedIds,
  subscribe,
} from "@/lib/alarm-state";

export default function TriagePage() {
  const [, forceUpdate] = useState(0);
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);

  const { incidents, nuisance_alarms, all_alarms, plant, shift, operator } = getTriageData();
  const incidentStats = getEffectiveIncidentStats(incidents);
  const criticalCount = all_alarms.filter((a) => a.priority === "CRITICAL").length;
  const ackedIds = new Set(getAcknowledgedIds());

  const allAcknowledged = incidentStats.active === 0 && incidentStats.total > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-semibold tracking-wide text-zinc-100">
              ALARM TRIAGE
            </h1>
            <span className="font-mono text-xs bg-orange-900/40 text-orange-400 border border-orange-800 px-2 py-0.5 rounded">
              ACTIVE INCIDENT
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {plant} · {shift} · Operator: {operator}
          </p>
          {allAcknowledged ? (
            <p className="text-xs text-emerald-600 font-mono mt-0.5">
              All incidents acknowledged — shift ready for handoff
            </p>
          ) : (
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {incidentStats.active} active {incidentStats.active === 1 ? "incident" : "incidents"}{" "}
              · {incidentStats.acknowledged} acknowledged this shift
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-zinc-300 font-semibold">{all_alarms.length} alarms</div>
            <div className="text-zinc-600">in 6-min window</div>
          </div>
          <div className="text-right">
            <div className="text-red-400 font-semibold">{criticalCount} CRITICAL</div>
            <div className="text-zinc-600">requiring attention</div>
          </div>
          <div className="text-right">
            <div className="text-zinc-400 font-semibold">{nuisance_alarms.length} filtered</div>
            <div className="text-zinc-600">nuisance / noise</div>
          </div>
        </div>
      </div>

      {/* ISA-18.2 note */}
      <div className="mb-6 flex items-start gap-3 rounded border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <span className="text-zinc-500 text-xs mt-0.5 font-mono">ISA-18.2</span>
        <p className="text-xs text-zinc-500">
          Alarm flood detected. {all_alarms.length} alarms triaged into{" "}
          <span className="text-zinc-300 font-medium">{incidents.length} actionable incidents</span>{" "}
          using temporal clustering and propagation analysis.{" "}
          <span className="text-zinc-500">{nuisance_alarms.length} nuisance alarms suppressed</span>{" "}
          (chattering switches, stale comms, routine tests).
        </p>
      </div>

      {/* Incident cards */}
      <div className="space-y-4 mb-8">
        {incidents.map((incident, idx) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            rank={idx + 1}
            isAcked={ackedIds.has(incident.id)}
          />
        ))}
      </div>

      {/* Nuisance footer */}
      <div className="rounded border border-zinc-800 bg-zinc-900/30 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-zinc-600 uppercase">
              Suppressed / Nuisance
            </span>
            <span className="font-mono text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
              {nuisance_alarms.length} alarms
            </span>
          </div>
          <Link
            href="/inbox"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline-offset-2 hover:underline"
          >
            View all in raw inbox →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {nuisance_alarms.slice(0, 6).map((alarm) => (
            <div
              key={alarm.id}
              className="flex items-center gap-2 text-xs text-zinc-600 font-mono py-0.5"
            >
              <span className="text-zinc-700">{formatTimestamp(alarm.timestamp)}</span>
              <span className="text-zinc-600 truncate">{alarm.tag}</span>
              <span className="text-zinc-700 truncate hidden sm:block">
                — {alarm.description.slice(0, 40)}
                {alarm.description.length > 40 ? "…" : ""}
              </span>
            </div>
          ))}
          {nuisance_alarms.length > 6 && (
            <div className="text-xs text-zinc-700 font-mono py-0.5 col-span-2">
              + {nuisance_alarms.length - 6} more suppressed alarms…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IncidentCard({
  incident,
  rank,
  isAcked,
}: {
  incident: Incident;
  rank: number;
  isAcked: boolean;
}) {
  const isCritical = incident.severity === "CRITICAL";
  const isHigh = incident.severity === "HIGH";

  return (
    <div
      className={`rounded-lg border p-5 transition-opacity ${
        isCritical
          ? "border-red-700 bg-red-950/20"
          : isHigh
          ? "border-orange-800 bg-orange-950/10"
          : "border-zinc-700 bg-zinc-900/30"
      } ${isAcked ? "opacity-50" : ""}`}
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div
            className={`flex-shrink-0 h-7 w-7 rounded font-mono text-sm font-bold flex items-center justify-center ${
              isCritical ? "bg-red-600 text-white" : "bg-orange-700 text-white"
            }`}
          >
            {rank}
          </div>
          <div>
            <h2 className={`font-semibold text-sm ${isCritical ? "text-red-200" : "text-orange-200"}`}>
              {incident.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${getPriorityBadgeClass(incident.severity)}`}
              >
                {incident.severity}
              </span>
              {isAcked && (
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-900 text-emerald-300 border border-emerald-700">
                  ACKNOWLEDGED
                </span>
              )}
              <span className="font-mono text-xs text-zinc-500">{incident.id}</span>
              <span className="font-mono text-xs text-zinc-600">
                {formatTimestamp(incident.first_alarm_time)} →{" "}
                {formatTimestamp(incident.last_alarm_time)}
              </span>
            </div>
          </div>
        </div>

        {/* Alarm count */}
        <div className="flex-shrink-0 sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
          <div className={`font-mono text-2xl font-bold ${isCritical ? "text-red-400" : "text-orange-400"}`}>
            {incident.alarms.length}
          </div>
          <div className="text-xs text-zinc-600">alarms</div>
        </div>
      </div>

      {/* Affected units */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {incident.affected_units.map((unit) => (
          <span
            key={unit}
            className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700"
          >
            {unit}
          </span>
        ))}
      </div>

      {/* Root cause + recommendation */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5">
          <div className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-1.5">
            Root Cause Hypothesis
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {incident.root_cause_hypothesis}
          </p>
        </div>
        <div className="rounded border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5">
          <div className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-1.5">
            Recommended Next Check
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {incident.recommended_next_check}
          </p>
        </div>
      </div>

      {/* First 3 alarms preview */}
      <div className="space-y-1 mb-4">
        {incident.alarms.slice(0, 3).map((alarm) => (
          <div
            key={alarm.id}
            className="flex items-center gap-3 text-xs font-mono text-zinc-500"
          >
            <span className="text-zinc-600 flex-shrink-0">{formatTimestamp(alarm.timestamp)}</span>
            <span className={`flex-shrink-0 ${getPriorityColor(alarm.priority)}`}>{alarm.tag}</span>
            <span className="truncate text-zinc-600">{alarm.description}</span>
          </div>
        ))}
        {incident.alarms.length > 3 && (
          <div className="text-xs font-mono text-zinc-700">
            + {incident.alarms.length - 3} more alarms in this incident
          </div>
        )}
      </div>

      {/* View details */}
      <Link
        href={`/incident/${incident.id}`}
        className={`inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
          isCritical
            ? "bg-red-700 hover:bg-red-600 text-white"
            : "bg-orange-700 hover:bg-orange-600 text-white"
        }`}
      >
        {isAcked ? "View Details (Acknowledged)" : "View Incident Details →"}
      </Link>
    </div>
  );
}
