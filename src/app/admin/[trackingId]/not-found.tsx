import Link from "next/link";
import { EmptyState } from "@/components/ui/states";
import { Icon } from "@/components/ui/icons";

// Shown when an admin opens /admin/<id> for an ID that does not exist.
export default function ComplaintNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <EmptyState
        as="h1"
        icon="search"
        title="No complaint with that ID"
        action={
          <Link href="/admin" className="btn btn-primary">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to all complaints
          </Link>
        }
      >
        Check the tracking ID in the address bar, or pick the complaint from the list.
      </EmptyState>
    </div>
  );
}
