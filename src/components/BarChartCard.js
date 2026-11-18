"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#0f766e", "#2563eb", "#94a3b8", "#d97706", "#7c3aed"];

const pretty = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Generic bar chart (Recharts) used on the admin dashboard and reports.
export default function BarChartCard({ data, xKey, series, stacked = false, height = 280, money = false }) {
  if (!data?.length) return <p className="py-10 text-center text-sm text-slate-500">No data for this period.</p>;

  const fmt = (v) => (money ? `₹${Number(v).toLocaleString("en-IN")}` : v);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={money ? 70 : 40}
            tickFormatter={fmt}
          />
          <Tooltip formatter={(v, name) => [fmt(v), pretty(name)]} cursor={{ fill: "#f1f5f9" }} />
          {series.length > 1 && <Legend formatter={pretty} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId={stacked ? "a" : undefined}
              fill={COLORS[i % COLORS.length]}
              radius={stacked && i < series.length - 1 ? 0 : [4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
