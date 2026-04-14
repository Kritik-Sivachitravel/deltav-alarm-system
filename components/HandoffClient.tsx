"use client";

import { useState } from "react";
import { getAcknowledgedIds } from "@/lib/alarm-state";

interface HandoffClientProps {
  plant: string;
  shift: string;
  operator: string;
}

export default function HandoffClient({ plant, shift, operator }: HandoffClientProps) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgedIds: getAcknowledgedIds() }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBullets(data.bullets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
    const text = [
      `SHIFT HANDOFF — ${plant}`,
      `${shift} → Day Shift`,
      `Outgoing: ${operator} | Time: ${now} UTC`,
      "",
      ...bullets.map((b) => `• ${b}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded border border-zinc-700 bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Assisted Handoff Draft
          </h2>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            Generated from validated incident data · Operator review required before submission
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bullets.length > 0 && (
            <button
              onClick={copyToClipboard}
              className="rounded px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="rounded px-4 py-1.5 text-xs font-semibold bg-orange-700 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-wait text-white transition-colors"
          >
            {loading ? "Generating…" : bullets.length > 0 ? "Regenerate" : "Generate Handoff"}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 py-4 min-h-[200px]">
        {!bullets.length && !loading && !error && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="text-zinc-600 text-sm mb-2">No handoff draft generated</div>
              <p className="text-xs text-zinc-700 max-w-xs">
                Click &ldquo;Generate Handoff&rdquo; to compile a structured 5-bullet summary
                from the current incident data.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="flex justify-center gap-1 mb-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-500 font-mono">Sending incident data to Claude…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-800 bg-red-950/20 px-4 py-3">
            <p className="text-xs text-red-400">Error: {error}</p>
            <p className="text-xs text-zinc-600 mt-1">
              Check that ANTHROPIC_API_KEY is set in your environment.
            </p>
          </div>
        )}

        {bullets.length > 0 && !loading && (
          <div className="space-y-4">
            {bullets.map((bullet, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="flex-shrink-0 font-mono text-orange-500 text-sm leading-5">•</span>
                <p className="text-sm text-zinc-300 leading-relaxed">{bullet}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-700 font-mono">
                Generated by Claude claude-sonnet-4-6 · Review and edit before submitting to DCS log
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
