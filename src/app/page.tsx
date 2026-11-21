import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeStats, type Stats } from "@/lib/stats";
import type { PublicComplaint } from "@/lib/complaints";
import { Icon, type IconName } from "@/components/ui/icons";
import RetryButton from "@/components/ui/retry-button";

const steps: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "clipboard",
    title: "Report the problem",
    text: "Pick the type, describe what you see and say where it is. Add a photo if you have one.",
  },
  {
    icon: "send",
    title: "Get a tracking ID",
    text: "You get an ID like ECO-2026-0001 straight away. No account or sign-up needed.",
  },
  {
    icon: "search",
    title: "Follow the progress",
    text: "See every status change and each action the authorities record, until the case is closed.",
  },
];

// Landing page: hero with the two main actions, live counters, and "how it works".
export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_complaints");
  // If the lookup fails we show an error with a retry button, never fake "0" counters.
  const stats = !error && data ? computeStats(data as PublicComplaint[]) : null;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-20">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
            <Icon name="pin" className="h-4 w-4" />
            Environmental complaints in Mysuru
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] font-semibold text-brand-900 sm:text-5xl lg:text-6xl">
            See a problem in your environment? Report it. Follow what happens next.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Tell the authorities about air or water pollution, illegal dumping, noise or tree cutting, then track
            every step they take until the case is closed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/report" className="btn btn-primary btn-lg">
              <Icon name="clipboard" className="h-5 w-5" />
              Report a problem
            </Link>
            <Link href="/track" className="btn btn-secondary btn-lg">
              <Icon name="search" className="h-5 w-5" />
              Track a complaint
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Icon name="shield" className="h-4 w-4 text-brand-600" />
            No sign-up. Your name and contact are never shown publicly.
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <LiveNumbers stats={stats} />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-t border-line py-12 sm:py-16">
        <h2 id="how-heading" className="text-2xl font-semibold text-brand-900 sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="card">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8">
          <Link href="/dashboard" className="link inline-flex min-h-11 items-center gap-1.5">
            See all complaints on the public dashboard
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </p>
      </section>
    </div>
  );
}

// Live counters panel. Three states: numbers, "no complaints yet", or an error with retry.
function LiveNumbers({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div role="alert" className="card flex flex-col items-start gap-3 border-danger/20 bg-danger-tint">
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="alert" className="h-5 w-5 text-danger" />
          Live numbers are unavailable right now
        </span>
        <p className="text-sm text-ink">You can still report or track a complaint.</p>
        <RetryButton />
      </div>
    );
  }

  const resolvedShare = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <section aria-labelledby="live-heading" className="card p-6 sm:p-8">
      <h2 id="live-heading" className="flex items-center gap-2 font-sans text-sm font-semibold text-muted">
        <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
        Live numbers
      </h2>

      {stats.total === 0 ? (
        <p className="mt-4 text-lg text-ink">No complaints yet. Be the first to report a problem.</p>
      ) : (
        <>
          {/* 2 columns on phones and in the desktop side panel, 3 across on tablets */}
          <dl className="mt-4 grid grid-cols-2 items-end gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <dt className="text-base text-muted">Complaints reported</dt>
              <dd className="font-display text-5xl font-semibold text-brand-900 sm:text-6xl">{stats.total}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-sm text-muted">
                <Icon name="check" className="h-4 w-4 text-brand-600" />
                Resolved
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-ink">{stats.resolved}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-sm text-muted">
                <Icon name="clock" className="h-4 w-4 text-muted" />
                Still open
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-ink">{stats.pending}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Resolved so far</span>
              <span className="font-semibold text-ink">{resolvedShare}%</span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-50"
              role="img"
              aria-label={`${resolvedShare}% of complaints resolved`}
            >
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${resolvedShare}%` }} />
            </div>
          </div>
        </>
      )}

      <Link href="/dashboard" className="btn btn-ghost mt-5 -ml-3">
        <Icon name="chart" className="h-4 w-4" />
        Open the dashboard
      </Link>
    </section>
  );
}
