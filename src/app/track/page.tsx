import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/status-badge";
import {
  TYPES,
  STATUSES,
  STATUS_COLOR,
  fmtDate,
  fmtDateTime,
  type ComplaintStatus,
  type ComplaintType,
} from "@/lib/complaints";

export const metadata: Metadata = { title: "Track a complaint" };

// Shape returned by get_complaint_by_tracking_id (reporter details are never included).
type Tracked = {
  complaint: {
    tracking_id: string;
    complaint_type: ComplaintType;
    description: string;
    location_text: string;
    complaint_date: string;
    status: ComplaintStatus;
    photo_url: string | null;
  };
  interventions: { action_taken: string; department: string; intervention_date: string; remarks: string | null }[];
  history: { old_status: ComplaintStatus | null; new_status: ComplaintStatus; changed_at: string }[];
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const { id } = await searchParams;
  const trackingId = (Array.isArray(id) ? id[0] : id)?.trim();

  let result: Tracked | null = null;
  let errorMessage: string | null = null;
  if (trackingId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_complaint_by_tracking_id", { p_tracking_id: trackingId });
    if (error) errorMessage = "Could not look up that ID right now. Please try again.";
    else result = data as Tracked | null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-brand-900">Track a complaint</h1>
      <p className="mt-2 text-muted">Enter the tracking ID you received when you reported the problem.</p>

      <form action="/track" className="mt-6 flex gap-2">
        <label htmlFor="id" className="sr-only">Tracking ID</label>
        <input
          id="id"
          name="id"
          defaultValue={trackingId}
          placeholder="ECO-2026-0001"
          required
          className="field font-mono"
        />
        <button type="submit" className="btn btn-primary">Track</button>
      </form>

      {errorMessage && <p className="field-error mt-4" role="alert">{errorMessage}</p>}
      {trackingId && !errorMessage && !result && (
        <p className="mt-6 text-red-700" role="alert">
          No complaint found with ID <span className="font-mono">{trackingId}</span>. Check the ID and try again.
        </p>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-xl font-semibold text-brand-800">{result.complaint.tracking_id}</h2>
              <StatusBadge status={result.complaint.status} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Type</dt><dd className="font-medium">{TYPES[result.complaint.complaint_type]}</dd></div>
              <div><dt className="text-muted">Location</dt><dd className="font-medium">{result.complaint.location_text}</dd></div>
              <div><dt className="text-muted">Date</dt><dd className="font-medium">{fmtDate(result.complaint.complaint_date)}</dd></div>
            </dl>
            <p className="mt-4 whitespace-pre-line text-sm">{result.complaint.description}</p>
            {result.complaint.photo_url && (
              <a href={result.complaint.photo_url} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                {/* plain <img>: the photo can live on any host, so next/image would need a host allow-list */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.complaint.photo_url} alt="Photo submitted with the complaint" className="max-h-64 rounded-lg border border-line" />
              </a>
            )}
          </section>

          <section className="card">
            <h2 className="text-xl font-semibold text-brand-800">Status timeline</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-line pl-5">
              {result.history.map((h, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white"
                    style={{ backgroundColor: STATUS_COLOR[h.new_status] }}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold">{STATUSES[h.new_status]}</p>
                  <p className="text-sm text-muted">{fmtDateTime(h.changed_at)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <h2 className="text-xl font-semibold text-brand-800">Actions taken by the authorities</h2>
            {result.interventions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No actions have been recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {result.interventions.map((iv, i) => (
                  <li key={i} className="rounded-lg border border-line p-4 text-sm">
                    <p className="font-medium">{iv.action_taken}</p>
                    <p className="mt-1 text-muted">{iv.department} · {fmtDate(iv.intervention_date)}</p>
                    {iv.remarks && <p className="mt-2">{iv.remarks}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
