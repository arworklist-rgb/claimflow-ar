import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { HelpdeskView } from "@/components/helpdesk/helpdesk-view";

export const metadata: Metadata = { title: "HelpDesk" };

export default function HelpdeskPage() {
  return (
    <PageContainer>
      <HelpdeskView />
    </PageContainer>
  );
}
