import type { Metadata } from "next";
import { PracticesView } from "@/components/practices/practices-view";

export const metadata: Metadata = { title: "Practices" };

export default function PracticesPage() {
  return <PracticesView />;
}
