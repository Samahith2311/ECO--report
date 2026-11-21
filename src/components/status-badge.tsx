import { STATUSES, STATUS_COLOR, type ComplaintStatus } from "@/lib/complaints";

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {STATUSES[status]}
    </span>
  );
}
