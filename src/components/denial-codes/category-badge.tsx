import {
  ClipboardCheck,
  Clock,
  CodeXml,
  Ellipsis,
  FileSearch,
  Gauge,
  Layers,
  Shield,
  ShieldX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DenialCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// Full class names are listed (not interpolated) so Tailwind can see them.
const CATEGORY_STYLES: Record<DenialCategory, { icon: LucideIcon; className: string }> = {
  Authorization: { icon: ClipboardCheck, className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
  "Missing Information": { icon: FileSearch, className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
  Coverage: { icon: Shield, className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" },
  Duplicate: { icon: Layers, className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  "Non-Covered Service": { icon: ShieldX, className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  "Benefit Limit": { icon: Gauge, className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  Coding: { icon: CodeXml, className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
  Network: { icon: Users, className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" },
  "Timely Filing": { icon: Clock, className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300" },
  "Patient Responsibility": { icon: Wallet, className: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300" },
  Other: { icon: Ellipsis, className: "bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300" },
};

export function CategoryBadge({ category }: { category: DenialCategory }) {
  const { icon: Icon, className } = CATEGORY_STYLES[category];
  return (
    <Badge variant="secondary" className={cn("gap-1.5 rounded-md border-transparent px-2 py-1 text-xs font-semibold whitespace-nowrap", className)}>
      <Icon className="size-3.5" aria-hidden />
      {category}
    </Badge>
  );
}
