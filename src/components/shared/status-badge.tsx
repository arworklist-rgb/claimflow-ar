import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClaimAction, Status, UploadStatus } from "@/lib/types";

const base = "gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold";

const ACTIVE = "bg-success-soft text-success";
const INACTIVE = "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";

function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("size-1.5 rounded-full bg-current", className)} />;
}

/** Active (green) / Inactive (amber) pill with a leading dot. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="secondary" className={cn(base, status === "Active" ? ACTIVE : INACTIVE)}>
      <Dot />
      {status}
    </Badge>
  );
}

/** One colour per Action, so they're easy to tell apart at a glance. */
export const ACTION_STYLES: Record<ClaimAction, { badge: string; dot: string }> = {
  "Paid and closed": { badge: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300", dot: "bg-green-500" },
  "Write off": { badge: "bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300", dot: "bg-slate-500" },
  Query: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", dot: "bg-amber-500" },
  Resubmitted: { badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300", dot: "bg-blue-600" },
  "Patient Balance": { badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300", dot: "bg-violet-500" },
  "Set to pay": { badge: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300", dot: "bg-teal-500" },
  New: { badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300", dot: "bg-sky-500" },
  Inprocess: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300", dot: "bg-orange-500" },
  "Posting error corrected": { badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300", dot: "bg-rose-500" },
  "EOB sent": { badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
};

export function ClaimActionBadge({ action }: { action: ClaimAction }) {
  return (
    <Badge variant="secondary" className={cn(base, "whitespace-nowrap", ACTION_STYLES[action].badge)}>
      <Dot />
      {action}
    </Badge>
  );
}

const UPLOAD_TONES: Record<UploadStatus, string> = {
  Completed: ACTIVE,
  "Completed with warnings": INACTIVE,
  Failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  return (
    <Badge variant="secondary" className={cn(base, "whitespace-nowrap", UPLOAD_TONES[status])}>
      <Dot />
      {status}
    </Badge>
  );
}
