import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { UploadClaimsView } from "@/components/upload/upload-claims-view";

export const metadata: Metadata = { title: "Upload Claims" };

export default function UploadClaimsPage() {
  return (
    <PageContainer className="space-y-6">
      <UploadClaimsView />
    </PageContainer>
  );
}
