"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "./icons";

// Asks the server to render the page again (re-runs the data lookup) without a full reload.
export default function RetryButton({ label = "Try again" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-secondary"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <Icon name={pending ? "spinner" : "refresh"} className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Trying again..." : label}
    </button>
  );
}
