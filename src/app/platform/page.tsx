import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SuperAdminDashboard } from "@/roles/Super Admin";

export const metadata: Metadata = { title: "Super Admin Console" };

export default function PlatformPage() {
  return (
    <PageContainer>
      <SuperAdminDashboard />
    </PageContainer>
  );
}
