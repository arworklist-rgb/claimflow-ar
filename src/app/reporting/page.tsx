import { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ReportingView } from "@/components/reporting/reporting-view";

export const metadata: Metadata = { title: "Reporting" };

export default function ReportingPage() {
  return (
    <PageContainer>
      <Suspense fallback={null}>
        <ReportingView />
      </Suspense>
    </PageContainer>
  );
}
