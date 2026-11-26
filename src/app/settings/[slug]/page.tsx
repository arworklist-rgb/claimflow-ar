import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaimStatusBucketsView } from "@/components/settings/claim-status-buckets-view";
import { CompanyProfileView } from "@/components/settings/company-profile-view";
import { IntegrationsView } from "@/components/settings/integrations-view";
import { NotificationsView } from "@/components/settings/notifications-view";
import { PayersView } from "@/components/settings/payers-view";
import { UsersRolesView } from "@/components/settings/users-roles-view";
import { SETTINGS_NAV } from "@/lib/nav";

const SLUG_ITEMS = SETTINGS_NAV.filter(
  (i) => i.slug !== "practices" && i.slug !== "denial-codes" && i.slug !== "upload-templates",
);

export const dynamicParams = false;

export function generateStaticParams() {
  return SLUG_ITEMS.map((i) => ({ slug: i.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = SLUG_ITEMS.find((i) => i.slug === slug);
  return { title: item ? item.label : "Settings" };
}

export default async function SettingsSlugPage({ params }: Props) {
  const { slug } = await params;

  switch (slug) {
    case "users-roles":
      return <UsersRolesView />;
    case "claim-status-buckets":
      return <ClaimStatusBucketsView />;
    case "payers":
      return <PayersView />;
    case "notifications":
      return <NotificationsView />;
    case "company-profile":
      return <CompanyProfileView />;
    case "integrations":
      return <IntegrationsView />;
    default:
      notFound();
  }
}
