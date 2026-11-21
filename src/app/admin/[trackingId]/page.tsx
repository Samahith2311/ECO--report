import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import StatusBadge from "@/components/ui/status-badge";
import Timeline from "@/components/ui/timeline";
import { Icon, type IconName } from "@/components/ui/icons";
import { TYPES, TYPE_ICON, fmtDate, type ComplaintStatus, type ComplaintType } from "@/lib/complaints";
import SignOut from "../sign-out";
import { InterventionForm, StatusForm } from "./forms";

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

// Makes the reporter's contact tappable: email -> mailto:, phone number -> tel:.
function contactHref(contact: string) {
  if (contact.includes("@")) return `mailto:${contact.trim()}`;
  const phone = contact.replace(/[^\d+]/g, "");
  return phone.replace(/\D/g, "").length >= 7 ? `tel:${phone}` : null;
}

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

  const actions = interventions ?? [];
  const href = contactHref(complaint.reporter_contact);
  const hasPin = complaint.latitude !== null && complaint.longitude !== null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin" className="btn btn-ghost -ml-3">
          <Icon name="arrowLeft" className="h-4 w-4" />
          All complaints
        </Link>
        <SignOut />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold tracking-wide text-brand-900">{complaint.tracking_id}</h1>
        <StatusBadge status={complaint.status} size="lg" />
      </div>
      <p className="mt-1 text-base text-muted">
        {TYPES[complaint.complaint_type]} · noticed {fmtDate(complaint.complaint_date)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Right column on desktop, first on phones: the main admin actions */}
        <div className="space-y-6 lg:order-last">
          <section aria-labelledby="status-heading" className="card">
            <h2 id="status-heading" className="text-lg font-semibold text-brand-900">
              Change status
            </h2>
            <div className="mt-4">
              <StatusForm complaintId={complaint.id} trackingId={complaint.tracking_id} current={complaint.status} />
            </div>
            <h3 className="mt-6 border-t border-line pt-5 font-sans text-sm font-semibold text-muted">History</h3>
            <div className="mt-4">
              <Timeline history={history ?? []} current={complaint.status} />
            </div>
          </section>

          <section aria-labelledby="reporter-heading" className="card">
            <h2 id="reporter-heading" className="flex items-center gap-2 text-lg font-semibold text-brand-900">
              Reporter
              <span className="flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 font-sans text-xs font-semibold text-muted">
                <Icon name="lock" className="h-3 w-3" />
                Private
              </span>
            </h2>
            <p className="mt-3 flex items-center gap-2 font-semibold text-ink">
              <Icon name="user" className="h-4 w-4 text-muted" />
              {complaint.reporter_name}
            </p>
            {href ? (
              <a href={href} className="link mt-1 inline-flex min-h-11 items-center break-all">
                {complaint.reporter_contact}
              </a>
            ) : (
              <p className="mt-2 break-all text-ink">{complaint.reporter_contact}</p>
            )}
            <p className="hint">Never shown on public pages.</p>
          </section>
        </div>

        {/* Left column: what was reported, then what has been done */}
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="details-heading" className="card">
            <h2 id="details-heading" className="text-lg font-semibold text-brand-900">
              Complaint details
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <Detail icon={TYPE_ICON[complaint.complaint_type]} label="Type" value={TYPES[complaint.complaint_type]} />
              <Detail icon="pin" label="Location" value={complaint.location_text}>
                {hasPin && (
                  <a
                    className="link mt-1 inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                  >
                    Open in map
                    <Icon name="external" className="h-3.5 w-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </Detail>
              <Detail icon="calendar" label="Noticed on" value={fmtDate(complaint.complaint_date)} />
            </dl>
            <p className="mt-5 border-t border-line pt-5 text-base leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
            {complaint.photo_url && (
              <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer" className="group mt-5 block w-fit rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={complaint.photo_url} alt="Photo sent with the complaint" className="max-h-72 rounded-lg border border-line" />
                <span className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-700 group-hover:underline">
                  Open full photo
                  <Icon name="external" className="h-4 w-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
              </a>
            )}
          </section>

          <section aria-labelledby="actions-heading" className="card">
            <h2 id="actions-heading" className="flex items-center gap-2 text-lg font-semibold text-brand-900">
              Actions taken
              <span className="rounded-full bg-brand-100 px-2 py-0.5 font-sans text-sm text-brand-800">{actions.length}</span>
            </h2>
            {actions.length === 0 ? (
              <p className="mt-4 rounded-control bg-paper p-4 text-base text-muted">
                Nothing recorded yet. Use the form below to record the first action.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {actions.map((iv) => (
                  <li key={iv.id} className="rounded-control border border-line p-4">
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

            <h3 className="mt-6 border-t border-line pt-5 text-base font-semibold text-brand-900">Record a new action</h3>
            <div className="mt-4">
              <InterventionForm complaintId={complaint.id} trackingId={complaint.tracking_id} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// One labelled fact with an icon; children are extra content under the value (e.g. a map link).
function Detail({
  icon,
  label,
  value,
  children,
}: {
  icon: IconName;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-muted">{label}</dt>
        <dd className="font-semibold text-ink">{value}</dd>
        {children && <dd>{children}</dd>}
      </div>
    </div>
  );
}
