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

// What an admin form gets back: ok, or a friendly message to show (never the raw database error).
export type ActionResult = { ok: true } | { ok: false; error: string };

// The DB trigger writes the status_history row.
export async function updateStatus(trackingId: string, formData: FormData): Promise<ActionResult> {
  const status = String(formData.get("status"));
  if (!Object.hasOwn(STATUSES, status)) return { ok: false, error: "Please choose a valid status." };
  // Rejecting always needs a reason, so it goes through rejectComplaint below.
  if (status === "rejected") return { ok: false, error: "Rejecting needs a reason. Please fill in the reason." };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("complaints").update({ status }).eq("tracking_id", trackingId);
  if (error) return { ok: false, error: "Couldn't change the status. Please try again." };
  revalidatePath(`/admin/${trackingId}`);
  return { ok: true };
}

// Reject a complaint with a reason. The reason is saved as an intervention (action), so the
// reporter can read it on the track page. Two steps: change the status, then save the reason.
export async function rejectComplaint(
  complaintId: string,
  trackingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const reason = String(formData.get("reason") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  if (reason.length < 3) return { ok: false, error: "Please give a short reason for rejecting." };
  if (reason.length > 900) return { ok: false, error: "Please keep the reason under 900 characters." };
  if (department.length < 2 || department.length > 200) return { ok: false, error: "Please enter the department." };

  const supabase = await requireAdmin();
  const { error: statusError } = await supabase
    .from("complaints")
    .update({ status: "rejected" })
    .eq("tracking_id", trackingId);
  if (statusError) return { ok: false, error: "Couldn't reject the complaint. Please try again." };

  const { error: reasonError } = await supabase.from("interventions").insert({
    complaint_id: complaintId,
    action_taken: `Complaint rejected. Reason: ${reason}`,
    department,
  });
  revalidatePath(`/admin/${trackingId}`);
  if (reasonError) {
    return {
      ok: false,
      error: "The complaint was rejected, but the reason was not saved. Please add it under Record a new action.",
    };
  }
  return { ok: true };
}

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
