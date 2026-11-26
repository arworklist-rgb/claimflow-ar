import { CircleCheck, FolderOpen, Hourglass, RefreshCw, Wallet, type LucideIcon } from "lucide-react";
import { balanceOf, isClosed, isNotWorked } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import type { Claim } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  featured?: boolean;
}

export function SummaryCards({ claims }: { claims: Claim[] }) {
  const count = (n: number) => n.toLocaleString("en-US");
  const fresh = claims.filter((c) => c.action === "New").length;
  const active = claims.filter((c) => !isClosed(c)).length;

  const stats: Stat[] = [
    {
      label: "Open balance",
      value: formatCurrency(claims.reduce((sum, c) => sum + balanceOf(c), 0)),
      hint: `across ${count(active)} active ${active === 1 ? "claim" : "claims"}`,
      icon: Wallet,
      tone: "bg-primary/10 text-primary",
      featured: true,
    },
    {
      label: "New",
      value: count(fresh),
      hint: "ready to work",
      icon: FolderOpen,
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    },
    {
      label: "Inprocess",
      value: count(claims.filter((c) => c.action === "Inprocess").length),
      hint: "being worked",
      icon: RefreshCw,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
    {
      label: "Paid and closed",
      value: count(claims.filter(isClosed).length),
      hint: "paid in full",
      icon: CircleCheck,
      tone: "bg-success/10 text-success",
    },
    {
      label: "Not yet worked",
      value: count(claims.filter(isNotWorked).length),
      hint: "no activity logged",
      icon: Hourglass,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            "flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,31,61,0.04)]",
            s.featured && "col-span-2 md:col-span-1",
          )}
        >
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", s.tone)}>
            <s.icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">{s.label}</p>
            <p className="truncate text-2xl leading-tight font-bold tracking-tight tabular-nums">{s.value}</p>
            <p className="truncate text-xs text-muted-foreground">{s.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
