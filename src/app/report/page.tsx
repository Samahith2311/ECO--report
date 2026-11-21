import type { Metadata } from "next";
import PageHeader from "@/components/ui/page-header";
import ReportForm from "./report-form";

export const metadata: Metadata = { title: "Report a complaint" };

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <PageHeader
        title="Report a problem"
        description="Three short steps. At the end you get a tracking ID to follow what happens next."
      />
      <ReportForm />
    </div>
  );
}
