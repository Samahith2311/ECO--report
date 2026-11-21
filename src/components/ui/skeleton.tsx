// Grey placeholder block shown while content loads. The pulse stops when the user
// prefers reduced motion (see globals.css).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-brand-100/70 ${className}`} />;
}

// Wrapper for a whole loading screen: tells screen readers that content is on its way.
export function LoadingScreen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
