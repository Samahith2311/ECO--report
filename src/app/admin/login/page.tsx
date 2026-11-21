import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
        <Icon name="lock" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-3xl font-semibold text-brand-900">Admin sign in</h1>
      <p className="mt-2 text-base text-muted">For authorised officials who manage complaints.</p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-muted">
        Not an official?{" "}
        <Link href="/track" className="link">
          Track your complaint
        </Link>{" "}
        instead.
      </p>
    </div>
  );
}
