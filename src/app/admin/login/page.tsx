import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-3xl font-semibold text-brand-900">Admin login</h1>
      <p className="mt-2 text-muted">For authorised officials only.</p>
      <LoginForm />
    </div>
  );
}
