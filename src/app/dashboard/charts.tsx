"use client";

import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STATUSES, STATUS_COLOR, TYPES, type ComplaintStatus } from "@/lib/complaints";
import type { Stats } from "@/lib/stats";

const BRAND = "#357d4f";

type Point = { name: string; count: number; color?: string };

// role="img" + aria-label gives screen-reader users the numbers the picture shows.
function ChartCard({ title, data, children }: { title: string; data: Point[]; children: ReactElement }) {
  const summary = data.map((d) => `${d.name} ${d.count}`).join(", ");
  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-brand-800">{title}</h2>
      <div role="img" aria-label={`${title}: ${summary}`} className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </section>
  );
}

// Horizontal bars (long category names read better on the left).
function HBars({ data }: { data: Point[] }) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
      <CartesianGrid horizontal={false} stroke="#d9e2d5" />
      <XAxis type="number" allowDecimals={false} />
      <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 13 }} />
      <Tooltip cursor={{ fill: "#eef6ef" }} />
      <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]}>
        {data.map((d) => <Cell key={d.name} fill={d.color ?? BRAND} />)}
      </Bar>
    </BarChart>
  );
}

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

export default function Charts({ stats }: { stats: Stats }) {
  const byType: Point[] = Object.entries(TYPES).map(([k, name]) => ({ name, count: stats.byType[k] ?? 0 }));
  const byStatus: Point[] = Object.entries(STATUSES).map(([k, name]) => ({
    name,
    count: stats.byStatus[k] ?? 0,
    color: STATUS_COLOR[k as ComplaintStatus],
  }));
  const monthly: Point[] = stats.monthly.map((m) => ({ name: monthLabel(m.month), count: m.count }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Complaints by type" data={byType}><HBars data={byType} /></ChartCard>
      <ChartCard title="Complaints by status" data={byStatus}><HBars data={byStatus} /></ChartCard>
      <div className="lg:col-span-2">
        <ChartCard title="Complaints per month" data={monthly}>
          <BarChart data={monthly} margin={{ right: 16 }}>
            <CartesianGrid vertical={false} stroke="#d9e2d5" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} width={32} />
            <Tooltip cursor={{ fill: "#eef6ef" }} />
            <Bar dataKey="count" name="Complaints" fill={BRAND} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}
