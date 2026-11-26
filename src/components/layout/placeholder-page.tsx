import Link from "next/link";
import { Check, Construction, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

/** What each unbuilt module is planned to do, so the page says something useful. */
const PLANNED: Record<string, string[]> = {
  Dashboard: ["Denial rate and recovery trends", "AR aging by bucket and payer", "Team workload and productivity"],
  Reporting: ["Recovery rate and write-off reports", "Denial root-cause analysis", "Payer scorecards, exportable to Excel"],
  "AR Management": ["Assign and rebalance work across staff", "Follow-up reminders and escalations", "Productivity targets per AR specialist"],
  "Users & Roles": ["Invite teammates by email", "Role-based access to practices and data", "Deactivate users without losing history"],
  "Claim Status & Buckets": ["Custom claim statuses", "Configurable aging bucket ranges", "Status rules per practice"],
  Payers: ["Payer directory with contacts", "Timely-filing limits per payer", "Payer-specific appeal instructions"],
  "Upload Templates": ["Column mappings per practice", "Saved templates for each file type", "Validation rules and defaults"],
  Notifications: ["Timely-filing and follow-up alerts", "Daily and weekly email digests", "Per-user notification preferences"],
  "Company Profile": ["Organization name, address and logo", "Billing contact and tax details", "Default practice settings"],
  Integrations: ["Clearinghouse and ERA connections", "Practice management and EHR sync", "Webhooks and API keys"],
};

/** Stand-in for modules that are out of scope for this phase of the demo. */
export function PlaceholderPage({ title, description, icon: Icon = Construction }: PlaceholderPageProps) {
  const planned = PLANNED[title] ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(15,31,61,0.04),0_8px_24px_rgba(15,31,61,0.05)]">
        {/* soft dotted backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <div className="relative flex flex-col items-center gap-6 px-6 py-14 text-center sm:py-16">
          <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <Icon className="size-8" aria-hidden />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wide text-brand-soft-foreground uppercase">
              Coming in the next phase
            </span>
            <h2 className="text-xl font-bold tracking-tight">{title} is on the way</h2>
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Upload Claims, Worklist, Practices and Denial Codes are fully interactive in this demo.
            </p>
          </div>

          {planned.length > 0 && (
            <ul className="grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3" aria-label={`Planned for ${title}`}>
              {planned.map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-xl border bg-card/90 p-3.5 text-sm shadow-xs backdrop-blur">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg">
              <Link href="/worklist">Open the Worklist</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-card">
              <Link href="/upload-claims">Upload Claims</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
