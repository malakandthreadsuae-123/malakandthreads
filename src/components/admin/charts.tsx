"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Single-series charts (no legend needed — the card title names the series).
 * One hue (brand gold, AA-contrast step on white), 2px line, recessive grid,
 * crosshair tooltip on hover. Revenue and order count are separate charts (never dual-axis).
 */
const INK = "#7d5f27";
const GRID = "#e5e5e5";
const AXIS = "#6b6b6b";

const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AE", { day: "numeric", month: "short" });

function Tip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: "aed" | "count" }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded border border-line bg-white px-3 py-2 text-[12px] shadow-sm">
      <p className="text-muted">{label ? fmtDay(label) : ""}</p>
      <p className="font-medium text-charcoal tabular-nums">{unit === "aed" ? `AED ${v.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${v} order${v === 1 ? "" : "s"}`}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-72" role="img" aria-label="Revenue by day">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INK} stopOpacity={0.22} />
              <stop offset="100%" stopColor={INK} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))} />
          <Tooltip content={<Tip unit="aed" />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="revenue" stroke={INK} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-48" role="img" aria-label="Orders by day">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={32} />
          <Tooltip content={<Tip unit="count" />} cursor={{ fill: "rgba(23,23,23,0.04)" }} />
          <Bar dataKey="orders" fill="#2a2a2a" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
