import Link from "next/link";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icons";

// Shown for any URL that does not exist (and when a page calls notFound()).
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <EmptyState
        as="h1"
        icon="search"
        title="We can't find that page"
        action={
          <>
            <Link href="/" className="btn btn-primary">
              Go to the home page
            </Link>
            <Link href="/track" className="btn btn-secondary">
              <Icon name="search" className="h-4 w-4" />
              Track a complaint
            </Link>
          </>
        }
      >
        The link may be old or mistyped. If you were following a complaint, use its tracking ID instead.
      </EmptyState>
    </div>
  );
}
