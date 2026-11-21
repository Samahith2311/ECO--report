"use client";

// Root error boundary: shown when a page or an admin Server Action throws.
export default function Error({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-brand-900">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, come back in a few minutes.</p>
      <button type="button" className="btn btn-primary mt-6" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
