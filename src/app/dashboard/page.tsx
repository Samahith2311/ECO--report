import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats";
import { STATUSES, STATUS_COLOR, type ComplaintStatus, type PublicComplaint } from "@/lib/complaints";
import Charts from "./charts";
import ComplaintMap from "./map-loader";

export const metadata: Metadata = { title: "Public dashboard" };

const fmtAvg = (days: number | null) =>
  days === null ? "No resolved cases yet" : days < 1 ? `${Math.round(days * 24)} hours` : `${days.toFixed(1)} days`;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_complaints");
  const rows = (data ?? []) as PublicComplaint[];
  const stats = computeStats(rows);
  const pins = rows.filter((r) => r.latitude !== null && r.longitude !== null);
  const topMax = stats.topLocations[0]?.count ?? 1;

  const tiles = [
    { label: "Total complaints", value: String(stats.total) },
    { label: "Resolved", value: String(stats.resolved) },
    { label: "Still open", value: String(stats.pending) },
    { label: "Average time to resolve", value: fmtAvg(stats.avgResolutionDays) },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-brand-900">Public dashboard</h1>
      <p className="mt-2 text-muted">Anonymised, live numbers on environmental complaints in Mysuru.</p>

      {error && <p className="field-error mt-4" role="alert">Could not load the latest data. Please try again.</p>}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <dt className="text-sm text-muted">{t.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-brand-800">{t.value}</dd>
          </div>
        ))}
      </dl>

      {stats.total === 0 ? (
        !error && <p className="card mt-6 text-muted">No complaints have been reported yet.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <Charts stats={stats} />

          <section className="card">
            <h2 className="text-lg font-semibold text-brand-800">Top locations</h2>
            <ol className="mt-3 space-y-3">
              {stats.topLocations.map((l) => (
                <li key={l.name}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span>{l.name}</span>
                    <span className="font-medium">{l.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-brand-50">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(l.count / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-brand-800">Complaint map</h2>
            {pins.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No complaint has a map location yet.</p>
            ) : (
              <>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {(Object.keys(STATUSES) as ComplaintStatus[]).map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} aria-hidden="true" />
                      {STATUSES[s]}
                    </li>
                  ))}
                </ul>
                <div className="mt-3"><ComplaintMap pins={pins} /></div>
                <p className="mt-2 text-sm text-muted">{pins.length} of {stats.total} complaints have a map location.</p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
