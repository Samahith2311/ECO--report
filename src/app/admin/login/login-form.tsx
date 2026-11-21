"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icons";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <form onSubmit={onSubmit} className="card mt-6 space-y-5 sm:p-8">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="username"
          aria-describedby={error ? "login-error" : undefined}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : undefined}
            className="field pr-14"
          />
          {/* Show / hide toggle: a real button with a clear label and pressed state */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-0 right-0 grid h-11 w-12 cursor-pointer place-items-center rounded-r-control text-muted hover:text-brand-800"
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <p id="login-error" role="alert" className="flex items-start gap-2 rounded-control bg-danger-tint p-3 text-sm font-medium text-danger">
          <Icon name="alert" className="mt-0.5 h-4 w-4" />
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
        {busy && <Icon name="spinner" className="h-5 w-5 animate-spin" />}
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
