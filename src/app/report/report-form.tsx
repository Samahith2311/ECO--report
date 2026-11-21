"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TYPES } from "@/lib/complaints";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // same limit as the storage bucket

export default function ReportForm() {
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  function pinMyLocation() {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGeoError("Could not get your location. You can still submit without it."),
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const supabase = createClient();
    try {
      let photoUrl: string | null = null;
      const photo = f.get("photo") as File;
      if (photo.size > 0) {
        if (photo.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 5 MB or smaller.");
        const path = `${crypto.randomUUID()}.${photo.type.split("/")[1]}`;
        const up = await supabase.storage.from("complaint-photos").upload(path, photo);
        if (up.error) throw up.error;
        photoUrl = supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl;
      }

      const { data, error: rpcError } = await supabase.rpc("submit_complaint", {
        p_type: f.get("type"),
        p_description: f.get("description"),
        p_location_text: f.get("location"),
        p_latitude: coords?.lat ?? null,
        p_longitude: coords?.lng ?? null,
        p_date: f.get("date") || null, // empty -> the database uses today
        p_photo_url: photoUrl,
        p_reporter_name: f.get("name"),
        p_reporter_contact: f.get("contact"),
      });
      if (rpcError) throw rpcError;
      setTrackingId(data as string);
    } catch (err) {
      const { code, message } = err as { code?: string; message?: string };
      setError(
        code === "23514"
          ? "Please check your entries: one of the fields is too short or too long."
          : (message ?? "Something went wrong. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (trackingId) {
    return (
      <div className="card mt-8 text-center" role="status">
        <h2 className="text-2xl font-semibold text-brand-800">Complaint submitted</h2>
        <p className="mt-2 text-muted">Keep this tracking ID. You need it to follow your complaint.</p>
        <p className="my-5 select-all font-mono text-3xl font-bold tracking-wider text-brand-700">
          {trackingId}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/track?id=${trackingId}`} className="btn btn-primary">
            Track this complaint
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => setTrackingId(null)}>
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-5">
      <div>
        <label htmlFor="type" className="label">Type of problem</label>
        <select id="type" name="type" required defaultValue="" className="field">
          <option value="" disabled>Select a type</option>
          {Object.entries(TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="label">What is happening?</label>
        <textarea id="description" name="description" required minLength={10} maxLength={2000} rows={5} className="field" />
      </div>

      <div>
        <label htmlFor="location" className="label">Where? (area, street or landmark)</label>
        <input id="location" name="location" required minLength={3} maxLength={300} className="field" />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" className="btn btn-secondary !px-3 !py-1.5" onClick={pinMyLocation}>
            Use my current location
          </button>
          {coords && (
            <span className="text-muted">
              Pinned at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{" "}
              <button type="button" className="underline" onClick={() => setCoords(null)}>remove</button>
            </span>
          )}
          {geoError && <span className="text-red-700">{geoError}</span>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="label">Date noticed (optional, defaults to today)</label>
          <input id="date" name="date" type="date" className="field" />
        </div>
        <div>
          <label htmlFor="photo" className="label">Photo (optional, JPG/PNG/WebP, max 5 MB)</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="field" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="contact" className="label">Phone or email</label>
          <input id="contact" name="contact" required minLength={3} maxLength={100} className="field" />
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted">Your name and contact are only seen by the authorities. They are never shown publicly.</p>

      {error && <p className="field-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Submitting..." : "Submit complaint"}
      </button>
    </form>
  );
}
