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

interface TrendChartProps {
  data: TrendDataPoint[];
  activeVar?: string | null;
  onVarClick?: (key: string | null) => void;
}

const LINE_CONFIG = [
  { key: "Suction Pressure (psig)", color: "#ef4444", yAxisId: "pressure" },
  { key: "Vibration (mm/s)", color: "#f97316", yAxisId: "small" },
  { key: "Drum Level (%)", color: "#ca8a04", yAxisId: "small" },
  { key: "Steam Header (psig)", color: "#2563eb", yAxisId: "pressure" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-mono shadow-lg">
      <div className="text-slate-500 mb-2">{label} UTC</div>
      {payload.map((entry: { color: string; name: string; value: number }) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <div
            className="h-1.5 w-3 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span style={{ color: entry.color }} className="font-semibold">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload, activeVar, onVarClick }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2">
      {payload?.map((entry: { value: string; color: string }) => {
        const isActive = !activeVar || activeVar === entry.value;
        return (
          <button
            key={entry.value}
            onClick={() =>
              onVarClick?.(activeVar === entry.value ? null : entry.value)
            }
            className="flex items-center gap-1.5 font-mono text-[10px] transition-opacity"
            style={{ opacity: isActive ? 1 : 0.3, cursor: "pointer" }}
          >
            <div
              className="h-0.5 w-4 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: isActive ? "#475569" : "#94a3b8" }}>
              {entry.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function TrendChart({
  data,
  activeVar,
  onVarClick,
}: TrendChartProps) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#CBD5E1" }}
            interval={4}
          />
          <YAxis
            yAxisId="pressure"
            orientation="left"
            domain={[0, 650]}
            tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <YAxis
            yAxisId="small"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={
              <CustomLegend activeVar={activeVar} onVarClick={onVarClick} />
            }
          />
          {LINE_CONFIG.map((cfg) => {
            const isActive = !activeVar || activeVar === cfg.key;
            return (
              <Line
                key={cfg.key}
                type="monotone"
                dataKey={cfg.key}
                yAxisId={cfg.yAxisId}
                stroke={cfg.color}
                strokeWidth={activeVar === cfg.key ? 2.5 : 1.5}
                strokeOpacity={isActive ? 1 : 0.2}
                dot={false}
                activeDot={{
                  r: activeVar === cfg.key ? 5 : 3,
                  strokeWidth: 0,
                  cursor: "pointer",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick: (_: any) => {
                    onVarClick?.(activeVar === cfg.key ? null : cfg.key);
                  },
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {activeVar && (
        <p className="text-[10px] text-slate-400 font-mono text-center mt-1">
          {activeVar} — click legend or dot to deselect
        </p>
      )}
    </div>
  );
}
