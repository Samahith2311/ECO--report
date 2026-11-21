import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

// One headline number. Use inside a <dl> so label and value are read together.
export default function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="card flex flex-col p-4 sm:p-5">
      <dt className="flex items-center gap-2 text-sm font-medium text-muted">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        {label}
      </dt>
      <dd className="mt-3 font-display text-3xl font-semibold text-brand-900 sm:text-4xl">{value}</dd>
      {note && <dd className="mt-1 text-sm text-muted">{note}</dd>}
    </div>
  );
}
