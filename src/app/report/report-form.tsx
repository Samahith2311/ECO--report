"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TYPES, TYPE_ICON, fmtDate, type ComplaintType } from "@/lib/complaints";
import { Icon } from "@/components/ui/icons";
import Toast from "@/components/ui/toast";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // same limit as the storage bucket
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Values = {
  type: ComplaintType | "";
  description: string;
  location: string;
  date: string;
  name: string;
  contact: string;
};
type Field = keyof Values;
type Errors = Partial<Record<Field | "photo", string>>;

const EMPTY: Values = { type: "", description: "", location: "", date: "", name: "", contact: "" };

// The form is split into three short steps. Each step lists the fields it checks.
const STEPS: { title: string; fields: Field[] }[] = [
  { title: "The problem", fields: ["type", "description"] },
  { title: "Place and time", fields: ["location", "date"] },
  { title: "Your details", fields: ["name", "contact"] },
];

// Today's date as YYYY-MM-DD in the user's own time zone.
const today = () => new Date().toLocaleDateString("en-CA");

// Same limits as the database CHECK constraints (the database trims spaces first).
function validate(field: Field, v: Values): string | undefined {
  const len = v[field].trim().length;
  switch (field) {
    case "type":
      return v.type ? undefined : "Choose the type of problem.";
    case "description":
      if (len < 10) return "Please describe the problem in at least 10 characters.";
      if (len > 2000) return "Please keep the description under 2000 characters.";
      return;
    case "location":
      if (len < 3) return "Tell us where it is: a street, area or landmark.";
      if (len > 300) return "Please keep the location under 300 characters.";
      return;
    case "date":
      return v.date && v.date > today() ? "The date can't be in the future." : undefined;
    case "name":
      if (len < 2) return "Please enter your name.";
      if (len > 100) return "Please keep your name under 100 characters.";
      return;
    case "contact": {
      const c = v.contact.trim();
      if (c.length < 3) return "Enter a phone number or email address.";
      if (c.length > 100) return "Please keep this under 100 characters.";
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
      const digits = c.replace(/\D/g, "").length;
      if (!isEmail && digits < 7) return "Enter a valid phone number or email address.";
      return;
    }
  }
}

export default function ReportForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // Move keyboard/screen-reader focus to the new heading when the step (or screen) changes.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step, trackingId]);

  // Free the photo preview's memory when it is replaced or the form goes away.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function goTo(next: number) {
    moved.current = true;
    setStep(next);
  }

  function setValue(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field shows an error, re-check it while typing so the error clears as soon as it is fixed.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validate(field, next) }));
  }

  // Inline validation when the user leaves a field.
  function onBlur(field: Field) {
    setErrors((e) => ({ ...e, [field]: validate(field, values) }));
  }

  // Check every field in a step; focus the first one with a problem.
  function checkStep(index: number) {
    const found: Errors = {};
    for (const f of STEPS[index].fields) found[f] = validate(f, values);
    setErrors((e) => ({ ...e, ...found }));
    const firstBad = STEPS[index].fields.find((f) => found[f]);
    if (firstBad) {
      const id = firstBad === "type" ? `type-${values.type || Object.keys(TYPES)[0]}` : firstBad;
      document.getElementById(id)?.focus();
      return false;
    }
    return true;
  }

  function pinMyLocation() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser can't share its location. You can still send the report without it.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was blocked. You can still send the report without it."
            : "We couldn't find your location. You can still send the report without it.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again after removing it
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setErrors((x) => ({ ...x, photo: "Please choose a JPG, PNG or WebP image." }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((x) => ({ ...x, photo: "This photo is larger than 5 MB. Please choose a smaller one." }));
      return;
    }
    setErrors((x) => ({ ...x, photo: undefined }));
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPreview(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!checkStep(step)) return;
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }

    setSubmitError(null);
    setBusy(true);
    const supabase = createClient();
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const path = `${crypto.randomUUID()}.${photo.type.split("/")[1]}`;
        const up = await supabase.storage.from("complaint-photos").upload(path, photo);
        if (up.error) {
          setSubmitError(
            "We couldn't upload your photo. Try a smaller image, or remove the photo and send the report without it.",
          );
          return;
        }
        photoUrl = supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase.rpc("submit_complaint", {
        p_type: values.type,
        p_description: values.description,
        p_location_text: values.location,
        p_latitude: coords?.lat ?? null,
        p_longitude: coords?.lng ?? null,
        p_date: values.date || null, // empty -> the database uses today
        p_photo_url: photoUrl,
        p_reporter_name: values.name,
        p_reporter_contact: values.contact,
      });
      if (error) {
        // Friendly messages only: the raw database error is never shown.
        setSubmitError(
          error.code === "23514"
            ? "Some details are too short or too long. Please go back and check each step."
            : error.code === "22023"
              ? "The date can't be in the future. Please go back and change it."
              : "We couldn't send your report. Please check your connection and try again. Your answers are kept.",
        );
        return;
      }
      moved.current = true;
      setTrackingId(data as string);
    } catch {
      setSubmitError("We couldn't send your report. Please check your connection and try again. Your answers are kept.");
    } finally {
      setBusy(false);
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(trackingId!);
      setToast("Tracking ID copied");
    } catch {
      setToast("Couldn't copy. Select the ID and copy it yourself.");
    }
  }

  function reportAnother() {
    setValues(EMPTY);
    setErrors({});
    setCoords(null);
    setGeoError(null);
    removePhoto();
    setSubmitError(null);
    setTrackingId(null);
    goTo(0);
  }

  // ---------------------------------------------------------------- success screen
  if (trackingId) {
    return (
      <>
      <div className="card mt-8 animate-fade-up text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-brand-100 text-brand-700">
          <Icon name="check" className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 scroll-mt-24 text-3xl font-semibold text-brand-900 focus:outline-none">
          Report sent. Thank you!
        </h2>
        <p className="mt-2 text-base text-muted">Save your tracking ID. You need it to follow your complaint.</p>

        <div className="mx-auto mt-6 max-w-sm rounded-card border-2 border-dashed border-brand-300 bg-brand-50 p-5">
          <p className="text-sm font-semibold text-muted">Your tracking ID</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-wider break-all text-brand-800 select-all sm:text-4xl">
            {trackingId}
          </p>
          <button type="button" className="btn btn-secondary mt-4 w-full" onClick={copyId}>
            <Icon name="copy" className="h-4 w-4" />
            Copy tracking ID
          </button>
        </div>

        <h3 className="mt-8 text-lg font-semibold text-ink">What happens next</h3>
        <ol className="mx-auto mt-3 max-w-md space-y-3 text-left text-base text-muted">
          {[
            "The authorities review your report.",
            "Each action they take is recorded on your complaint.",
            "Check progress any time with your tracking ID.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/track?id=${trackingId}`} className="btn btn-primary btn-lg">
            Track this complaint
            <Icon name="arrowRight" className="h-5 w-5" />
          </Link>
          <button type="button" className="btn btn-ghost btn-lg" onClick={reportAnother}>
            Report another problem
          </button>
        </div>
      </div>
      {/* outside the animated card so position: fixed is relative to the screen */}
      <Toast message={toast} onClose={clearToast} />
      </>
    );
  }

  // ---------------------------------------------------------------- the form
  const last = step === STEPS.length - 1;
  const descLength = values.description.trim().length;

  return (
    <div className="mt-8">
      {/* Progress: three bars with step names */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.title} aria-current={i === step ? "step" : undefined}>
            <div className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-brand-600" : "bg-brand-100"}`} />
            <p className={`mt-2 text-xs font-semibold sm:text-sm ${i === step ? "text-brand-800" : "text-muted"}`}>
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
              {i < step && <span className="sr-only"> (done)</span>}
            </p>
          </li>
        ))}
      </ol>

      <form noValidate onSubmit={onSubmit} className="card mt-5 sm:p-8">
        <p className="text-sm font-semibold text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-1 scroll-mt-24 text-2xl font-semibold text-brand-900 focus:outline-none">
          {["What's the problem?", "Where and when?", "How can the authorities reach you?"][step]}
        </h2>

        <div key={step} className="mt-6 animate-fade-up space-y-6">
          {step === 0 && (
            <>
              <fieldset aria-describedby={errors.type ? "type-error" : undefined}>
                <legend className="label">Type of problem</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {(Object.entries(TYPES) as [ComplaintType, string][]).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex min-h-20 cursor-pointer flex-col justify-between gap-2 rounded-control border border-field bg-surface p-3 text-sm font-semibold text-ink transition-colors hover:border-brand-600 hover:bg-brand-50 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600"
                    >
                      <input
                        type="radio"
                        id={`type-${value}`}
                        name="type"
                        value={value}
                        checked={values.type === value}
                        onChange={() => setValue("type", value)}
                        className="sr-only"
                      />
                      <Icon name={TYPE_ICON[value]} className="h-6 w-6 text-brand-600" />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldError id="type-error" message={errors.type} />
              </fieldset>

              <div>
                <label htmlFor="description" className="label">
                  What is happening?
                </label>
                <textarea
                  id="description"
                  rows={5}
                  value={values.description}
                  onChange={(e) => setValue("description", e.target.value)}
                  onBlur={() => onBlur("description")}
                  aria-invalid={!!errors.description}
                  aria-describedby="description-hint description-error"
                  placeholder="e.g. Construction waste is dumped beside the lake road every night. It smells and blocks the footpath."
                  className="field"
                />
                <div className="hint flex justify-between gap-4" id="description-hint">
                  <span>Say what you see, how often it happens and anything that helps find it.</span>
                  <span className={`shrink-0 ${descLength > 2000 ? "text-danger" : ""}`}>{descLength}/2000</span>
                </div>
                <FieldError id="description-error" message={errors.description} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="location" className="label">
                  Where is it?
                </label>
                <input
                  id="location"
                  value={values.location}
                  onChange={(e) => setValue("location", e.target.value)}
                  onBlur={() => onBlur("location")}
                  aria-invalid={!!errors.location}
                  aria-describedby="location-hint location-error"
                  placeholder="e.g. Kukkarahalli Lake, near the bund road"
                  className="field"
                />
                <p className="hint" id="location-hint">
                  A street, area or landmark that people know.
                </p>
                <FieldError id="location-error" message={errors.location} />

                <div className="mt-3">
                  {coords ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-brand-50 py-1 pr-1 pl-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                        <Icon name="pin" className="h-4 w-4" />
                        Location pinned on the map
                      </span>
                      <button type="button" className="btn btn-ghost" onClick={() => setCoords(null)}>
                        Remove pin
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={pinMyLocation} disabled={locating}>
                      <Icon name={locating ? "spinner" : "pin"} className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
                      {locating ? "Finding your location..." : "Use my current location"}
                    </button>
                  )}
                  {geoError ? (
                    <p className="hint flex items-start gap-1.5" role="status">
                      <Icon name="info" className="mt-0.5 h-4 w-4" />
                      {geoError}
                    </p>
                  ) : (
                    !coords && <p className="hint">Optional. It puts your complaint on the public map.</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="date" className="label">
                  When did you notice it? <Optional />
                </label>
                <input
                  id="date"
                  type="date"
                  max={today()}
                  suppressHydrationWarning // "today" can differ between server and browser time zones
                  value={values.date}
                  onChange={(e) => setValue("date", e.target.value)}
                  onBlur={() => onBlur("date")}
                  aria-invalid={!!errors.date}
                  aria-describedby="date-hint date-error"
                  className="field sm:max-w-xs"
                />
                <p className="hint" id="date-hint">
                  Leave empty if it was today.
                </p>
                <FieldError id="date-error" message={errors.date} />
              </div>

              <div>
                <p className="label" id="photo-label">
                  Photo <Optional />
                </p>
                {photo && preview ? (
                  <div className="flex items-center gap-3 rounded-control border border-line p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
                    <img src={preview} alt="Preview of the chosen photo" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{photo.name}</p>
                      <p className="text-sm text-muted">{(photo.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={removePhoto}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="photo"
                    className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-field p-4 text-center transition-colors hover:border-brand-600 hover:bg-brand-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600"
                  >
                    <Icon name="camera" className="h-6 w-6 text-brand-600" />
                    <span className="font-semibold text-brand-700">Add a photo</span>
                    <span className="text-sm text-muted">JPG, PNG or WebP, up to 5 MB</span>
                    <input
                      id="photo"
                      type="file"
                      accept={PHOTO_TYPES.join(",")}
                      onChange={onPhoto}
                      aria-describedby="photo-error"
                      className="sr-only"
                    />
                  </label>
                )}
                <FieldError id="photo-error" message={errors.photo} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="flex items-start gap-3 rounded-control bg-brand-50 p-4 text-sm text-brand-900">
                <Icon name="shield" className="mt-0.5 h-5 w-5 text-brand-600" />
                Only the authorities see your name and contact. They are never shown on the public pages.
              </p>

              <div>
                <label htmlFor="name" className="label">
                  Your name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => setValue("name", e.target.value)}
                  onBlur={() => onBlur("name")}
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                  className="field"
                />
                <FieldError id="name-error" message={errors.name} />
              </div>

              <div>
                <label htmlFor="contact" className="label">
                  Phone number or email
                </label>
                <input
                  id="contact"
                  value={values.contact}
                  onChange={(e) => setValue("contact", e.target.value)}
                  onBlur={() => onBlur("contact")}
                  aria-invalid={!!errors.contact}
                  aria-describedby="contact-hint contact-error"
                  placeholder="e.g. 98450 12345 or name@example.com"
                  className="field"
                />
                <p className="hint" id="contact-hint">
                  Only used if the authorities need more details from you.
                </p>
                <FieldError id="contact-error" message={errors.contact} />
              </div>

              {/* Short summary so people can check before sending */}
              <div className="rounded-control border border-line">
                <div className="flex items-center justify-between border-b border-line py-1 pr-1 pl-4">
                  <h3 className="font-sans text-sm font-semibold text-ink">Check your report</h3>
                  <button type="button" className="btn btn-ghost" onClick={() => goTo(0)}>
                    Edit
                  </button>
                </div>
                <dl className="grid gap-3 p-4 text-sm sm:grid-cols-[8rem_1fr]">
                  <dt className="text-muted">Problem</dt>
                  <dd className="font-medium">{values.type ? TYPES[values.type] : "-"}</dd>
                  <dt className="text-muted">Description</dt>
                  <dd className="line-clamp-3 break-words">{values.description}</dd>
                  <dt className="text-muted">Place</dt>
                  <dd>
                    {values.location}
                    {coords && <span className="text-muted"> (pinned on map)</span>}
                  </dd>
                  <dt className="text-muted">Date</dt>
                  <dd>{values.date ? fmtDate(values.date) : "Today"}</dd>
                  <dt className="text-muted">Photo</dt>
                  <dd>{photo ? "1 photo attached" : "No photo"}</dd>
                </dl>
              </div>
            </>
          )}
        </div>

        {submitError && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-control bg-danger-tint p-4 text-sm font-medium text-danger">
            <Icon name="alert" className="mt-0.5 h-4 w-4" />
            {submitError}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)} disabled={busy}>
              <Icon name="arrowLeft" className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={busy}>
            {last ? (
              busy ? (
                <>
                  <Icon name="spinner" className="h-5 w-5 animate-spin" />
                  Sending report...
                </>
              ) : (
                <>
                  Send report
                  <Icon name="send" className="h-5 w-5" />
                </>
              )
            ) : (
              <>
                Continue
                <Icon name="arrowRight" className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Error text under a field, linked to it with aria-describedby.
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <Icon name="alert" className="mt-0.5 h-4 w-4" />
      {message}
    </p>
  );
}

function Optional() {
  return <span className="ml-1 text-sm font-normal text-muted">(optional)</span>;
}
