"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SparkPoint = { date: string; clicks: number; conversions: number };

type Props = {
  data: SparkPoint[];
  height?: number;
  showLegend?: boolean;
};

export function SparkChart({ data, height = 220, showLegend = true }: Props) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="aff-clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B54E30" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#B54E30" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="aff-conv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#283B70" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#283B70" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1A18131A" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.slice(5)}
            tick={{ fontSize: 11, fill: "#1A1813" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#1A1813" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#F4EFE3",
              border: "1px solid rgba(26,24,19,0.15)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#1A1813" }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#B54E30"
            fill="url(#aff-clicks)"
            strokeWidth={2}
            name="Clicks"
          />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke="#283B70"
            fill="url(#aff-conv)"
            strokeWidth={2}
            name="Conversiones"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
