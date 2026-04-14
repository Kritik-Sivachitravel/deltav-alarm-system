"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendDataPoint {
  time: string;
  "Suction Pressure (psig)": number;
  "Vibration (mm/s)": number;
  "Drum Level (%)": number;
  "Steam Header (psig)": number;
}

const LINE_CONFIG = [
  { key: "Suction Pressure (psig)", color: "#ef4444", yAxisId: "pressure" },
  { key: "Vibration (mm/s)", color: "#f97316", yAxisId: "small" },
  { key: "Drum Level (%)", color: "#eab308", yAxisId: "small" },
  { key: "Steam Header (psig)", color: "#60a5fa", yAxisId: "pressure" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-zinc-400 mb-2">{label} UTC</div>
      {payload.map((entry: { color: string; name: string; value: number }) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <div
            className="h-1.5 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-400">{entry.name}:</span>
          <span style={{ color: entry.color }} className="font-semibold">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({ data }: { data: TrendDataPoint[] }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#3f3f46" }}
            interval={4}
          />
          {/* Left axis: pressure (0-700) */}
          <YAxis
            yAxisId="pressure"
            orientation="left"
            domain={[0, 650]}
            tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {/* Right axis: vibration + level (0-100) */}
          <YAxis
            yAxisId="small"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#71717a", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#a1a1aa",
              paddingTop: "8px",
            }}
          />
          {LINE_CONFIG.map((cfg) => (
            <Line
              key={cfg.key}
              type="monotone"
              dataKey={cfg.key}
              yAxisId={cfg.yAxisId}
              stroke={cfg.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
