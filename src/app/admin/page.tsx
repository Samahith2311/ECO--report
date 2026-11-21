import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { TYPES, STATUSES, STATUS_STYLE, type ComplaintStatus } from "@/lib/complaints";
import PageHeader from "@/components/ui/page-header";
import RetryButton from "@/components/ui/retry-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import SignOut from "./sign-out";
import ComplaintTable, { type AdminRow } from "./complaint-table";

export const metadata: Metadata = { title: "Admin: complaints" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Builds /admin?status=...&type=... keeping only the filters that are set.
const filterHref = (status?: string, type?: string) => {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (type) p.set("type", type);
  const q = p.toString();
  return q ? `/admin?${q}` : "/admin";
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const supabase = await requireAdmin();
  const sp = await searchParams;
  const status = first(sp.status);
  const type = first(sp.type);

  // shortcut: newest 500 rows, no pagination; add paging if the table outgrows it.
  let query = supabase
    .from("complaints")
    .select("tracking_id, complaint_type, location_text, complaint_date, status, reporter_name")
    .order("created_at", { ascending: false })
    .limit(500);
  // Query-string values are untrusted: only filter on known enum values.
  if (status && Object.hasOwn(STATUSES, status)) query = query.eq("status", status);
  if (type && Object.hasOwn(TYPES, type)) query = query.eq("complaint_type", type);
  const { data, error } = await query;
  const rows = (data ?? []) as AdminRow[];

  const activeStatus = status && Object.hasOwn(STATUSES, status) ? status : undefined;
  const activeType = type && Object.hasOwn(TYPES, type) ? type : undefined;
  const filtered = Boolean(activeStatus || activeType);

  const chip = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <PageHeader title="Complaints" description="Open a complaint to change its status or record an action.">
        <SignOut />
      </PageHeader>

      {/* Filters: status chips apply at once; type uses a small form */}
      <div className="mt-8 space-y-4">
        <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2 sm:flex-wrap">
            <li>
              <Link
                href={filterHref(undefined, activeType)}
                aria-current={!activeStatus ? "page" : undefined}
                className={`${chip} ${!activeStatus ? "border-brand-600 bg-brand-600 text-white" : "border-field bg-surface text-ink hover:bg-brand-50"}`}
              >
                All statuses
              </Link>
            </li>
            {(Object.keys(STATUSES) as ComplaintStatus[]).map((s) => {
              const active = activeStatus === s;
              return (
                <li key={s}>
                  <Link
                    href={filterHref(s, activeType)}
                    aria-current={active ? "page" : undefined}
                    className={`${chip} whitespace-nowrap ${active ? "border-brand-600 bg-brand-600 text-white" : "border-field bg-surface text-ink hover:bg-brand-50"}`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: STATUS_STYLE[s].color }}
                      aria-hidden="true"
                    />
                    {STATUSES[s]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Form action="/admin" className="flex flex-wrap items-end gap-3">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <div className="w-full sm:w-64">
            <label htmlFor="type" className="label">
              Type of problem
            </label>
            <select id="type" name="type" defaultValue={activeType ?? ""} className="field">
              <option value="">All types</option>
              {Object.entries(TYPES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            Apply
          </button>
          {filtered && (
            <Link href="/admin" className="btn btn-ghost">
              Clear filters
            </Link>
          )}
        </Form>
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState title="We couldn't load the complaints" action={<RetryButton />}>
            Please try again. If it keeps happening, sign out and sign in again.
          </ErrorState>
        </div>
      ) : rows.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            title={filtered ? "No complaints match these filters" : "No complaints yet"}
            action={
              filtered ? (
                <Link href="/admin" className="btn btn-secondary">
                  Clear filters
                </Link>
              ) : undefined
            }
          >
            {filtered ? "Try another status or type." : "New reports from the public will appear here."}
          </EmptyState>
        </div>
      ) : (
        <ComplaintTable rows={rows} />
      )}
    </div>
  );
}
