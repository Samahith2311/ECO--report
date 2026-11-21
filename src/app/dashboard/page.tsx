import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats";
import { STATUSES, STATUS_STYLE, type ComplaintStatus, type PublicComplaint } from "@/lib/complaints";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import RetryButton from "@/components/ui/retry-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icons";
import Charts from "./charts";
import ComplaintMap from "./map-loader";

export const metadata: Metadata = { title: "Public dashboard" };

const fmtAvg = (days: number | null) =>
  days === null ? "None yet" : days < 1 ? `${Math.round(days * 24)} hours` : `${days.toFixed(1)} days`;

const share = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_complaints");

  const header = (
    <PageHeader
      title="Public dashboard"
      description="Anonymised, live numbers on environmental complaints in Mysuru."
    >
      <Link href="/report" className="btn btn-primary">
        <Icon name="clipboard" className="h-4 w-4" />
        Report a problem
      </Link>
    </PageHeader>
  );

  // If the lookup fails, show an error with a retry button instead of misleading zeros.
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {header}
        <div className="mt-8">
          <ErrorState title="We couldn't load the dashboard" action={<RetryButton />} />
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as PublicComplaint[];
  const stats = computeStats(rows);
  const pins = rows.filter((r) => r.latitude !== null && r.longitude !== null);
  const topMax = stats.topLocations[0]?.count ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {header}

      {stats.total === 0 ? (
        <div className="card mt-8">
          <EmptyState
            icon="chart"
            title="No complaints yet"
            action={
              <Link href="/report" className="btn btn-primary">
                Report the first problem
              </Link>
            }
          >
            Numbers, charts and the map appear here as soon as people start reporting.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Headline numbers: 2 per row on phones, 4 on desktop */}
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard icon="clipboard" label="Total complaints" value={stats.total} note="All time" />
            <StatCard
              icon="check"
              label="Resolved"
              value={stats.resolved}
              note={`${share(stats.resolved, stats.total)}% of all`}
            />
            <StatCard
              icon="clock"
              label="Still open"
              value={stats.pending}
              note={`${share(stats.pending, stats.total)}% of all`}
            />
            <StatCard
              icon="calendar"
              label="Time to resolve"
              value={fmtAvg(stats.avgResolutionDays)}
              note="Average, report to fix"
            />
          </dl>

          <Charts stats={stats} />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map with a legend that also shows how many pins each status has */}
            <section aria-labelledby="map-heading" className="card lg:col-span-2">
              <h2 id="map-heading" className="text-lg font-semibold text-brand-900">
                Complaint map
              </h2>
              <p className="text-sm text-muted">
                {pins.length} of {stats.total} complaints have a location. Select a pin for details.
              </p>
              {pins.length === 0 ? (
                <p className="mt-4 rounded-control bg-paper p-4 text-base text-muted">No complaint has a map location yet.</p>
              ) : (
                <>
                  <ul aria-label="Legend" className="mt-4 flex flex-wrap gap-2">
                    {(Object.keys(STATUSES) as ComplaintStatus[]).map((s) => (
                      <li
                        key={s}
                        className="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1.5 text-sm"
                      >
                        <span
                          className="h-4 w-4 rounded-full ring-2 ring-surface"
                          style={{ backgroundColor: STATUS_STYLE[s].color }}
                          aria-hidden="true"
                        />
                        {STATUSES[s]}
                        <span className="font-semibold">{pins.filter((p) => p.status === s).length}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <ComplaintMap pins={pins} />
                  </div>
                </>
              )}
            </section>

            {/* Places with the most complaints */}
            <section aria-labelledby="places-heading" className="card self-start">
              <h2 id="places-heading" className="text-lg font-semibold text-brand-900">
                Most reported places
              </h2>
              <p className="text-sm text-muted">Top {stats.topLocations.length} locations</p>
              <ol className="mt-5 space-y-4">
                {stats.topLocations.map((l, i) => (
                  <li key={l.name} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-ink">{l.name}</span>
                        <span className="shrink-0 font-semibold">{l.count}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-brand-50" aria-hidden="true">
                        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(l.count / topMax) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
