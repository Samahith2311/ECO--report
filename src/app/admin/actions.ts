"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUSES } from "@/lib/complaints";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// The DB trigger writes the status_history row.
export async function updateStatus(trackingId: string, formData: FormData) {
  const status = String(formData.get("status"));
  if (!Object.hasOwn(STATUSES, status)) throw new Error("Invalid status");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("complaints").update({ status }).eq("tracking_id", trackingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${trackingId}`);
}

// What an admin form gets back: ok, or a friendly message to show (never the raw database error).
export type ActionResult = { ok: true } | { ok: false; error: string };

// Today's date as YYYY-MM-DD in Indian time (the app serves Mysuru), whatever the server's time zone.
function todayInIndia() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function addIntervention(
  complaintId: string,
  trackingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const date = String(formData.get("date") ?? "");
  // The date picker already blocks future dates; this check also covers a form sent without it.
  if (date && date > todayInIndia()) {
    return { ok: false, error: "The action date can't be in the future. Pick today or an earlier date." };
  }
  const { error } = await supabase.from("interventions").insert({
    complaint_id: complaintId,
    action_taken: String(formData.get("action")).trim(),
    department: String(formData.get("department")).trim(),
    remarks: String(formData.get("remarks") ?? "").trim() || null,
    ...(date && { intervention_date: date }), // empty -> the database uses today
  });
  if (error) return { ok: false, error: "Couldn't save the action. Check the fields and try again." };
  revalidatePath(`/admin/${trackingId}`);
  return { ok: true };
}
