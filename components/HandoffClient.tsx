"use client";

import { useState, useEffect, useRef } from "react";
import { getAcknowledgedIds } from "@/lib/alarm-state";

function renderBullet(text: string): string {
  // Convert **...** to <strong>
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

interface HandoffClientProps {
  plant: string;
  shift: string;
  operator: string;
}

export default function HandoffClient({ plant, shift, operator }: HandoffClientProps) {
  const [bullets, setBullets] = useState<{ text: string; evidence: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowModal(false);
    }
    if (showModal) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

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
      setShowModal(true);
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
      ...bullets.map((b) => `• ${b.text}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Inline card */}
      <div className="rounded border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-[#0066B2] uppercase">
              Shift Handoff Draft
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Drafted from operator-reviewed incident data · Operator review required before submission
            </p>
          </div>
          <div className="flex items-center gap-2">
            {bullets.length > 0 && !loading && (
              <button
                onClick={() => setShowModal(true)}
                className="rounded px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-[#0066B2] border border-[#0066B2] transition-colors"
              >
                View Report →
              </button>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="rounded px-4 py-1.5 text-xs font-semibold bg-[#0066B2] hover:bg-[#004E8C] disabled:opacity-50 disabled:cursor-wait text-white transition-colors"
            >
              {loading ? "Generating…" : bullets.length > 0 ? "Regenerate" : "Generate Handoff"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="px-4 py-4 min-h-[160px]">
          {!bullets.length && !loading && !error && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">No handoff draft generated</div>
                <p className="text-xs text-slate-400 max-w-xs">
                  Click &ldquo;Generate Handoff&rdquo; to compile a structured 5-bullet summary
                  from the current incident data.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-[#0066B2] animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-mono">Generating shift narrative…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Error: {error}</p>
              <p className="text-xs text-slate-500 mt-1">
                Check that ANTHROPIC_API_KEY is set in your environment.
              </p>
            </div>
          )}

          {bullets.length > 0 && !loading && (
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                  <span className="text-emerald-700 text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Shift narrative ready</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {bullets.length} items · AI-assisted draft · Review before submitting to DCS log
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="shrink-0 rounded px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Open Report →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay */}
      {showModal && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(2px)" }}
          onClick={(e) => {
            if (e.target === overlayRef.current) setShowModal(false);
          }}
        >
          <div
            className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden"
            style={{ borderTop: "4px solid #0066B2" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">
                  SHIFT HANDOFF NARRATIVE
                </h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {plant} · {shift} → Day Shift · Outgoing: {operator}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none font-light"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              <ol className="space-y-5">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="shrink-0 font-mono text-[10px] font-bold text-[#0066B2] bg-blue-50 border border-blue-200 rounded w-5 h-5 flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p
                        className="text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderBullet(bullet.text) }}
                      />
                      {bullet.evidence.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {bullet.evidence.map((ev) => (
                            <span
                              key={ev}
                              className="font-mono text-[9px] text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-[10px] text-slate-400 font-mono">
                Operator review required before submitting to DCS log
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="rounded px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 transition-colors"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded px-4 py-1.5 text-xs font-semibold bg-[#0066B2] hover:bg-[#004E8C] text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
