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
          <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
            RAW ALARM INBOX
          </h1>
          <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
            UNFILTERED
          </span>
        </div>
        <p className="text-xs text-zinc-500 font-mono">
          {plant} · {shift}
        </p>
        <p className="text-xs text-zinc-600 font-mono mt-0.5">
          {stats.unacknowledged} of {TOTAL_ALARMS} alarms require attention
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="rounded border border-red-800 bg-red-950/40 p-3">
          <div className="font-mono text-2xl font-bold text-red-400">
            {stats.totalActive}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">Total active alarms</div>
        </div>
        <div className="rounded border border-red-900 bg-red-950/30 p-3">
          <div className="font-mono text-2xl font-bold text-red-500">
            {stats.inLast5Min}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">In last 5 minutes</div>
        </div>
        <div className="rounded border border-orange-900 bg-orange-950/30 p-3">
          <div className="font-mono text-2xl font-bold text-orange-400">
            {stats.highOrCritical}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">HIGH or CRITICAL</div>
        </div>
        <div className="rounded border border-zinc-700 bg-zinc-900 p-3">
          <div className="font-mono text-2xl font-bold text-zinc-300">
            {stats.unacknowledged}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">Unacknowledged</div>
        </div>
      </div>

      {/* Warning banner — historical fact, stays constant */}
      <div className="mb-4 rounded border border-red-700 bg-red-950/30 px-4 py-3 flex items-start gap-3">
        <span className="font-mono text-red-400 text-sm mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-red-300">
            Alarm flood condition — {TOTAL_ALARMS} alarms in 6-minute window
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            ISA-18.2 flood threshold: &gt;10 alarms in 10 minutes. This view shows all
            alarms unfiltered. Use Triage view to identify actionable incidents.
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[90px_100px_1fr_80px_70px] sm:grid-cols-[90px_160px_1fr_90px_70px] gap-x-3 px-3 py-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase border-b border-zinc-800 mb-1">
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

      <p className="mt-6 text-center text-xs text-zinc-600 font-mono">
        — end of alarm log — {TOTAL_ALARMS} records —
      </p>
    </div>
  );
}

function AlarmRow({ alarm }: { alarm: Alarm }) {
  const effectiveState = getEffectiveAlarmState(alarm);
  const isEffectivelyAcked = effectiveState === "ACK" && alarm.state !== "ACK";
  // isEffectivelyAcked = true only when the alarm became ACK through incident acknowledgment
  // (not because it was ACK in the raw JSON — those already render with their own styling)
  const isCritical = alarm.priority === "CRITICAL";
  const isHigh = alarm.priority === "HIGH";
  const isRtn = alarm.state === "RTN";

  return (
    <div
      className={`grid grid-cols-[90px_100px_1fr_80px_70px] sm:grid-cols-[90px_160px_1fr_90px_70px] gap-x-3 px-3 py-2 text-xs border-b border-zinc-800/50 transition-colors ${
        isEffectivelyAcked
          ? "opacity-50 bg-zinc-900/30"
          : isRtn
          ? "opacity-40 bg-zinc-900/30"
          : isCritical
          ? "bg-red-950/20 hover:bg-red-950/30"
          : isHigh
          ? "bg-orange-950/10 hover:bg-orange-950/20"
          : "hover:bg-zinc-900/50"
      }`}
    >
      <span className="font-mono text-zinc-400">
        {formatTimestamp(alarm.timestamp)}
      </span>
      <span
        className={`font-mono truncate ${
          isCritical ? "text-red-400" : isHigh ? "text-orange-400" : "text-zinc-300"
        }`}
      >
        {alarm.tag}
      </span>
      <span
        className={`truncate ${
          isCritical ? "text-red-300" : isHigh ? "text-orange-300" : "text-zinc-400"
        }`}
      >
        {alarm.description}
        {isCritical && !isEffectivelyAcked && (
          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse align-middle" />
        )}
      </span>
      <span className="text-zinc-600 truncate hidden sm:block">
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
            ? "text-zinc-600"
            : effectiveState === "ACK"
            ? "text-zinc-400"
            : "text-amber-400"
        }`}
      >
        {effectiveState}
      </span>
    </div>
  );
}
