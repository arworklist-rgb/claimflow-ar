import type { Metadata } from "next";
import { TemplatesView } from "@/components/templates/templates-view";

export const metadata: Metadata = { title: "Upload Templates" };

export default function UploadTemplatesPage() {
  return <TemplatesView />;
}
