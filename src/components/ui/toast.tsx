"use client";

import { useEffect } from "react";
import { Icon } from "./icons";

// Small message at the bottom of the screen that hides itself after a few seconds.
// The live region is always on the page, so screen readers announce each new message.
// Pass a stable onClose (e.g. from useCallback) so the timer is not restarted on every render.
export default function Toast({
  message,
  tone = "success",
  onClose,
}: {
  message: string | null;
  tone?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[1200] flex justify-center px-4 sm:bottom-6"
    >
      {message && (
        <div
          className={`pointer-events-auto flex animate-fade-up items-center gap-2 rounded-control px-4 py-3 text-sm font-semibold text-white shadow-raised ${
            tone === "error" ? "bg-danger" : "bg-brand-900"
          }`}
        >
          <Icon name={tone === "error" ? "alert" : "check"} className="h-4 w-4" />
          {message}
        </div>
      )}
    </div>
  );
}
