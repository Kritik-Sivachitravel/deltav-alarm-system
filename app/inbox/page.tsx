"use client";

import { useState, useEffect } from "react";
import { getTriageData, getPriorityBadgeClass, formatTimestamp, type Alarm } from "@/lib/triage";
import { getEffectiveAlarmStats, getEffectiveAlarmState, subscribe } from "@/lib/alarm-state";

const TOTAL_ALARMS = 60; // immutable historical count for the subtitle

export default function InboxPage() {
  const [, forceUpdate] = useState(0);
  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);

  const { all_alarms, plant, shift } = getTriageData();
  const stats = getEffectiveAlarmStats(all_alarms);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-lg font-semibold tracking-wide text-slate-900">
            RAW ALARM INBOX
          </h1>
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            UNFILTERED
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          {plant} · {shift}
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          {stats.unacknowledged} of {TOTAL_ALARMS} alarms require attention
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Unfiltered alarm stream — used as input for incident clustering and handoff generation
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="rounded border border-red-200 bg-red-50 p-3 shadow-sm">
          <div className="font-mono text-2xl font-bold text-red-600">
            {stats.totalActive}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Total active alarms</div>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-3 shadow-sm">
          <div className="font-mono text-2xl font-bold text-red-600">
            {stats.inLast5Min}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">In last 5 minutes</div>
        </div>
        <div className="rounded border border-orange-200 bg-orange-50 p-3 shadow-sm">
          <div className="font-mono text-2xl font-bold text-orange-600">
            {stats.highOrCritical}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">HIGH or CRITICAL</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <div className="font-mono text-2xl font-bold text-slate-700">
            {stats.unacknowledged}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">Unacknowledged</div>
        </div>
      </div>

      {/* Warning banner — historical fact, stays constant */}
      <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3 shadow-sm">
        <span className="font-mono text-red-600 text-sm mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-red-700">
            Alarm flood condition — {TOTAL_ALARMS} alarms in 6-minute window
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            ISA-18.2 flood threshold: &gt;10 alarms in 10 minutes. This view shows all
            alarms unfiltered. Use Triage view to identify actionable incidents.
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[90px_100px_1fr_80px_70px] sm:grid-cols-[90px_160px_1fr_90px_70px] gap-x-3 px-3 py-2 text-xs font-semibold tracking-widest text-slate-500 uppercase border-b border-slate-200 mb-1 bg-slate-50">
        <span>Time</span>
        <span>Tag</span>
        <span>Description</span>
        <span className="hidden sm:block">Area</span>
        <span>Pri</span>
        <span>State</span>
      </div>

      {/* Alarm rows */}
      <div className="space-y-px">
        {all_alarms.map((alarm) => (
          <AlarmRow key={alarm.id} alarm={alarm} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 font-mono">
        — end of alarm log — {TOTAL_ALARMS} records —
      </p>
    </div>
  );
}

function AlarmRow({ alarm }: { alarm: Alarm }) {
  const effectiveState = getEffectiveAlarmState(alarm);
  const isEffectivelyAcked = effectiveState === "ACK" && alarm.state !== "ACK";
  const isCritical = alarm.priority === "CRITICAL";
  const isHigh = alarm.priority === "HIGH";
  const isRtn = alarm.state === "RTN";

  return (
    <div
      className={`grid grid-cols-[90px_100px_1fr_80px_70px] sm:grid-cols-[90px_160px_1fr_90px_70px] gap-x-3 px-3 py-2 text-xs border-b border-slate-100 transition-colors ${
        isEffectivelyAcked
          ? "opacity-50 bg-slate-100"
          : isRtn
          ? "opacity-40 bg-slate-50"
          : isCritical
          ? "bg-red-50 hover:bg-red-100"
          : isHigh
          ? "bg-orange-50 hover:bg-orange-100"
          : "hover:bg-slate-50"
      }`}
    >
      <span className="font-mono text-slate-500">
        {formatTimestamp(alarm.timestamp)}
      </span>
      <span
        className={`font-mono truncate ${
          isCritical ? "text-red-600" : isHigh ? "text-orange-600" : "text-slate-700"
        }`}
      >
        {alarm.tag}
      </span>
      <span
        className={`truncate ${
          isCritical ? "text-red-700" : isHigh ? "text-orange-700" : "text-slate-600"
        }`}
      >
        {alarm.description}
        {isCritical && !isEffectivelyAcked && (
          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse align-middle" />
        )}
      </span>
      <span className="text-slate-400 truncate hidden sm:block">
        {alarm.area.split(" - ")[0]}
      </span>
      <span>
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight font-mono ${getPriorityBadgeClass(alarm.priority)}`}
        >
          {alarm.priority === "CRITICAL" ? "CRIT" : alarm.priority}
        </span>
      </span>
      <span
        className={`font-mono text-[10px] ${
          isEffectivelyAcked
            ? "text-emerald-600"
            : effectiveState === "RTN"
            ? "text-slate-400"
            : effectiveState === "ACK"
            ? "text-slate-500"
            : "text-amber-600"
        }`}
      >
        {effectiveState}
      </span>
    </div>
  );
}
