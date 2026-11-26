"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, UserRoundX } from "lucide-react";
import { StaffChip } from "@/components/shared/staff-chip";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AssigneeCellProps {
  label: string;
  /** Everyone, so a deactivated assignee can still be shown. */
  users: User[];
  value?: string;
  onChange: (userId: string | null) => void;
}

/** Click-to-reassign staff cell: shows the assignee, opens a searchable list of active users. */
export function AssigneeCell({ label, users, value, onChange }: AssigneeCellProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = users.find((u) => u.id === value);
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.status === "Active")
      .filter((u) => !q || `${u.name} ${u.role}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, query]);

  const choose = (userId: string | null) => {
    if (userId !== (value ?? null)) onChange(userId);
    setOpen(false);
    setQuery("");
  };

  return (
    // The popover is portalled but React events still bubble to the table row, which opens the claim panel.
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${label}: ${current?.name ?? "unassigned"}. Change`}
            className={cn(
              "group/assign -mx-2 flex w-full max-w-44 items-center justify-between gap-1.5 rounded-md border border-transparent px-2 py-1 text-left text-sm transition-colors outline-none hover:border-input hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/50",
              open && "border-input bg-card",
            )}
          >
            {current ? (
              <StaffChip user={current} />
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/assign:opacity-100 group-focus-visible/assign:opacity-100" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="relative border-b p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && options[0]) {
                  e.preventDefault();
                  choose(options[0].id);
                }
              }}
              placeholder="Search staff"
              aria-label={`Search staff for ${label}`}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <ul role="listbox" aria-label={`${label} staff`} className="max-h-60 overflow-y-auto p-1">
            {options.map((u) => (
              <li key={u.id} role="option" aria-selected={u.id === value}>
                <button
                  type="button"
                  onClick={() => choose(u.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  <span className="flex min-w-0 flex-col">
                    <StaffChip user={u} />
                    <span className="pl-8 text-xs text-muted-foreground">{u.role}</span>
                  </span>
                  {u.id === value && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                </button>
              </li>
            ))}
            {options.length === 0 && <li className="px-2 py-4 text-center text-sm text-muted-foreground">No active staff match.</li>}
          </ul>
          {current && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => choose(null)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted"
              >
                <UserRoundX className="size-4" aria-hidden /> Clear {label}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
