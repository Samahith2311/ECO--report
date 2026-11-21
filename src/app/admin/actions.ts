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

export async function addIntervention(complaintId: string, trackingId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const { error } = await supabase.from("interventions").insert({
    complaint_id: complaintId,
    action_taken: String(formData.get("action")).trim(),
    department: String(formData.get("department")).trim(),
    remarks: String(formData.get("remarks") ?? "").trim() || null,
    ...(date && { intervention_date: date }), // empty -> the database uses today
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${trackingId}`);
}
