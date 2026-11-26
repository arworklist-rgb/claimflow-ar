import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "ClaimFlow AR — Healthcare AR & Denial Recovery",
  description: "Role-based healthcare Accounts Receivable, claim denial workflow, and payment reconciliation platform.",
};

export default function Home() {
  return <LandingPage />;
}
