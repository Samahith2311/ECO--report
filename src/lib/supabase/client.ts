// Supabase client for the BROWSER (Client Components: forms, map pages, login).
// Uses the public anon key, so it can only do what Row Level Security allows.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
