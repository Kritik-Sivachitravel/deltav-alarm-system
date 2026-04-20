"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getTriageData,
  getPriorityBadgeClass,
  getPriorityColor,
  formatTimestamp,
  type Incident,
  type Alarm,
} from "@/lib/triage";
import {
  getEffectiveIncidentStats,
  getAcknowledgedIds,
  subscribe,
} from "@/lib/alarm-state";

type NuisanceCategory =
  | "CHATTERING"
  | "STALE / COMM FAULT"
  | "ROUTINE TEST"
  | "LOW-PRIORITY BACKGROUND";

const NUISANCE_META: Record<
  NuisanceCategory,
  { description: string; color: string }
> = {
  CHATTERING: {
    description:
      "Rapid repeated activations from a single tag — instrument fault or field vibration. ISA-18.2 suppression candidate.",
    color: "text-amber-700",
  },
  "STALE / COMM FAULT": {
    description:
      "Communication timeouts, stale data reads, transmitter faults — no process deviation.",
    color: "text-orange-700",
  },
  "ROUTINE TEST": {
    description:
      "Scheduled system tests (safety valve, UPS, lamp). Expected behavior — no response required.",
    color: "text-blue-700",
  },
  "LOW-PRIORITY BACKGROUND": {
    description:
      "Normal process deviations within operating envelope. No shift response required unless trend changes.",
    color: "text-slate-500",
  },
};

const CATEGORY_ORDER: NuisanceCategory[] = [
  "CHATTERING",
  "STALE / COMM FAULT",
  "ROUTINE TEST",
  "LOW-PRIORITY BACKGROUND",
];

function categorizeNuisance(alarm: Alarm): NuisanceCategory {
  const d = alarm.description.toLowerCase();
  const tag = alarm.tag.toLowerCase();
  if (d.includes("chattering")) return "CHATTERING";
  if (
    tag.includes("-comm") ||
    d.includes("stale") ||
    d.includes("timeout") ||
    d.includes("watchdog") ||
    d.includes("off-line") ||
    d.includes("no connection") ||
    d.includes("write lag") ||
    d.includes("signal strength") ||
    d.includes("feedback timeout") ||
    (d.includes("spare") && d.includes("out-of-range"))
  )
    return "STALE / COMM FAULT";
  if (d.includes("test")) return "ROUTINE TEST";
  return "LOW-PRIORITY BACKGROUND";
}

function getRankingFactors(incident: Incident) {
  const critCount = incident.alarms.filter(
    (a) => a.priority === "CRITICAL"
  ).length;
  const duration = Math.round(
    (new Date(incident.last_alarm_time).getTime() -
      new Date(incident.first_alarm_time).getTime()) /
      1000
  );
  const unitCount = incident.affected_units.length;
  const unitStr =
    incident.affected_units.slice(0, 2).join(" → ") +
    (unitCount > 2 ? ` +${unitCount - 2}` : "");
  const confidence =
    incident.severity === "CRITICAL" && critCount >= 3
      ? "High"
      : incident.alarms.length >= 4
      ? "Moderate"
      : "Low";
  const confidenceDetail =
    confidence === "High"
      ? "primary cause pattern confirmed"
      : confidence === "Moderate"
      ? "probable mechanism, review required"
      : "cause under investigation";

  return [
    {
      label: "Severity",
      value: `${incident.severity} · ${critCount} critical alarm${critCount !== 1 ? "s" : ""} in cascade`,
    },
    { label: "Volume", value: `${incident.alarms.length} alarms · ${duration}s window` },
    {
      label: "Propagation",
      value: `${unitCount} unit${unitCount !== 1 ? "s" : ""} — ${unitStr}`,
    },
    { label: "Confidence", value: `${confidence} — ${confidenceDetail}` },
  ];
}

export default function TriagePage() {
  const [, forceUpdate] = useState(0);
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);

  const { incidents, nuisance_alarms, all_alarms, plant, shift, operator } =
    getTriageData();
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
            <h1 className="text-base font-semibold tracking-wide text-slate-900">
              INCIDENT TRIAGE
            </h1>
            {allAcknowledged ? (
              <span className="font-mono text-xs bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded">
                ALL ACKNOWLEDGED
              </span>
            ) : (
              <span className="font-mono text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded">
                {incidentStats.active} ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Triage context — acknowledged incidents inform the shift handoff draft
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {plant} · {shift} · Operator: {operator}
          </p>
          {allAcknowledged ? (
            <p className="text-xs text-emerald-600 font-mono mt-0.5">
              All incidents acknowledged — shift ready for handoff
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {incidentStats.active} active{" "}
              {incidentStats.active === 1 ? "incident" : "incidents"} ·{" "}
              {incidentStats.acknowledged} acknowledged this shift
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-slate-700 font-semibold">{all_alarms.length} alarms</div>
            <div className="text-slate-400">in 6-min window</div>
          </div>
          <div className="text-right">
            <div className="text-red-600 font-semibold">{criticalCount} CRITICAL</div>
            <div className="text-slate-400">requiring attention</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 font-semibold">{nuisance_alarms.length} filtered</div>
            <div className="text-slate-400">nuisance / noise</div>
          </div>
        </div>
      </div>

      {/* ISA-18.2 note */}
      <div className="mb-6 flex items-start gap-3 rounded border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-[#0066B2] text-xs mt-0.5 font-mono font-semibold shrink-0">
          ISA-18.2
        </span>
        <div>
          <p className="text-xs text-slate-600">
            Alarm flood confirmed.{" "}
            <span className="font-medium text-slate-800">
              {all_alarms.length} alarms in a 6-min window
            </span>{" "}
            — equivalent to{" "}
            <span className="font-medium text-red-700">
              {Math.round((all_alarms.length / 6) * 60)}/hr
            </span>
            ; ISA-18.2 max manageable rate is 12/hr per operator console. Triaged to{" "}
            <span className="font-medium text-slate-800">
              {incidents.length} actionable incidents
            </span>{" "}
            via temporal clustering and propagation analysis.{" "}
            <span className="text-slate-500">
              {nuisance_alarms.length} signals suppressed
            </span>{" "}
            (chattering ×10, comm faults ×10, scheduled tests ×3, background ×12).
          </p>
          <p className="text-xs text-slate-400 font-mono mt-1.5">
            In production, incident clustering draws from DeltaV Alarm Mosaic groupings
            and AgileOps rationalization data.
          </p>
        </div>
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

      {/* Nuisance section */}
      <NuisanceSection alarms={nuisance_alarms} />
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
  const factors = getRankingFactors(incident);

  return (
    <div
      className={`rounded-lg border p-5 transition-opacity shadow-sm ${
        isCritical
          ? "border-red-300 bg-red-50"
          : isHigh
          ? "border-orange-300 bg-orange-50"
          : "border-slate-200 bg-white"
      } ${isAcked ? "opacity-50" : ""}`}
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 h-7 w-7 rounded font-mono text-sm font-bold flex items-center justify-center ${
              isCritical ? "bg-red-600 text-white" : "bg-orange-500 text-white"
            }`}
          >
            {rank}
          </div>
          <div>
            <h2
              className={`font-semibold text-sm ${
                isCritical ? "text-red-800" : "text-orange-800"
              }`}
            >
              {incident.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${getPriorityBadgeClass(incident.severity)}`}
              >
                {incident.severity}
              </span>
              {isAcked && (
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-emerald-600 text-white">
                  ACKNOWLEDGED
                </span>
              )}
              <span className="font-mono text-xs text-slate-500">{incident.id}</span>
              <span className="font-mono text-xs text-slate-400">
                {formatTimestamp(incident.first_alarm_time)} →{" "}
                {formatTimestamp(incident.last_alarm_time)}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
          <div
            className={`font-mono text-2xl font-bold ${
              isCritical ? "text-red-600" : "text-orange-600"
            }`}
          >
            {incident.alarms.length}
          </div>
          <div className="text-xs text-slate-500">alarms</div>
        </div>
      </div>

      {/* Affected units */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {incident.affected_units.map((unit) => (
          <span
            key={unit}
            className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
          >
            {unit}
          </span>
        ))}
      </div>

      {/* Ranking factors */}
      <div className="mb-4 rounded border border-slate-200 bg-white/60 px-3 py-2.5">
        <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-2">
          Why ranked #{rank}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {factors.map((f) => (
            <div key={f.label} className="flex items-baseline gap-2 min-w-0">
              <span className="shrink-0 text-[10px] font-semibold text-slate-400 uppercase w-20">
                {f.label}
              </span>
              <span className="text-[11px] text-slate-600 leading-snug">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Root cause + recommendation */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
            Root Cause Hypothesis
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {incident.root_cause_hypothesis}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
            Recommended Next Check
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {incident.recommended_next_check}
          </p>
        </div>
      </div>

      {/* First 3 alarms preview */}
      <div className="space-y-1 mb-4">
        {incident.alarms.slice(0, 3).map((alarm) => (
          <div
            key={alarm.id}
            className="flex items-center gap-3 text-xs font-mono text-slate-500"
          >
            <span className="text-slate-400 shrink-0">
              {formatTimestamp(alarm.timestamp)}
            </span>
            <span className={`shrink-0 ${getPriorityColor(alarm.priority)}`}>
              {alarm.tag}
            </span>
            <span className="truncate text-slate-500">{alarm.description}</span>
          </div>
        ))}
        {incident.alarms.length > 3 && (
          <div className="text-xs font-mono text-slate-400">
            + {incident.alarms.length - 3} more alarms in this incident
          </div>
        )}
      </div>

      <Link
        href={`/incident/${incident.id}`}
        className={`inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
          isCritical
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {isAcked ? "View Details (Acknowledged)" : "View Incident Details →"}
      </Link>
    </div>
  );
}

function NuisanceSection({ alarms }: { alarms: Alarm[] }) {
  const [openCategories, setOpenCategories] = useState<Set<NuisanceCategory>>(
    new Set()
  );

  const grouped = CATEGORY_ORDER.reduce<Record<NuisanceCategory, Alarm[]>>(
    (acc, cat) => {
      acc[cat] = alarms.filter((a) => categorizeNuisance(a) === cat);
      return acc;
    },
    {} as Record<NuisanceCategory, Alarm[]>
  );

  function toggle(cat: NuisanceCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Suppressed / Nuisance
          </span>
          <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            {alarms.length} alarms
          </span>
        </div>
        <Link
          href="/inbox"
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors underline-offset-2 hover:underline"
        >
          View in raw inbox →
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {CATEGORY_ORDER.map((cat) => {
          const catAlarms = grouped[cat];
          if (catAlarms.length === 0) return null;
          const isOpen = openCategories.has(cat);
          const meta = NUISANCE_META[cat];

          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 text-[10px] font-bold font-mono tracking-widest uppercase ${meta.color}`}
                  >
                    {cat}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-400">
                    ×{catAlarms.length}
                  </span>
                  <span className="text-xs text-slate-400 truncate hidden sm:block">
                    — {meta.description}
                  </span>
                </div>
                <span className="shrink-0 text-slate-400 font-mono text-xs ml-4">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 bg-slate-50/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                    {catAlarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className="flex items-center gap-2 text-xs text-slate-500 font-mono py-0.5"
                      >
                        <span className="text-slate-400 shrink-0">
                          {formatTimestamp(alarm.timestamp)}
                        </span>
                        <span className="text-slate-600 shrink-0">{alarm.tag}</span>
                        <span className="text-slate-400 truncate hidden sm:block">
                          — {alarm.description.slice(0, 45)}
                          {alarm.description.length > 45 ? "…" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-400 font-mono">
          All suppressed signals are logged and available for audit. Suppression
          criteria follow ISA-18.2 nuisance alarm guidelines.
        </p>
      </div>
    </div>
  );
}
