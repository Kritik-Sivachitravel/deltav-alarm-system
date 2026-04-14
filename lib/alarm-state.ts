/**
 * lib/alarm-state.ts
 *
 * Single source of truth for all acknowledgment-derived state.
 * All screens read through these helpers — nothing should import from
 * lib/ack-store directly except this module.
 */

import type { Alarm, AlarmState, Incident } from "./triage";
import {
  isAcknowledged,
  acknowledgeIncident,
  getAcknowledgment,
  getAcknowledgedIds,
  subscribe,
  resetStore,
} from "./ack-store";

// Re-export the write path, subscription, and reset so callers only need one import
export { acknowledgeIncident, getAcknowledgment, getAcknowledgedIds, subscribe, resetStore };

// Alarms after this timestamp count as "in last 5 minutes" of the scenario window
const LAST_5_MIN_CUTOFF = new Date("2026-04-12T02:48:00Z").getTime();

// ---------------------------------------------------------------------------
// Per-alarm effective state
// ---------------------------------------------------------------------------

/**
 * Returns the alarm's effective state.
 * If the alarm belongs to an acknowledged incident, it's treated as ACK
 * regardless of its raw JSON state.
 */
export function getEffectiveAlarmState(alarm: Alarm): AlarmState {
  if (alarm.cluster_id !== null && isAcknowledged(alarm.cluster_id)) {
    return "ACK";
  }
  return alarm.state;
}

// ---------------------------------------------------------------------------
// Per-incident effective state
// ---------------------------------------------------------------------------

/**
 * Returns 'ACKNOWLEDGED' if the incident has been operator-acknowledged,
 * otherwise 'ACTIVE'.
 */
export function getEffectiveIncidentState(
  incidentId: string
): "ACKNOWLEDGED" | "ACTIVE" {
  return isAcknowledged(incidentId) ? "ACKNOWLEDGED" : "ACTIVE";
}

// ---------------------------------------------------------------------------
// Aggregate alarm stats (all counts reflect current ack state)
// ---------------------------------------------------------------------------

export interface EffectiveAlarmStats {
  /** Alarms whose effective state is not ACK (nuisance + active incident alarms) */
  totalActive: number;
  /** Non-ACK alarms timestamped after the 5-min scenario cutoff */
  inLast5Min: number;
  /** Non-ACK alarms with priority HIGH or CRITICAL */
  highOrCritical: number;
  /** Non-ACK alarms with priority CRITICAL only (used by handoff page stat card) */
  criticalAlarms: number;
  /** Alarms whose effective state is exactly UNACK (excludes RTN and ACK) */
  unacknowledged: number;
  /** Alarms with cluster_id === null; always constant regardless of ack state */
  noiseSuppressed: number;
}

export function getEffectiveAlarmStats(alarms: Alarm[]): EffectiveAlarmStats {
  let totalActive = 0;
  let inLast5Min = 0;
  let highOrCritical = 0;
  let criticalAlarms = 0;
  let unacknowledged = 0;
  let noiseSuppressed = 0;

  for (const alarm of alarms) {
    if (alarm.cluster_id === null) {
      noiseSuppressed++;
    }

    const effectiveState = getEffectiveAlarmState(alarm);
    const isEffectivelyAcked = effectiveState === "ACK";

    if (!isEffectivelyAcked) {
      totalActive++;
      if (new Date(alarm.timestamp).getTime() >= LAST_5_MIN_CUTOFF) {
        inLast5Min++;
      }
      if (alarm.priority === "HIGH" || alarm.priority === "CRITICAL") {
        highOrCritical++;
      }
      if (alarm.priority === "CRITICAL") {
        criticalAlarms++;
      }
    }

    if (effectiveState === "UNACK") {
      unacknowledged++;
    }
  }

  return {
    totalActive,
    inLast5Min,
    highOrCritical,
    criticalAlarms,
    unacknowledged,
    noiseSuppressed,
  };
}

// ---------------------------------------------------------------------------
// Aggregate incident stats
// ---------------------------------------------------------------------------

export interface EffectiveIncidentStats {
  total: number;
  /** Incidents not yet operator-acknowledged */
  active: number;
  /** Incidents that have been operator-acknowledged */
  acknowledged: number;
  /** Active (unacknowledged) incidents with CRITICAL severity */
  critical: number;
}

export function getEffectiveIncidentStats(
  incidents: Incident[]
): EffectiveIncidentStats {
  let active = 0;
  let acknowledged = 0;
  let critical = 0;

  for (const inc of incidents) {
    if (isAcknowledged(inc.id)) {
      acknowledged++;
    } else {
      active++;
      if (inc.severity === "CRITICAL") {
        critical++;
      }
    }
  }

  return { total: incidents.length, active, acknowledged, critical };
}
