// Aggregations for the public dashboard and the landing-page counters. Pure functions
// (type-only imports) so scripts/check-stats.mjs can run them straight under Node.
import type { PublicComplaint } from "./complaints";

export type Stats = {
  total: number;
  resolved: number;
  pending: number; // not resolved and not rejected
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  monthly: { month: string; count: number }[]; // "2026-11", months with no complaints filled with 0
  avgResolutionDays: number | null;
  topLocations: { name: string; count: number }[];
};

const countBy = (rows: PublicComplaint[], key: (r: PublicComplaint) => string) => {
  const out: Record<string, number> = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return out;
};

export function computeStats(rows: PublicComplaint[]): Stats {
  const byStatus = countBy(rows, (r) => r.status);

  // Monthly trend by complaint date, with no gaps between the first and last month.
  const byMonth = countBy(rows, (r) => r.complaint_date.slice(0, 7));
  const keys = Object.keys(byMonth).sort();
  const monthly: Stats["monthly"] = [];
  if (keys.length) {
    let [y, m] = keys[0].split("-").map(Number);
    const [lastY, lastM] = keys[keys.length - 1].split("-").map(Number);
    while (y < lastY || (y === lastY && m <= lastM)) {
      const month = `${y}-${String(m).padStart(2, "0")}`;
      monthly.push({ month, count: byMonth[month] ?? 0 });
      if (++m > 12) [y, m] = [y + 1, 1];
    }
  }

  const days = rows
    .filter((r) => r.resolved_at)
    .map((r) => (Date.parse(r.resolved_at!) - Date.parse(r.created_at)) / 864e5);

  // Group locations ignoring case/extra spaces; show the first spelling seen.
  const locs = new Map<string, { name: string; count: number }>();
  for (const r of rows) {
    const k = r.location_text.trim().toLowerCase();
    const entry = locs.get(k) ?? { name: r.location_text.trim(), count: 0 };
    entry.count++;
    locs.set(k, entry);
  }

  return {
    total: rows.length,
    resolved: byStatus.resolved ?? 0,
    pending: rows.length - (byStatus.resolved ?? 0) - (byStatus.rejected ?? 0),
    byType: countBy(rows, (r) => r.complaint_type),
    byStatus,
    monthly,
    avgResolutionDays: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
    topLocations: [...locs.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5),
  };
}
