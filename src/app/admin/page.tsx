import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import StatusBadge from "@/components/status-badge";
import { TYPES, STATUSES, fmtDate, type ComplaintStatus, type ComplaintType } from "@/lib/complaints";
import SignOut from "./sign-out";

export const metadata: Metadata = { title: "Admin: complaints" };

type Row = {
  tracking_id: string;
  complaint_type: ComplaintType;
  location_text: string;
  complaint_date: string;
  status: ComplaintStatus;
  reporter_name: string;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

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
  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-brand-900">Complaints</h1>
        <SignOut />
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All statuses</option>
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="label">Type</label>
          <select id="type" name="type" defaultValue={type ?? ""} className="field">
            <option value="">All types</option>
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Filter</button>
        <Link href="/admin" className="btn btn-secondary">Clear</Link>
      </form>

      {error && <p className="field-error mt-4" role="alert">Could not load complaints: {error.message}</p>}
      <p className="mt-6 text-sm text-muted">{rows.length} complaint{rows.length === 1 ? "" : "s"}</p>

      <div className="card mt-2 overflow-x-auto !p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-brand-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tracking ID</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tracking_id} className="border-b border-line last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3 font-mono">
                  <Link href={`/admin/${r.tracking_id}`} className="font-semibold text-brand-700 underline">{r.tracking_id}</Link>
                </td>
                <td className="px-4 py-3">{TYPES[r.complaint_type]}</td>
                <td className="px-4 py-3">{r.location_text}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.complaint_date)}</td>
                <td className="px-4 py-3">{r.reporter_name}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No complaints match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
