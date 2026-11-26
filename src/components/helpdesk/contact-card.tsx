"use client";

import { Building2, Clock, Copy, ExternalLink, Globe, Headset, Mail, Pencil, Phone, Trash2, UserRound, Workflow, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { copyText } from "@/lib/clipboard";
import type { HelpCategory, HelpContact } from "@/lib/types";
import { cn } from "@/lib/utils";

// Full class names are listed (not interpolated) so Tailwind can see them.
export const CATEGORY_STYLES: Record<HelpCategory, { icon: LucideIcon; badge: string; tile: string }> = {
  Payer: { icon: Building2, badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", tile: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  Clearinghouse: { icon: Workflow, badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300", tile: "bg-violet-500/10 text-violet-600 dark:text-violet-300" },
  Practice: { icon: Headset, badge: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300", tile: "bg-teal-500/10 text-teal-600 dark:text-teal-300" },
  Internal: { icon: UserRound, badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300", tile: "bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  Other: { icon: Globe, badge: "bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300", tile: "bg-slate-500/10 text-slate-600 dark:text-slate-300" },
};

export function CategoryPill({ category }: { category: HelpCategory }) {
  return (
    <Badge variant="secondary" className={cn("rounded-md border-transparent px-2 py-0.5 text-xs font-semibold", CATEGORY_STYLES[category].badge)}>
      {category}
    </Badge>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} onClick={() => copyText(text, "Copied")} className="text-muted-foreground hover:text-foreground">
          <Copy />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy</TooltipContent>
    </Tooltip>
  );
}

interface ContactCardProps {
  contact: HelpContact;
  practiceName?: string;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, practiceName, canManage, onEdit, onDelete }: ContactCardProps) {
  const { icon: Icon, tile } = CATEGORY_STYLES[contact.category];
  const hostname = (() => {
    try {
      return contact.website ? new URL(contact.website).hostname.replace(/^www\./, "") : "";
    } catch {
      return contact.website ?? "";
    }
  })();

  return (
    <article
      aria-label={contact.name}
      data-testid="help-card"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,31,61,0.04),0_4px_12px_rgba(15,31,61,0.04)]"
    >
      <header className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tile)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-bold tracking-tight">{contact.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <CategoryPill category={contact.category} />
            <span className="text-xs text-muted-foreground">{practiceName ?? "All practices"}</span>
          </div>
        </div>
        {canManage && (
          <div className="-mt-1 -mr-1.5 flex shrink-0 gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${contact.name}`} onClick={onEdit}>
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${contact.name}`} onClick={onDelete} className="hover:text-destructive">
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </header>

      {contact.phones.length > 0 && (
        <ul className="space-y-1.5" aria-label="Phone numbers">
          {contact.phones.map((p) => {
            const full = p.ext ? `${p.number} ext. ${p.ext}` : p.number;
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-muted/50 py-1 pr-1 pl-2.5 text-sm">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] leading-tight font-semibold tracking-wide text-muted-foreground uppercase">{p.type || "Phone"}</span>
                  <a href={`tel:${p.number.replace(/[^\d+]/g, "")}`} className="font-medium tabular-nums hover:text-primary hover:underline">
                    {p.number}
                  </a>
                  {p.ext && <span className="text-muted-foreground tabular-nums"> ext. {p.ext}</span>}
                </span>
                <CopyButton text={full} label={`Copy ${p.type || "phone"} number ${full}`} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-1.5 text-sm">
        {contact.email && (
          <p className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <a href={`mailto:${contact.email}`} className="min-w-0 flex-1 truncate hover:text-primary hover:underline">
              {contact.email}
            </a>
            <CopyButton text={contact.email} label={`Copy email ${contact.email}`} />
          </p>
        )}
        {contact.website && (
          <p className="flex items-center gap-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 truncate text-primary hover:underline"
            >
              {hostname}
              <ExternalLink className="size-3 shrink-0" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        )}
        {contact.hours && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {contact.hours}
          </p>
        )}
      </div>

      {contact.notes && <p className="mt-auto border-t pt-3 text-[13px] leading-relaxed text-muted-foreground">{contact.notes}</p>}
    </article>
  );
}
