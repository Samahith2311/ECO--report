import type { ReactNode } from "react";

// Same title + intro block on every page, with an optional slot on the right (e.g. a button).
export default function PageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-brand-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-base text-muted sm:text-lg">{description}</p>}
      </div>
      {children}
    </div>
  );
}
