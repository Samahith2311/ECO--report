"use client";

import { useCallback, useState, useTransition } from "react";
import { STATUSES, type ComplaintStatus } from "@/lib/complaints";
import { Icon } from "@/components/ui/icons";
import Toast from "@/components/ui/toast";
import { addIntervention, updateStatus } from "../actions";

type ToastState = { message: string; tone: "success" | "error" } | null;

// These forms call the same Server Actions as before. The try/catch turns a failure into a
// friendly toast (instead of the error page), so whatever the admin typed is kept.

export function StatusForm({ trackingId, current }: { trackingId: string; current: ComplaintStatus }) {
  const [value, setValue] = useState<ComplaintStatus>(current);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateStatus(trackingId, formData);
        setToast({ message: `Status changed to ${STATUSES[value]}`, tone: "success" });
      } catch {
        setToast({ message: "Couldn't change the status. Please try again.", tone: "error" });
      }
    });
  }

  const unchanged = value === current;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="status" className="label">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={value}
          onChange={(e) => setValue(e.target.value as ComplaintStatus)}
          aria-describedby="status-hint"
          className="field"
        >
          {Object.entries(STATUSES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <p id="status-hint" className="hint">
          {unchanged ? "This is the current status." : "The reporter sees the new status on the track page."}
        </p>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending || unchanged}>
        {pending && <Icon name="spinner" className="h-4 w-4 animate-spin" />}
        {pending ? "Saving..." : "Save status"}
      </button>
      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={clearToast} />
    </form>
  );
}

const DEPARTMENTS = [
  "Mysuru City Corporation",
  "Karnataka State Pollution Control Board",
  "Forest Department",
  "Mysuru City Police",
];

export function InterventionForm({ complaintId, trackingId }: { complaintId: string; trackingId: string }) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await addIntervention(complaintId, trackingId, formData);
        form.reset(); // clear the form only when saving worked
        setToast({ message: "Action recorded", tone: "success" });
      } catch {
        setToast({ message: "Couldn't save the action. Your text is still here, please try again.", tone: "error" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="action" className="label">
          What was done?
        </label>
        <textarea
          id="action"
          name="action"
          required
          minLength={3}
          maxLength={1000}
          rows={3}
          placeholder="e.g. Site inspected and the waste removed"
          className="field"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="department" className="label">
            Department
          </label>
          <input
            id="department"
            name="department"
            required
            minLength={2}
            maxLength={200}
            list="department-options"
            autoComplete="off"
            className="field"
          />
          {/* suggestions only: any department name can be typed */}
          <datalist id="department-options">
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="date" className="label">
            Date <span className="text-sm font-normal text-muted">(optional)</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            max={new Date().toLocaleDateString("en-CA")}
            suppressHydrationWarning // "today" can differ between server and browser time zones
            aria-describedby="date-hint"
            className="field"
          />
          <p id="date-hint" className="hint">
            Leave empty for today.
          </p>
        </div>
      </div>
      <div>
        <label htmlFor="remarks" className="label">
          Remarks <span className="text-sm font-normal text-muted">(optional)</span>
        </label>
        <textarea id="remarks" name="remarks" rows={2} className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? <Icon name="spinner" className="h-4 w-4 animate-spin" /> : <Icon name="check" className="h-4 w-4" />}
        {pending ? "Saving..." : "Record action"}
      </button>
      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={clearToast} />
    </form>
  );
}
