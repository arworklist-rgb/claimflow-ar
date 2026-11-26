import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { WorklistView } from "@/components/worklist/worklist-view";

export const metadata: Metadata = { title: "Worklist" };

export default function WorklistPage() {
  return (
    <PageContainer>
      <WorklistView />
    </PageContainer>
  );
}
