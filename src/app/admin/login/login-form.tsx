"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (authError) {
      setError("Wrong email or password.");
      setBusy(false);
      return;
    }
    if (data.user.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account is not an admin account.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh(); // re-run server components now that the session cookie exists
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
