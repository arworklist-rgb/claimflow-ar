import { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ArManagementView } from "@/components/ar-management/ar-management-view";

export const metadata: Metadata = { title: "AR Management" };

export default function ArManagementPage() {
  return (
    <PageContainer>
      <Suspense fallback={null}>
        <ArManagementView />
      </Suspense>
    </PageContainer>
  );
}
