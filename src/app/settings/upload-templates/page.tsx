import type { Metadata } from "next";
import { TemplatesView } from "@/components/templates/templates-view";

export const metadata: Metadata = { title: "Worklist Settings" };

export default function UploadTemplatesPage() {
  return <TemplatesView />;
}
