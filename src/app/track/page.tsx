import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import Timeline from "@/components/ui/timeline";
import RetryButton from "@/components/ui/retry-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Icon, type IconName } from "@/components/ui/icons";
import {
  TYPES,
  TYPE_ICON,
  STATUS_STYLE,
  fmtDate,
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

// One plain sentence per status, so people know what it means for them.
const STATUS_MEANING: Record<ComplaintStatus, string> = {
  submitted: "We have received your complaint. It is waiting to be reviewed.",
  under_review: "The authorities are looking into your complaint.",
  action_taken: "The authorities have taken action. See what they did below.",
  resolved: "The problem has been resolved. Thank you for reporting it.",
  rejected: "The authorities closed this complaint without action.",
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const { id } = await searchParams;
  // IDs are stored in capitals, so "eco-2026-0001" also works.
  const trackingId = (Array.isArray(id) ? id[0] : id)?.trim().toUpperCase();

  let result: Tracked | null = null;
  let failed = false;
  if (trackingId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_complaint_by_tracking_id", { p_tracking_id: trackingId });
    if (error) failed = true;
    else result = data as Tracked | null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <PageHeader title="Track a complaint" description="Enter the tracking ID you got when you reported the problem." />

      {/* next/form: submits to /track?id=... with client-side navigation and the loading skeleton */}
      <Form action="/track" className="mt-6" role="search">
        <label htmlFor="id" className="label">
          Tracking ID
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="id"
              name="id"
              defaultValue={trackingId}
              placeholder="ECO-2026-0001"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="id-hint"
              className="field min-h-12 pl-11 font-mono text-lg tracking-wide uppercase placeholder:normal-case"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            Track
          </button>
        </div>
        <p id="id-hint" className="hint">
          It was shown on screen after you sent your report.
        </p>
      </Form>

      <div className="mt-8">
        {!trackingId && (
          <div className="rounded-card border border-dashed border-field px-4 py-8 text-center">
            <p className="text-base text-muted">Don&apos;t have a tracking ID yet?</p>
            <Link href="/report" className="btn btn-ghost mt-2">
              Report a new problem
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        )}

        {failed && (
          <ErrorState title="We couldn't look up that ID" action={<RetryButton />}>
            This is a problem on our side, not with your ID. Please try again in a moment.
          </ErrorState>
        )}

        {trackingId && !failed && !result && (
          <div className="card">
            <EmptyState
              icon="search"
              title="No complaint found"
              action={
                <Link href="/report" className="btn btn-secondary">
                  Report a new problem
                </Link>
              }
            >
              We couldn&apos;t find <span className="font-mono font-semibold text-ink">{trackingId}</span>. Check it for
              typing mistakes. IDs look like <span className="font-mono">ECO-2026-0001</span>.
            </EmptyState>
          </div>
        )}

        {result && <Result data={result} />}
      </div>
    </div>
  );
}

function Result({ data }: { data: Tracked }) {
  const c = data.complaint;
  const s = STATUS_STYLE[c.status];

  return (
    <div className="animate-fade-up space-y-6">
      {/* Summary */}
      <section aria-labelledby="complaint-heading" className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Tracking ID</p>
            <h2 id="complaint-heading" className="font-mono text-2xl font-bold tracking-wide text-brand-900">
              {c.tracking_id}
            </h2>
          </div>
          <StatusBadge status={c.status} size="lg" />
        </div>

        <p className="mt-4 rounded-control px-4 py-3 text-base font-medium" style={{ backgroundColor: s.tint, color: s.text }}>
          {STATUS_MEANING[c.status]}
        </p>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <Detail icon={TYPE_ICON[c.complaint_type]} label="Type" value={TYPES[c.complaint_type]} />
          <Detail icon="pin" label="Location" value={c.location_text} />
          <Detail icon="calendar" label="Noticed on" value={fmtDate(c.complaint_date)} />
        </dl>

        <p className="mt-5 border-t border-line pt-5 text-base leading-relaxed whitespace-pre-line">{c.description}</p>

        {c.photo_url && (
          <a href={c.photo_url} target="_blank" rel="noopener noreferrer" className="group mt-5 block w-fit rounded-lg">
            {/* plain <img>: the photo can live on any host, so next/image would need a host allow-list */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.photo_url} alt="Photo sent with the complaint" className="max-h-72 rounded-lg border border-line" />
            <span className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-700 group-hover:underline">
              Open full photo
              <Icon name="external" className="h-4 w-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </span>
          </a>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        {/* Timeline */}
        <section aria-labelledby="progress-heading" className="card">
          <h2 id="progress-heading" className="text-xl font-semibold text-brand-900">
            Progress
          </h2>
          <div className="mt-5">
            <Timeline history={data.history} current={c.status} />
          </div>
        </section>

        {/* Interventions */}
        <section aria-labelledby="actions-heading" className="card">
          <h2 id="actions-heading" className="flex items-center gap-2 text-xl font-semibold text-brand-900">
            Actions by the authorities
            {data.interventions.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 font-sans text-sm text-brand-800">
                {data.interventions.length}
              </span>
            )}
          </h2>
          {data.interventions.length === 0 ? (
            <p className="mt-4 rounded-control bg-paper p-4 text-base text-muted">
              No actions recorded yet. They will appear here as the authorities work on it.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {data.interventions.map((iv, i) => (
                <li key={i} className="rounded-control border border-line p-4">
                  <p className="font-semibold text-ink">{iv.action_taken}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Icon name="building" className="h-4 w-4" />
                      {iv.department}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="calendar" className="h-4 w-4" />
                      {fmtDate(iv.intervention_date)}
                    </span>
                  </p>
                  {iv.remarks && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm">{iv.remarks}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// One labelled fact with an icon (type, location, date).
function Detail({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-muted">{label}</dt>
        <dd className="font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}
