import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTriageData } from "@/lib/triage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const acknowledgedIds: string[] = Array.isArray(body.acknowledgedIds)
    ? body.acknowledgedIds
    : [];

  const { incidents, nuisance_alarms, plant, shift, operator } = getTriageData();

  const incidentSummaries = incidents.map((inc) => ({
    id: inc.id,
    title: inc.title,
    severity: inc.severity,
    acknowledged: acknowledgedIds.includes(inc.id),
    alarm_count: inc.alarms.length,
    first_alarm: inc.first_alarm_time,
    last_alarm: inc.last_alarm_time,
    affected_units: inc.affected_units,
    root_cause_hypothesis: inc.root_cause_hypothesis,
    recommended_next_check: inc.recommended_next_check,
    alarms: inc.alarms.map((a) => ({
      tag: a.tag,
      description: a.description,
      priority: a.priority,
      timestamp: a.timestamp,
      value: a.value,
      unit_of_measure: a.unit_of_measure,
      setpoint: a.setpoint,
    })),
  }));

  const acknowledgedCount = acknowledgedIds.filter((id) =>
    incidents.some((inc) => inc.id === id)
  ).length;

  const prompt = `You are an industrial control room operator writing a shift handoff note for an outgoing night shift. Write exactly 5 bullet points summarizing the key events, current plant status, and recommended follow-up actions for the incoming day shift operator.

Context:
- Plant: ${plant}
- Shift: ${shift}
- Outgoing operator: ${operator}
- Total incidents this shift: ${incidents.length}
- Incidents acknowledged by operator: ${acknowledgedCount} of ${incidents.length}
- Nuisance/noise alarms suppressed: ${nuisance_alarms.length}

Incident data (each incident includes an "acknowledged" field indicating whether the operator has reviewed and acknowledged it):
${JSON.stringify(incidentSummaries, null, 2)}

Requirements for your response:
- Write exactly 5 bullet points, starting each with "• "
- Use precise process engineering language (plant tags, actual values, setpoints)
- Tone should be factual and concise, like a real DCS operator handoff note
- Each bullet should be 1-2 sentences maximum
- Cover: (1) the primary incident status, (2) current process status after the event, (3) standby equipment readiness, (4) the secondary incident, (5) any open maintenance items or watchpoints for the incoming shift
- If an incident is marked as acknowledged: true, frame it as resolved/contained rather than ongoing — note that it has been acknowledged by the outgoing operator
- If an incident is marked as acknowledged: false, frame it as still active and requiring attention from the incoming shift
- Each bullet that references a specific incident MUST include its ID (INC-001 or INC-002) explicitly within the bullet text
- Do NOT add any preamble, headers, or conclusion — just the 5 bullets
- Output exactly 5 complete bullets, each one self-contained`;

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const rawBullets = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("•"))
      .map((line) => line.slice(1).trim());

    function formatBulletTime(iso: string): string {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "UTC",
      });
    }

    const bullets = rawBullets.map((bulletText) => {
      const refs = [...bulletText.matchAll(/INC-\d+/g)].map((m) => m[0]);
      const uniqueRefs = [...new Set(refs)];
      const evidence = uniqueRefs.map((id) => {
        const inc = incidentSummaries.find((i) => i.id === id);
        if (!inc) return id;
        return `${id} · ${inc.alarm_count} alarms · ${formatBulletTime(inc.first_alarm)}–${formatBulletTime(inc.last_alarm)} UTC`;
      });
      return { text: bulletText, evidence };
    });

    return NextResponse.json({ bullets, raw: text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "Failed to generate handoff summary" },
      { status: 500 }
    );
  }
}
