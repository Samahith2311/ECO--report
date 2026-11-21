import type { Metadata } from "next";
import ReportForm from "./report-form";

export const metadata: Metadata = { title: "Report a complaint" };

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-brand-900">Report a complaint</h1>
      <p className="mt-2 text-muted">
        Describe the problem and where it is. You get a tracking ID to follow what happens next.
      </p>
      <ReportForm />
    </main>
  );
}
