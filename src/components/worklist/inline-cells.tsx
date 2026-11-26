"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_STYLES } from "@/components/shared/status-badge";
import { CLAIM_ACTIONS, SUBMITTED_STATUSES, type ClaimAction, type SubmittedStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Cells that edit in place. The row opens the claim panel on click, so every cell stops the click (and key)
 * from reaching it; menus are portalled, but React events still bubble through them to the row.
 */
function Isolated({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

/** The Action as a coloured badge that is also its own dropdown. */
export function ActionSelect({ value, onChange }: { value: ClaimAction; onChange: (next: ClaimAction) => void }) {
  return (
    <Isolated>
      <Select value={value} onValueChange={(v) => onChange(v as ClaimAction)}>
        <SelectTrigger
          size="sm"
          aria-label={`Action: ${value}. Change`}
          className={cn(
            "h-7 w-auto gap-1.5 rounded-full border-transparent py-0 pr-1.5 pl-2.5 text-xs font-semibold shadow-none hover:brightness-95 dark:bg-transparent dark:hover:bg-transparent",
            ACTION_STYLES[value].badge,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CLAIM_ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              <span aria-hidden className={cn("size-2 rounded-full", ACTION_STYLES[a].dot)} />
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Isolated>
  );
}

const NOT_SUBMITTED = "none";

/** First / Second / Third, or empty ("Not submitted"). */
export function SubmittedSelect({
  value,
  onChange,
}: {
  value?: SubmittedStatus;
  onChange: (next: SubmittedStatus | undefined) => void;
}) {
  return (
    <Isolated>
      <Select value={value ?? NOT_SUBMITTED} onValueChange={(v) => onChange(v === NOT_SUBMITTED ? undefined : (v as SubmittedStatus))}>
        <SelectTrigger
          size="sm"
          aria-label={`Submitted Status: ${value ?? "Not submitted"}. Change`}
          className={cn("h-8 w-[8.5rem] bg-card text-[13px] shadow-none", !value && "text-muted-foreground")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOT_SUBMITTED}>Not submitted</SelectItem>
          {SUBMITTED_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Isolated>
  );
}

interface InlineTextCellProps {
  /** Raw text shown in the box while editing. */
  value: string;
  /** What the cell looks like when not editing. */
  display: React.ReactNode;
  /** Called with the trimmed text when the user presses Enter or leaves the box (only if it changed). */
  onCommit: (next: string) => void;
  label: string;
  placeholder?: string;
  inputMode?: "text" | "decimal";
  align?: "left" | "right";
}

/** Click to edit, Enter or click away to save, Escape to cancel. */
export function InlineTextCell({ value, display, onCommit, label, placeholder, inputMode = "text", align = "left" }: InlineTextCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const finish = (save: boolean) => {
    setEditing(false);
    const next = draft.trim();
    if (save && next !== value.trim()) onCommit(next);
  };

  return (
    <Isolated className={align === "right" ? "flex justify-end" : undefined}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          inputMode={inputMode}
          aria-label={label}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") finish(true);
            if (e.key === "Escape") finish(false);
          }}
          className={cn(
            "h-8 w-32 rounded-md border border-ring bg-card px-2 text-sm tabular-nums outline-none ring-3 ring-ring/30",
            align === "right" && "text-right",
          )}
        />
      ) : (
        <button
          type="button"
          aria-label={`Edit ${label}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className={cn(
            "-mx-2 min-w-16 rounded-md border border-transparent px-2 py-1 text-sm transition-colors outline-none hover:border-input hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/50",
            align === "right" ? "text-right" : "text-left",
          )}
        >
          {display}
        </button>
      )}
    </Isolated>
  );
}
