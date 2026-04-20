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
            ? "bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default"
            : "bg-[#0066B2] hover:bg-[#004E8C] text-white border border-[#0066B2]"
        }`}
      >
        {ack ? "✓ Acknowledged" : `Acknowledge Incident ${incidentId}`}
      </button>
      {ack && (
        <p className="mt-2 text-[10px] text-slate-400 font-mono text-center">
          Acknowledged at {ack.ackedAt} UTC · Operator: {ack.ackedBy}
        </p>
      )}
    </div>
  );
}
