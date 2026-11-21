"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icons";

// Root error boundary: shown when a page or an admin Server Action throws.
// It never shows the technical error, only a friendly message and a way out.
export default function Error({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <ErrorState
        as="h1"
        title="Something went wrong"
        action={
          <>
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              <Icon name="refresh" className="h-4 w-4" />
              Try again
            </button>
            <Link href="/" className="btn btn-secondary">
              Go to the home page
            </Link>
          </>
        }
      >
        Please try again. If it keeps happening, come back in a few minutes.
      </ErrorState>
    </div>
  );
}
