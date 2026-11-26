import type { Metadata } from "next";
import { DenialCodesView } from "@/components/denial-codes/denial-codes-view";

export const metadata: Metadata = { title: "Denial Codes" };

export default function DenialCodesPage() {
  return <DenialCodesView />;
}
