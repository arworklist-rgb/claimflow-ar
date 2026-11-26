import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";

export const metadata: Metadata = { title: "Knowledge Center" };

export default function KnowledgeCenterPage() {
  return (
    <PageContainer>
      <KnowledgeView />
    </PageContainer>
  );
}
