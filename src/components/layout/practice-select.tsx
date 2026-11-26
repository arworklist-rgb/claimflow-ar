"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

/** Global practice scope. Bound to the store so the worklist follows it. */
export function PracticeSelect({ className }: { className?: string }) {
  const practices = useDemoStore((s) => s.practices);
  const selected = useDemoStore((s) => s.selectedPracticeId);
  const setSelected = useDemoStore((s) => s.setSelectedPractice);

  // A persisted id can briefly outlive its practice; fall back to "all".
  const value = practices.some((p) => p.id === selected) ? selected : ALL_PRACTICES;

  return (
    <Select value={value} onValueChange={setSelected}>
      <SelectTrigger
        aria-label="Practice"
        className={cn(
          "w-48 xl:w-56 border-white/15 bg-white/10 font-semibold text-white shadow-none transition-colors hover:bg-white/15 data-[state=open]:bg-white/15 dark:bg-white/10 dark:hover:bg-white/15 [&_svg]:text-white/70",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={ALL_PRACTICES}>All Practices</SelectItem>
        {practices.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
