import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import StatusBadge from "@/components/ui/status-badge";
import { TYPES, STATUSES, fmtDate, fmtDateTime, type ComplaintStatus, type ComplaintType } from "@/lib/complaints";
import { addIntervention, updateStatus } from "../actions";
import SignOut from "../sign-out";

export const metadata: Metadata = { title: "Admin: complaint" };

type Complaint = {
  id: string;
  tracking_id: string;
  complaint_type: ComplaintType;
  description: string;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  complaint_date: string;
  status: ComplaintStatus;
  reporter_name: string;
  reporter_contact: string;
  photo_url: string | null;
};
type Intervention = { id: string; action_taken: string; department: string; intervention_date: string; remarks: string | null };
type History = { id: string; old_status: ComplaintStatus | null; new_status: ComplaintStatus; changed_at: string };

export default async function AdminComplaintPage({ params }: PageProps<"/admin/[trackingId]">) {
  const { trackingId } = await params;
  const supabase = await requireAdmin();

  const { data: complaint } = await supabase
    .from("complaints")
    .select("*")
    .eq("tracking_id", trackingId)
    .maybeSingle<Complaint>();
  if (!complaint) notFound();

  const [{ data: interventions }, { data: history }] = await Promise.all([
    supabase.from("interventions").select("*").eq("complaint_id", complaint.id)
      .order("intervention_date").order("created_at").returns<Intervention[]>(),
    supabase.from("status_history").select("*").eq("complaint_id", complaint.id)
      .order("changed_at").returns<History[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-brand-700 underline">&larr; All complaints</Link>
        <SignOut />
      </div>

      <section className="card mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-mono text-2xl font-semibold text-brand-800">{complaint.tracking_id}</h1>
          <StatusBadge status={complaint.status} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Type</dt><dd className="font-medium">{TYPES[complaint.complaint_type]}</dd></div>
          <div><dt className="text-muted">Date</dt><dd className="font-medium">{fmtDate(complaint.complaint_date)}</dd></div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="font-medium">
              {complaint.location_text}
              {complaint.latitude !== null && complaint.longitude !== null && (
                <>
                  {" "}
                  <a
                    className="text-brand-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                  >
                    (map)
                  </a>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Reporter (private)</dt>
            <dd className="font-medium">{complaint.reporter_name} · {complaint.reporter_contact}</dd>
          </div>
        </dl>
        <p className="mt-4 whitespace-pre-line text-sm">{complaint.description}</p>
        {complaint.photo_url && (
          <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer" className="mt-4 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={complaint.photo_url} alt="Photo submitted with the complaint" className="max-h-64 rounded-lg border border-line" />
          </a>
        )}
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-semibold text-brand-800">Change status</h2>
        <form action={updateStatus.bind(null, complaint.tracking_id)} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="status" className="label">New status</label>
            <select id="status" name="status" defaultValue={complaint.status} className="field">
              {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Update status</button>
        </form>
        <ol className="mt-5 space-y-1 text-sm text-muted">
          {(history ?? []).map((h) => (
            <li key={h.id}>
              {fmtDateTime(h.changed_at)}: {h.old_status ? `${STATUSES[h.old_status]} → ` : ""}{STATUSES[h.new_status]}
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-semibold text-brand-800">Interventions</h2>
        {(interventions ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted">None recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(interventions ?? []).map((iv) => (
              <li key={iv.id} className="rounded-lg border border-line p-4 text-sm">
                <p className="font-medium">{iv.action_taken}</p>
                <p className="mt-1 text-muted">{iv.department} · {fmtDate(iv.intervention_date)}</p>
                {iv.remarks && <p className="mt-2">{iv.remarks}</p>}
              </li>
            ))}
          </ul>
        )}

        <form action={addIntervention.bind(null, complaint.id, complaint.tracking_id)} className="mt-6 space-y-4 border-t border-line pt-5">
          <h3 className="text-lg font-semibold text-brand-800">Add an intervention</h3>
          <div>
            <label htmlFor="action" className="label">Action taken</label>
            <textarea id="action" name="action" required minLength={3} maxLength={1000} rows={3} className="field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="department" className="label">Department</label>
              <input id="department" name="department" required minLength={2} maxLength={200} className="field" />
            </div>
            <div>
              <label htmlFor="date" className="label">Date (optional, defaults to today)</label>
              <input id="date" name="date" type="date" className="field" />
            </div>
          </div>
          <div>
            <label htmlFor="remarks" className="label">Remarks (optional)</label>
            <textarea id="remarks" name="remarks" rows={2} className="field" />
          </div>
          <button type="submit" className="btn btn-primary">Add intervention</button>
        </form>
      </section>
    </div>
  );
}
