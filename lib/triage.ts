import alarmData from "@/data/alarms.json";

export type AlarmPriority = "LOW" | "MED" | "HIGH" | "CRITICAL";
export type AlarmState = "UNACK" | "ACK" | "RTN";

export interface Alarm {
  id: string;
  timestamp: string;
  tag: string;
  description: string;
  area: string;
  unit: string;
  priority: AlarmPriority;
  value: number;
  unit_of_measure: string;
  setpoint: number;
  state: AlarmState;
  cluster_id: string | null;
}

export interface IncidentMeta {
  title: string;
  root_cause_hypothesis: string;
  recommended_next_check: string;
}

export interface Incident {
  id: string;
  title: string;
  root_cause_hypothesis: string;
  recommended_next_check: string;
  severity: AlarmPriority;
  alarms: Alarm[];
  first_alarm_time: string;
  last_alarm_time: string;
  affected_units: string[];
}

export interface TriageResult {
  incidents: Incident[];
  nuisance_alarms: Alarm[];
  all_alarms: Alarm[];
  plant: string;
  shift: string;
  operator: string;
  scenario: string;
}

const PRIORITY_RANK: Record<AlarmPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MED: 2,
  LOW: 1,
};

function highestPriority(alarms: Alarm[]): AlarmPriority {
  return alarms.reduce<AlarmPriority>((max, alarm) => {
    return PRIORITY_RANK[alarm.priority] > PRIORITY_RANK[max]
      ? alarm.priority
      : max;
  }, "LOW");
}

function uniqueUnits(alarms: Alarm[]): string[] {
  return [...new Set(alarms.map((a) => a.unit))];
}

export function getTriageData(): TriageResult {
  const alarms = alarmData.alarms as Alarm[];
  const incidentMeta = alarmData.incidents as Record<string, IncidentMeta>;

  // Group alarms by cluster_id
  const clustered = new Map<string, Alarm[]>();
  const nuisance: Alarm[] = [];

  for (const alarm of alarms) {
    if (alarm.cluster_id === null) {
      nuisance.push(alarm);
    } else {
      if (!clustered.has(alarm.cluster_id)) {
        clustered.set(alarm.cluster_id, []);
      }
      clustered.get(alarm.cluster_id)!.push(alarm);
    }
  }

  // Build incident objects
  const incidents: Incident[] = [];
  for (const [id, incidentAlarms] of clustered.entries()) {
    const sorted = [...incidentAlarms].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const meta = incidentMeta[id] ?? {
      title: `Incident ${id}`,
      root_cause_hypothesis: "Root cause under investigation.",
      recommended_next_check: "Review alarm history and process trends.",
    };

    incidents.push({
      id,
      title: meta.title,
      root_cause_hypothesis: meta.root_cause_hypothesis,
      recommended_next_check: meta.recommended_next_check,
      severity: highestPriority(sorted),
      alarms: sorted,
      first_alarm_time: sorted[0].timestamp,
      last_alarm_time: sorted[sorted.length - 1].timestamp,
      affected_units: uniqueUnits(sorted),
    });
  }

  // Sort incidents by severity descending, then by first alarm time ascending
  incidents.sort((a, b) => {
    const rankDiff = PRIORITY_RANK[b.severity] - PRIORITY_RANK[a.severity];
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.first_alarm_time).getTime() - new Date(b.first_alarm_time).getTime();
  });

  return {
    incidents,
    nuisance_alarms: nuisance,
    all_alarms: [...alarms].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    plant: alarmData.plant,
    shift: alarmData.shift,
    operator: alarmData.operator,
    scenario: alarmData.scenario,
  };
}

export function getIncidentById(id: string): Incident | null {
  const { incidents } = getTriageData();
  return incidents.find((inc) => inc.id === id) ?? null;
}

export function getPriorityColor(priority: AlarmPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "text-red-600";
    case "HIGH":
      return "text-orange-600";
    case "MED":
      return "text-yellow-600";
    case "LOW":
      return "text-slate-500";
  }
}

export function getPriorityBg(priority: AlarmPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-50 border-red-300";
    case "HIGH":
      return "bg-orange-50 border-orange-300";
    case "MED":
      return "bg-yellow-50 border-yellow-300";
    case "LOW":
      return "bg-slate-50 border-slate-300";
  }
}

export function getPriorityBadgeClass(priority: AlarmPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MED":
      return "bg-amber-400 text-amber-900";
    case "LOW":
      return "bg-slate-200 text-slate-700";
  }
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function formatDeviation(alarm: Alarm): string {
  const dev = alarm.value - alarm.setpoint;
  const dir = dev > 0 ? "↑" : "↓";
  if (alarm.setpoint === 0) {
    return `${dir}${Math.abs(dev).toFixed(1)} ${alarm.unit_of_measure}`;
  }
  const pct = ((Math.abs(dev) / Math.abs(alarm.setpoint)) * 100).toFixed(1);
  return `${dir}${Math.abs(dev).toFixed(1)} ${alarm.unit_of_measure} (${pct}% from SP)`;
}

// Generate synthetic trend data for an incident's key parameters
export function generateTrendData(incidentId: string) {
  if (incidentId !== "INC-001") return [];

  const startTime = new Date("2026-04-12T02:47:00Z").getTime();
  const points = 25;
  const intervalMs = 15_000; // 15-second intervals over ~6 minutes

  return Array.from({ length: points }, (_, i) => {
    const t = startTime + i * intervalMs;
    const frac = i / (points - 1); // 0..1

    // Suction pressure: 14 → 4 psig (drops sharply early)
    const suctionPressure = 14 - 10 * Math.min(1, frac * 1.8);

    // Pump vibration: 3 → 16 mm/s (rises with cavitation)
    const vibration = 3 + 13 * Math.pow(frac, 0.7);

    // Drum level: 72 → 18 % (lags suction by ~30s)
    const lagFrac = Math.max(0, frac - 0.08);
    const drumLevel = 72 - 54 * Math.min(1, lagFrac * 1.5);

    // Steam header pressure: 625 → 555 psig (lags drum level)
    const steamLagFrac = Math.max(0, frac - 0.15);
    const steamPressure = 625 - 70 * Math.min(1, steamLagFrac * 1.8);

    return {
      time: new Date(t).toISOString().substr(11, 8),
      "Suction Pressure (psig)": Math.round(suctionPressure * 10) / 10,
      "Vibration (mm/s)": Math.round(vibration * 10) / 10,
      "Drum Level (%)": Math.round(drumLevel * 10) / 10,
      "Steam Header (psig)": Math.round(steamPressure * 10) / 10,
    };
  });
}
