import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side admin check for admin pages and Server Actions. proxy.ts alone is not enough:
// a Server Action is a plain POST request, so each one re-checks. RLS is the last line of defence.
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.app_metadata?.role !== "admin") redirect("/admin/login");
  return supabase;
}
