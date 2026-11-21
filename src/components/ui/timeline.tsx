import { STATUSES, STATUS_STYLE, fmtDateTime, type ComplaintStatus } from "@/lib/complaints";
import { Icon } from "./icons";

type HistoryItem = { new_status: ComplaintStatus; changed_at: string };

// The normal path of a complaint. Rejected is an alternative ending.
const FLOW: ComplaintStatus[] = ["submitted", "under_review", "action_taken", "resolved"];

// Vertical timeline: every recorded status change (with its date), then the steps still to come
// in grey, so people can see how far along their complaint is.
export default function Timeline({ history, current }: { history: HistoryItem[]; current: ComplaintStatus }) {
  const closed = current === "resolved" || current === "rejected";
  const upcoming = closed ? [] : FLOW.slice(FLOW.indexOf(current) + 1);
  const total = history.length + upcoming.length;

  return (
    <ol className="relative">
      {history.map((h, i) => {
        const s = STATUS_STYLE[h.new_status];
        const isCurrent = i === history.length - 1;
        return (
          <Step key={`${h.new_status}-${h.changed_at}`} last={i === total - 1}>
            <span
              className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ring-4 ring-surface"
              style={{ backgroundColor: s.color }}
            >
              <Icon name={s.icon} className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="pb-6">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                {STATUSES[h.new_status]}
                {isCurrent && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                    Current
                  </span>
                )}
              </p>
              <time dateTime={h.changed_at} className="text-sm text-muted">
                {fmtDateTime(h.changed_at)}
              </time>
            </div>
          </Step>
        );
      })}

      {upcoming.map((status, i) => (
        <Step key={status} last={history.length + i === total - 1}>
          <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-dashed border-field bg-surface" />
          <div className="pb-6">
            <p className="font-semibold text-muted">
              <span className="sr-only">Not reached yet: </span>
              {STATUSES[status]}
            </p>
            <p className="text-sm text-muted">{i === 0 ? "Next step" : "Later"}</p>
          </div>
        </Step>
      ))}
    </ol>
  );
}

// One row: marker on the left, text on the right, and a line down to the next marker.
function Step({ last, children }: { last: boolean; children: React.ReactNode }) {
  return (
    <li className="relative flex gap-4">
      {!last && <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-0.5 bg-line" />}
      {children}
    </li>
  );
}
