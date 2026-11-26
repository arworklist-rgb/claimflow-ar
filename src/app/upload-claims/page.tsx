import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { NewClaimsCard } from "@/components/upload/new-claims-card";
import { PaidClaimsCard } from "@/components/upload/paid-claims-card";
import { RecentUploads } from "@/components/upload/recent-uploads";

export const metadata: Metadata = { title: "Upload Claims" };

export default function UploadClaimsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Upload Claims"
        description="Import claim data from Excel to create or update your worklist."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <NewClaimsCard />
        <PaidClaimsCard />
      </div>
      <RecentUploads />
    </PageContainer>
  );
}
