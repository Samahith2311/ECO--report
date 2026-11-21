import { STATUSES, STATUS_STYLE, type ComplaintStatus } from "@/lib/complaints";
import { Icon } from "./icons";

// Status pill: colour + icon + text, so the status never depends on colour alone.
export default function StatusBadge({ status, size = "sm" }: { status: ComplaintStatus; size?: "sm" | "lg" }) {
  const s = STATUS_STYLE[status];
  const large = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${
        large ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
      style={{ color: s.text, backgroundColor: s.tint }}
    >
      <Icon name={s.icon} className={large ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2.5} />
      {STATUSES[status]}
    </span>
  );
}
