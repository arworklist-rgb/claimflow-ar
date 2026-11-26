import { BUCKETS, ageInDays, balanceOf, bucketOfAge, type BucketId } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import type { Claim } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BucketFilter = "all" | BucketId;

interface BucketTabsProps {
  claims: Claim[];
  value: BucketFilter;
  onChange: (v: BucketFilter) => void;
  now: number;
}

const DOTS: Record<BucketFilter, string> = {
  all: "bg-slate-400",
  new: "bg-sky-500",
  "30": "bg-amber-500",
  "60": "bg-orange-500",
  "60plus": "bg-red-500",
};

/** Aging-bucket filter, shown as one segmented control: label + count, with the balance underneath. */
export function BucketTabs({ claims, value, onChange, now }: BucketTabsProps) {
  const summarize = (list: Claim[]) => ({
    count: list.length,
    balance: formatCurrency(list.reduce((sum, c) => sum + balanceOf(c), 0)),
  });

  const tabs: { id: BucketFilter; label: string; count: number; balance: string }[] = [
    { id: "all", label: "All claims", ...summarize(claims) },
    ...BUCKETS.map((b) => ({
      id: b.id,
      label: b.label,
      ...summarize(claims.filter((c) => bucketOfAge(ageInDays(c, now)) === b.id)),
    })),
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label="Aging buckets"
        className="inline-flex min-w-full gap-1 rounded-xl border bg-muted/60 p-1 sm:min-w-0"
      >
        {tabs.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={cn(
                "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-4 py-2 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active
                  ? "bg-card shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden className={cn("size-2 rounded-full", DOTS[t.id])} />
                <span className={active ? "text-foreground" : undefined}>{t.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] leading-4 font-semibold tabular-nums",
                    active ? "bg-primary text-primary-foreground" : "bg-foreground/10",
                  )}
                >
                  {t.count.toLocaleString("en-US")}
                </span>
              </span>
              <span className="pl-4 text-xs whitespace-nowrap tabular-nums">{t.balance}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
