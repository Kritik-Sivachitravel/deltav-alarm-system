"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  getIncidentById,
  generateTrendData,
  getPriorityBadgeClass,
  getPriorityColor,
  formatTimestamp,
  formatDeviation,
} from "@/lib/triage";
import TrendChart from "@/components/TrendChart";
import AckButton from "@/components/AckButton";
import {
  subscribe,
  getAcknowledgment,
  getEffectiveAlarmState,
} from "@/lib/alarm-state";

const CHECKLISTS: Record<string, string[]> = {
  "INC-001": [
    "Verify BFW-P-201A suction isolation valve is fully open (FCV-201A-SV01) — partial closure is the most common cause of suction pressure drop at this duty point.",
    "Check deaerator (DA-201) level via DA-201-LI-701. If DA level is also dropping, the supply-side starvation scenario is confirmed — switch to BFW-P-201B manually if auto-start has not engaged.",
    "Once suction pressure is restored above 12 psig, monitor HRSG-201 drum level recovery. If drum level does not recover within 3 minutes, initiate burner load-shedding per SOP-200-L3.",
  ],
  "INC-002": [
    "Confirm CT-301B motor trip status at MCC-301 panel. Check motor overload relay reset condition — do not restart without bearing temperature below 140°F.",
    "Monitor cooling water header supply temperature (CW-HDR-301-TI-901). If header temperature exceeds 88°F, reduce condenser load on TRB-101 per SOP-300-C2.",
    "Notify maintenance team to inspect CT-301B fan blade assembly and bearing condition before any restart attempt. Log in maintenance management system.",
  ],
};

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Capture ack state at mount — used to distinguish "already acked" vs "acked this visit"
  const wasAckedOnMount = useRef(!!getAcknowledgment(id));
  const [preloadAck] = useState(() => getAcknowledgment(id));
  const [newAck, setNewAck] = useState<{ ackedAt: string; ackedBy: string } | null>(null);

  useEffect(() => {
    return subscribe(() => {
      const ack = getAcknowledgment(id);
      if (ack && !wasAckedOnMount.current && !newAck) {
        setNewAck(ack);
        setTimeout(() => router.push("/"), 1500);
      }
    });
  }, [id, router, newAck]);

  const incident = getIncidentById(id);
  if (!incident) {
    notFound();
    return null;
  }

  const trendData = generateTrendData(id);
  const checklist = CHECKLISTS[id] ?? [
    "Review alarm history for upstream causes.",
    "Check equipment status at field.",
    "Consult shift supervisor before taking corrective action.",
  ];

  const isCritical = incident.severity === "CRITICAL";
  // Incident is acked if it was acked before this page loaded or acked during this visit
  const isIncidentAcked = !!preloadAck || !!newAck;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Redirect banner — shown when user acks during this visit */}
      {newAck && (
        <div className="mb-4 rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3">
          <span className="text-emerald-400 font-mono text-xs">
            ✓ Incident {id} acknowledged at {newAck.ackedAt} UTC by {newAck.ackedBy} · Returning to triage view…
          </span>
        </div>
      )}

      {/* Persistent banner — shown when page loads for an already-acked incident */}
      {!newAck && preloadAck && (
        <div className="mb-4 rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3">
          <span className="text-emerald-400 font-mono text-xs">
            ✓ Incident {id} acknowledged at {preloadAck.ackedAt} UTC by {preloadAck.ackedBy}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-bold font-mono ${getPriorityBadgeClass(incident.severity)}`}
          >
            {incident.severity}
          </span>
          <span className="font-mono text-xs text-zinc-500">{incident.id}</span>
          <span className="font-mono text-xs text-zinc-600">
            {formatTimestamp(incident.first_alarm_time)} UTC
          </span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">{incident.title}</h1>
        <p className="text-sm text-zinc-400">
          {incident.alarms.length} alarms · {incident.affected_units.length} affected units ·{" "}
          {incident.affected_units.join(", ")}
        </p>
      </div>

      {/* Root cause + next check */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <div
          className={`rounded border px-4 py-3 ${
            isCritical
              ? "border-red-800 bg-red-950/20"
              : "border-orange-800 bg-orange-950/10"
          }`}
        >
          <div className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-2">
            Root Cause Hypothesis
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {incident.root_cause_hypothesis}
          </p>
        </div>
        <div className="rounded border border-zinc-700 bg-zinc-900/50 px-4 py-3">
          <div className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-2">
            Recommended Next Check
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {incident.recommended_next_check}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT: Timeline + checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cascade timeline */}
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">
              Alarm Cascade Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700" />
              <div className="space-y-0">
                {incident.alarms.map((alarm) => {
                  const effectiveState = getEffectiveAlarmState(alarm);
                  const alarmAcked = effectiveState === "ACK";
                  return (
                    <div
                      key={alarm.id}
                      className={`relative flex gap-4 pb-3 transition-opacity ${alarmAcked ? "opacity-50" : ""}`}
                    >
                      {/* Dot */}
                      <div
                        className={`relative z-10 mt-1 flex-shrink-0 h-3.5 w-3.5 rounded-full border-2 ${
                          alarm.priority === "CRITICAL"
                            ? "border-red-500 bg-red-900"
                            : alarm.priority === "HIGH"
                            ? "border-orange-500 bg-orange-900"
                            : alarm.priority === "MED"
                            ? "border-yellow-500 bg-yellow-900"
                            : "border-zinc-600 bg-zinc-800"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-zinc-500">
                            {formatTimestamp(alarm.timestamp)}
                          </span>
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-[9px] font-bold font-mono ${getPriorityBadgeClass(alarm.priority)}`}
                          >
                            {alarm.priority === "CRITICAL" ? "CRIT" : alarm.priority}
                          </span>
                          {alarmAcked && (
                            <span className="inline-block rounded px-1 py-0.5 text-[9px] font-bold font-mono bg-emerald-900 text-emerald-300 border border-emerald-800">
                              ACK
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs font-mono mt-0.5 ${getPriorityColor(alarm.priority)}`}
                        >
                          {alarm.tag}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          {alarm.description}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                          {alarm.value} {alarm.unit_of_measure} · SP: {alarm.setpoint} ·{" "}
                          {formatDeviation(alarm)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3-step checklist */}
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">
              Response Checklist
            </h2>
            <div className="space-y-3">
              {checklist.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                    <span className="font-mono text-[10px] text-zinc-500">{idx + 1}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ack button */}
          <AckButton incidentId={id} />
        </div>

        {/* RIGHT: Trend chart — unchanged */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">
            Process Trend — 02:47:00 to 02:53:00 UTC
          </h2>
          {trendData.length > 0 ? (
            <TrendChart data={trendData} />
          ) : (
            <div className="rounded border border-zinc-800 bg-zinc-900/50 flex items-center justify-center h-64">
              <p className="text-xs text-zinc-600 font-mono">
                Trend data not available for this incident
              </p>
            </div>
          )}

          {/* Legend / interpretation */}
          <div className="mt-4 rounded border border-zinc-800 bg-zinc-900/30 px-4 py-3">
            <div className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-2">
              Trend Interpretation
            </div>
            <ul className="space-y-1 text-xs text-zinc-500">
              <li>
                <span className="text-red-400 font-mono">Suction pressure</span> drops sharply
                at 02:47 — first indicator of cavitation onset
              </li>
              <li>
                <span className="text-orange-400 font-mono">Vibration</span> rises concurrently
                — cavitation-induced hydraulic instability
              </li>
              <li>
                <span className="text-yellow-400 font-mono">Drum level</span> lags ~30s —
                delayed response as boiler feedwater flow collapses
              </li>
              <li>
                <span className="text-blue-400 font-mono">Steam header pressure</span> drops last
                — downstream consequence of drum level loss
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
