"use client";

import { useCallback, useState, useTransition } from "react";
import { STATUSES, type ComplaintStatus } from "@/lib/complaints";
import { Icon } from "@/components/ui/icons";
import Toast from "@/components/ui/toast";
import { addIntervention, rejectComplaint, updateStatus } from "../actions";

type ToastState = { message: string; tone: "success" | "error" } | null;

// These forms call Server Actions that return { ok, error }. Errors are shown in a friendly
// message under the form (never the raw database error), and whatever the admin typed is kept.

const DEPARTMENTS = [
  "Mysuru City Corporation",
  "Karnataka State Pollution Control Board",
  "Forest Department",
  "Mysuru City Police",
];

// Suggestions for a department field (any name can still be typed).
function DepartmentOptions({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {DEPARTMENTS.map((d) => (
        <option key={d} value={d} />
      ))}
    </datalist>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-control bg-danger-tint p-3 text-sm font-medium text-danger">
      <Icon name="alert" className="mt-0.5 h-4 w-4" />
      {message}
    </p>
  );
}

export function StatusForm({
  complaintId,
  trackingId,
  current,
}: {
  complaintId: string;
  trackingId: string;
  current: ComplaintStatus;
}) {
  const [value, setValue] = useState<ComplaintStatus>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const unchanged = value === current;
  // Choosing "Rejected" asks for a reason, which is saved as an action the reporter can read.
  const rejecting = value === "rejected" && !unchanged;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const wasRejecting = rejecting;
    const newLabel = STATUSES[value];
    setError(null);
    startTransition(async () => {
      try {
        const result = wasRejecting
          ? await rejectComplaint(complaintId, trackingId, formData)
          : await updateStatus(trackingId, formData);
        if (result.ok) {
          setToast({
            message: wasRejecting ? "Complaint rejected. The reason is shown to the reporter." : `Status changed to ${newLabel}`,
            tone: "success",
          });
        } else {
          setError(result.error);
        }
      } catch {
        setError("Couldn't change the status. Please try again.");
      }
    });
  }

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
          onChange={(e) => {
            setValue(e.target.value as ComplaintStatus);
            setError(null);
          }}
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
          {unchanged
            ? "This is the current status."
            : rejecting
              ? "Rejecting needs a reason. Fill it in below."
              : "The reporter sees the new status on the track page."}
        </p>
      </div>

      {rejecting && (
        <fieldset className="space-y-3 rounded-control border border-danger/25 bg-danger-tint/50 p-3">
          <legend className="sr-only">Reason for rejecting</legend>
          <div>
            <label htmlFor="reason" className="label">
              Reason for rejecting
            </label>
            <textarea
              id="reason"
              name="reason"
              required
              minLength={3}
              maxLength={900}
              rows={3}
              placeholder="e.g. Outside city limits. Forwarded to the local Gram Panchayat."
              aria-describedby="reason-hint"
              className="field"
            />
            <p id="reason-hint" className="hint">
              The reporter sees this reason on the track page.
            </p>
          </div>
          <div>
            <label htmlFor="reject-department" className="label">
              Department
            </label>
            <input
              id="reject-department"
              name="department"
              required
              minLength={2}
              maxLength={200}
              list="reject-department-options"
              autoComplete="off"
              className="field"
            />
            <DepartmentOptions id="reject-department-options" />
          </div>
        </fieldset>
      )}

      <FormError message={error} />
      <button type="submit" className="btn btn-primary w-full" disabled={pending || unchanged}>
        {pending && <Icon name="spinner" className="h-4 w-4 animate-spin" />}
        {pending ? "Saving..." : rejecting ? "Reject with this reason" : "Save status"}
      </button>
      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={clearToast} />
    </form>
  );
}

export function InterventionForm({ complaintId, trackingId }: { complaintId: string; trackingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      try {
        const result = await addIntervention(complaintId, trackingId, formData);
        if (result.ok) {
          form.reset(); // clear the form only when saving worked
          setToast({ message: "Action recorded", tone: "success" });
        } else {
          setError(result.error); // e.g. a future date; the typed text stays in the form
        }
      } catch {
        setError("Couldn't save the action. Your text is still here, please try again.");
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
          <DepartmentOptions id="department-options" />
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
      <FormError message={error} />
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? <Icon name="spinner" className="h-4 w-4 animate-spin" /> : <Icon name="check" className="h-4 w-4" />}
        {pending ? "Saving..." : "Record action"}
      </button>
      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={clearToast} />
    </form>
  );
}
