"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { codeSortKey, shortDescription } from "@/lib/denial-codes";
import { useIsAdmin } from "@/lib/store/selectors";
import type { DenialCode } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Code first, then anything in the description: "16" lists code 16, then codes containing 16, then text matches. */
function filterCodes(value: string, search: string, keywords?: string[]): number {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  const code = value.toLowerCase();
  if (code === q) return 1;
  if (code.startsWith(q)) return 0.9;
  if (code.includes(q)) return 0.7;
  return (keywords ?? []).join(" ").toLowerCase().includes(q) ? 0.5 : 0;
}

interface CodeListProps {
  /** Codes that can be picked (callers pass only the active ones). */
  options: DenialCode[];
  selected: string[];
  onToggle: (code: string) => void;
  footer?: React.ReactNode;
  label: string;
}

/** Searchable, multi-select list of denial codes: "16 · Claim/service lacks information...". */
export function DenialCodeCommand({ options, selected, onToggle, footer, label }: CodeListProps) {
  const sorted = useMemo(() => [...options].sort((a, b) => codeSortKey(a.code).localeCompare(codeSortKey(b.code))), [options]);
  return (
    // `label` names the search box for screen readers (cmdk ties it to the input).
    <Command filter={filterCodes} loop label={label}>
      <CommandInput placeholder="Search by code or description" autoFocus />
      <CommandList>
        <CommandEmpty>No denial codes match.</CommandEmpty>
        <CommandGroup>
          {sorted.map((c) => {
            const on = selected.includes(c.code);
            return (
              <CommandItem
                key={c.id}
                value={c.code}
                keywords={[c.description]}
                onSelect={() => onToggle(c.code)}
                aria-label={`${c.code} · ${shortDescription(c.description)}`}
              >
                <Check className={cn("size-4 text-primary", on ? "opacity-100" : "opacity-0")} aria-hidden />
                <span className="w-11 shrink-0 font-mono text-[13px] font-semibold">{c.code}</span>
                <span className="truncate text-muted-foreground">{shortDescription(c.description)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      {footer}
    </Command>
  );
}

function CodeChip({ code, record, onRemove }: { code: string; record?: DenialCode; onRemove?: () => void }) {
  const inactive = record?.status === "Inactive";
  const tip = !record ? "Unknown code" : inactive ? `Inactive · ${shortDescription(record.description)}` : shortDescription(record.description);
  return (
    <span
      data-testid="denial-chip"
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/70 pl-1.5 font-mono text-xs font-semibold",
        onRemove ? "pr-0.5" : "pr-1.5",
        inactive && "border-dashed bg-transparent text-muted-foreground line-through decoration-muted-foreground/50",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{code}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left leading-snug">{tip}</TooltipContent>
      </Tooltip>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${code}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded p-0.5 text-muted-foreground transition-colors outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </span>
  );
}

interface DenialCodesCellProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Every code in the store: inactive ones that are already on the claim still show, greyed. */
  codes: DenialCode[];
  /** Chips shown before collapsing into "+N". Use Infinity to show all and wrap. */
  max?: number;
  className?: string;
}

/**
 * Click to open a searchable list and add or remove codes; each chip also has its own x. Anyone can edit
 * the codes on a claim; only admins create new codes (in Settings), so the footer just points there.
 */
export function DenialCodesCell({ value, onChange, codes, max = 2, className }: DenialCodesCellProps) {
  const [open, setOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const byCode = useMemo(() => new Map(codes.map((c) => [c.code, c])), [codes]);
  const active = useMemo(() => codes.filter((c) => c.status === "Active"), [codes]);

  const shown = value.slice(0, max);
  const rest = value.slice(max);
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Denial codes: ${value.length ? value.join(", ") : "none"}. Edit`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className={cn(
            "group/codes flex min-h-8 min-w-36 cursor-pointer items-center gap-1 rounded-md border border-transparent px-2 py-1 transition-colors outline-none hover:border-input hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/50",
            max === Infinity ? "flex-wrap" : "flex-nowrap",
            open && "border-input bg-card",
            className,
          )}
        >
          {shown.map((code) => (
            <CodeChip key={code} code={code} record={byCode.get(code)} onRemove={() => onChange(value.filter((c) => c !== code))} />
          ))}
          {rest.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">+{rest.length}</span>
              </TooltipTrigger>
              <TooltipContent>{rest.join(", ")}</TooltipContent>
            </Tooltip>
          )}
          {value.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Plus className="size-3.5" aria-hidden /> Add code
            </span>
          ) : (
            <Plus className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/codes:opacity-100" aria-hidden />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-[26rem] max-w-[calc(100vw-2rem)]" align="start" onClick={(e) => e.stopPropagation()}>
        <DenialCodeCommand
          label="Search denial codes"
          options={active}
          selected={value}
          onToggle={toggle}
          footer={
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              {isAdmin ? (
                <>
                  Need a new code?{" "}
                  <Link href="/settings/denial-codes" className="font-semibold text-primary hover:underline">
                    Add it in Settings
                  </Link>
                  .
                </>
              ) : (
                "Admins add new denial codes in Settings."
              )}
            </p>
          }
        />
      </PopoverContent>
    </Popover>
  );
}

interface DenialCodeFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Active codes, plus any inactive ones still on claims in view. */
  options: DenialCode[];
}

/** Worklist filter: pick one or more codes; claims that have any of them stay. */
export function DenialCodeFilter({ value, onChange, options }: DenialCodeFilterProps) {
  const [open, setOpen] = useState(false);
  const summary = value.length === 0 ? "Any" : value.length <= 2 ? value.join(", ") : `${value.length} codes`;
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Denial Code filter: ${summary}`}
          className="flex h-9 w-52 items-center justify-between gap-1.5 rounded-[min(var(--radius-md),10px)] border border-input bg-card py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:w-full"
        >
          <span className="text-muted-foreground">Denial Code:</span>
          <span className="min-w-0 flex-1 truncate text-left font-mono text-[13px]">{summary}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[26rem] max-w-[calc(100vw-2rem)]" align="start">
        <DenialCodeCommand
          label="Filter by denial code"
          options={options}
          selected={value}
          onToggle={toggle}
          footer={
            value.length > 0 ? (
              <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
                <span className="text-muted-foreground">{value.length} selected</span>
                <button type="button" onClick={() => onChange([])} className="font-semibold text-primary hover:underline">
                  Clear
                </button>
              </div>
            ) : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}
