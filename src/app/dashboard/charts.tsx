"use client";

import type { ReactElement } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STATUSES, STATUS_STYLE, TYPES, type ComplaintStatus } from "@/lib/complaints";
import type { Stats } from "@/lib/stats";

// Chart colours come from the design tokens (see globals.css / complaints.ts).
const BRAND = "#357d4f"; // brand-500
const INK = "#1b2a21";
const MUTED = "#566a5d";
const LINE = "#dfe7da";
const HOVER = "#eef6ef"; // brand-50

type Point = { name: string; count: number; color?: string };

// Card with a title; role="img" + aria-label gives screen-reader users the numbers the chart shows.
function ChartCard({
  title,
  subtitle,
  data,
  height,
  children,
}: {
  title: string;
  subtitle: string;
  data: Point[];
  height: number;
  children: ReactElement;
}) {
  const summary = data.map((d) => `${d.name} ${d.count}`).join(", ");
  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      <p className="text-sm text-muted">{subtitle}</p>
      <div role="img" aria-label={`${title}: ${summary}`} className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// Small card shown when you hover or tap a bar.
function ChartTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: Point }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-sm shadow-raised">
      <p className="font-semibold text-ink">{point.name}</p>
      <p className="text-muted">
        {point.count} complaint{point.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// Horizontal bars: long category names read better on the left, values are printed at the bar end.
function HBars({ data }: { data: Point[] }) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 36, top: 0, bottom: 0 }} barCategoryGap={8}>
      <XAxis type="number" hide allowDecimals={false} />
      <YAxis
        type="category"
        dataKey="name"
        width={124}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 14, fill: INK }}
      />
      <Tooltip cursor={{ fill: HOVER }} content={(p) => <ChartTooltip active={p.active} payload={p.payload} />} />
      <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]} maxBarSize={28}>
        {data.map((d) => (
          <Cell key={d.name} fill={d.color ?? BRAND} />
        ))}
        <LabelList dataKey="count" position="right" fill={INK} fontSize={14} fontWeight={600} />
      </Bar>
    </BarChart>
  );
}

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

export default function Charts({ stats }: { stats: Stats }) {
  // Status keeps the workflow order; types are sorted from most to least reported.
  const byStatus: Point[] = Object.entries(STATUSES).map(([k, name]) => ({
    name,
    count: stats.byStatus[k] ?? 0,
    color: STATUS_STYLE[k as ComplaintStatus].color,
  }));
  const byType: Point[] = Object.entries(TYPES)
    .map(([k, name]) => ({ name, count: stats.byType[k] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const monthly: Point[] = stats.monthly.map((m) => ({ name: monthLabel(m.month), count: m.count }));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="By status" subtitle="Where every complaint is now" data={byStatus} height={byStatus.length * 44}>
          <HBars data={byStatus} />
        </ChartCard>
        <ChartCard title="By type" subtitle="What people report most" data={byType} height={byType.length * 44}>
          <HBars data={byType} />
        </ChartCard>
      </div>

      <ChartCard title="Complaints per month" subtitle="By the date the problem was noticed" data={monthly} height={240}>
        <BarChart data={monthly} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: LINE }}
            tick={{ fontSize: 13, fill: MUTED }}
            interval="preserveStartEnd"
          />
          <YAxis hide allowDecimals={false} />
          <Tooltip cursor={{ fill: HOVER }} content={(p) => <ChartTooltip active={p.active} payload={p.payload} />} />
          <Bar dataKey="count" name="Complaints" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="count" position="top" fill={INK} fontSize={13} fontWeight={600} />
          </Bar>
        </BarChart>
      </ChartCard>
    </>
  );
}
