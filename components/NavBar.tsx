"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { resetStore } from "@/lib/alarm-state";

const NAV_LINKS = [
  { href: "/", label: "Triage", shortLabel: "Triage" },
  { href: "/inbox", label: "Raw Inbox", shortLabel: "Inbox" },
  { href: "/incident/INC-001", label: "Incident Detail", shortLabel: "Detail" },
  { href: "/handoff", label: "Shift Handoff", shortLabel: "Handoff" },
];

// Scenario clock: starts at 02:47:00 UTC and ticks forward in real time
const BASE_TIME = new Date("2026-04-12T02:47:00Z").getTime();

function formatClockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayTime = formatClockTime(BASE_TIME + elapsed * 1000);

  function handleReset() {
    if (window.confirm("Reset demo state? This clears all acknowledgments.")) {
      resetStore();
      router.push("/");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-0">
        {/* Logo / brand */}
        <div className="flex items-center gap-2 py-3 pr-6 border-r border-zinc-800 mr-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold tracking-widest text-zinc-300 uppercase">
            DeltaV ATA
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-3 text-xs font-medium tracking-wide transition-colors border-b-2 ${
                isActive(link.href)
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden">{link.shortLabel}</span>
            </Link>
          ))}
        </div>

        {/* Right side: status pill + reset */}
        <div className="flex items-center gap-3 py-3 pl-4 border-l border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-xs text-zinc-500 hidden sm:block">
              RIVERSIDE · NIGHT SHIFT · {displayTime}
            </span>
            <span className="font-mono text-xs text-zinc-500 sm:hidden">LIVE</span>
          </div>
          <button
            onClick={handleReset}
            className="font-mono text-[10px] text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 transition-colors hidden sm:block"
          >
            RESET DEMO
          </button>
        </div>
      </div>
    </nav>
  );
}
