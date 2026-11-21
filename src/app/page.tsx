import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats";
import type { PublicComplaint } from "@/lib/complaints";

// Landing page with 3 live counters (hidden if the lookup fails).
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_complaints");
  const stats = data ? computeStats(data as PublicComplaint[]) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
          Environmental Studies project
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-brand-900 sm:text-5xl">
          See a problem in your environment? Report it. Follow what happens next.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          EcoReport lets citizens of Mysuru file complaints about air and water pollution, illegal
          dumping, noise and deforestation, and then track every step the authorities take until
          the case is closed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/report" className="btn btn-primary">
            Report a complaint
          </Link>
          <Link href="/track" className="btn btn-secondary">
            Track a complaint
          </Link>
        </div>
      </section>

      {stats && (
        <dl className="mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
          {[
            ["Complaints reported", stats.total],
            ["Resolved", stats.resolved],
            ["Still open", stats.pending],
          ].map(([label, value]) => (
            <div key={label} className="card">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 text-3xl font-semibold text-brand-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  );
}
