import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  blue: "bg-primary/10 text-primary",
  green: "bg-success/10 text-success",
} as const;

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "blue", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,31,61,0.04)] sm:px-5",
        className,
      )}
    >
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONES[tone])}>
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl leading-tight font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}
