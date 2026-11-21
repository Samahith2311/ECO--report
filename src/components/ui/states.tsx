import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type MessageProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode; // buttons or links
  as?: "h1" | "h2" | "h3"; // heading level for the title
};

// "Nothing here yet" message, e.g. no search results or no data.
export function EmptyState({ icon = "inbox", title, children, action, as: Heading = "h2" }: MessageProps & { icon?: IconName }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <Heading className="mt-4 text-xl font-semibold text-ink">{title}</Heading>
      {children && <div className="mt-2 max-w-md text-base text-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

// "Something failed" message. Never shows raw database errors: callers pass a friendly text.
export function ErrorState({ title = "We couldn't load this", children, action, as: Heading = "h2" }: Partial<MessageProps>) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-danger/20 bg-danger-tint px-4 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-danger">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <Heading className="mt-4 text-xl font-semibold text-ink">{title}</Heading>
      <div className="mt-2 max-w-md text-base text-ink">
        {children ?? "Please check your internet connection and try again in a moment."}
      </div>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
