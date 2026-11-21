"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icons";
import { TYPES, TYPE_ICON, fmtDate, type ComplaintStatus, type ComplaintType } from "@/lib/complaints";

export type AdminRow = {
  tracking_id: string;
  complaint_type: ComplaintType;
  location_text: string;
  complaint_date: string;
  status: ComplaintStatus;
  reporter_name: string;
};

// Client component only for the quick search box: it filters the rows already loaded
// (no extra database query). Phones get a card list, wider screens a table with a sticky header.
export default function ComplaintTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const shown = query
    ? rows.filter((r) =>
        [r.tracking_id, r.location_text, r.reporter_name, TYPES[r.complaint_type]].some((v) =>
          v.toLowerCase().includes(query),
        ),
      )
    : rows;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="q" className="label">
            Search this list
          </label>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, place or reporter"
              autoComplete="off"
              className="field pl-11"
            />
          </div>
        </div>
        {/* Live count so screen readers hear the result of a search */}
        <p className="text-sm text-muted" role="status">
          {shown.length} of {rows.length} complaint{rows.length === 1 ? "" : "s"}, newest first
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="card mt-4 text-center text-base text-muted">No complaints match &ldquo;{q}&rdquo;.</p>
      ) : (
        <>
          {/* Phones: one card per complaint */}
          <ul className="mt-4 space-y-3 md:hidden">
            {shown.map((r) => (
              <li key={r.tracking_id}>
                <Link
                  href={`/admin/${r.tracking_id}`}
                  className="card block p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-brand-800">{r.tracking_id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon name={TYPE_ICON[r.complaint_type]} className="h-4 w-4 text-brand-600" />
                    {TYPES[r.complaint_type]}
                  </p>
                  <p className="mt-1 text-sm text-ink">{r.location_text}</p>
                  <p className="mt-1 text-sm text-muted">
                    {fmtDate(r.complaint_date)} · {r.reporter_name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Wider screens: table. The wrapper scrolls, so the header row stays visible. */}
          <div className="card mt-4 hidden max-h-[calc(100vh-16rem)] min-h-64 overflow-auto p-0 md:block sm:p-0">
            <table className="table">
              <caption className="sr-only">Complaints, newest first. Select a tracking ID to open it.</caption>
              <thead>
                <tr>
                  <th scope="col">Tracking ID</th>
                  <th scope="col">Type</th>
                  <th scope="col">Location</th>
                  <th scope="col">Noticed</th>
                  <th scope="col">Reporter</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  // The ID link stretches over the whole row (after:inset-0), so any part of the row opens it.
                  <tr key={r.tracking_id} className="relative transition-colors hover:bg-brand-50/60">
                    <td className="whitespace-nowrap">
                      <Link
                        href={`/admin/${r.tracking_id}`}
                        className="font-mono font-bold text-brand-700 underline decoration-brand-300 underline-offset-2 after:absolute after:inset-0 hover:decoration-brand-700"
                      >
                        {r.tracking_id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Icon name={TYPE_ICON[r.complaint_type]} className="h-4 w-4 text-brand-600" />
                        {TYPES[r.complaint_type]}
                      </span>
                    </td>
                    <td className="max-w-64">
                      <span className="line-clamp-2">{r.location_text}</span>
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(r.complaint_date)}</td>
                    <td>{r.reporter_name}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
