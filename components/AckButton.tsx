"use client";

import { useState, useEffect } from "react";
import { acknowledgeIncident, getAcknowledgment, subscribe } from "@/lib/alarm-state";

export default function AckButton({ incidentId }: { incidentId: string }) {
  const [ack, setAck] = useState(() => getAcknowledgment(incidentId));

  useEffect(() => {
    return subscribe(() => {
      setAck(getAcknowledgment(incidentId));
    });
  }, [incidentId]);

  return (
    <div>
      <button
        onClick={() => acknowledgeIncident(incidentId, "J. Meyers")}
        disabled={!!ack}
        className={`w-full rounded px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
          ack
            ? "bg-green-900/40 text-green-400 border border-green-800 cursor-default"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
        }`}
      >
        {ack ? "✓ Acknowledged" : `Acknowledge Incident ${incidentId}`}
      </button>
      {ack && (
        <p className="mt-2 text-[10px] text-zinc-600 font-mono text-center">
          Acknowledged at {ack.ackedAt} UTC · Operator: {ack.ackedBy}
        </p>
      )}
    </div>
  );
}
