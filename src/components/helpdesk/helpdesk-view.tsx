"use client";

import { useMemo, useState } from "react";
import { LifeBuoy, Lock, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledSelect } from "@/components/shared/labeled-select";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pluralize } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useIsAdmin } from "@/lib/store/selectors";
import { HELP_CATEGORIES, type HelpContact } from "@/lib/types";
import { ContactCard } from "./contact-card";
import { ContactDialog } from "./contact-dialog";

export function HelpdeskView() {
  const contacts = useDemoStore((s) => s.helpContacts);
  const practices = useDemoStore((s) => s.practices);
  const deleteHelpContact = useDemoStore((s) => s.deleteHelpContact);
  const isAdmin = useIsAdmin();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [dialog, setDialog] = useState<{ contact: HelpContact | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HelpContact | null>(null);

  const practiceName = (id?: string) => practices.find((p) => p.id === id)?.name;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      const haystack = [c.name, c.email, c.website, c.hours, c.notes, practiceName(c.practiceId), ...c.phones.flatMap((p) => [p.type, p.number])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- practiceName only reads `practices`
  }, [contacts, category, query, practices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="HelpDesk"
        description="Phone numbers, portals and notes for payers, clearinghouses and your own team, all in one place."
        actions={
          isAdmin ? (
            <Button size="lg" onClick={() => setDialog({ contact: null })}>
              <Plus aria-hidden /> Add contact
            </Button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <p role="note" className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Only admins can add or edit HelpDesk contacts.
        </p>
      )}

      <Card className="flex-row flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
        <div className="relative w-full min-w-0 sm:min-w-64 sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, phone numbers or notes"
            aria-label="Search contacts"
            className="bg-card pl-9"
          />
        </div>
        <LabeledSelect
          label="Category:"
          value={category}
          onValueChange={setCategory}
          className="w-60"
          options={[{ value: "all", label: "All" }, ...HELP_CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {shown.length} {pluralize(shown.length, "contact")}
        </p>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={LifeBuoy}
            title="No contacts found"
            description={contacts.length === 0 ? "Nothing has been added to the HelpDesk yet." : "Try a different search term, or clear the category filter."}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              practiceName={practiceName(c.practiceId)}
              canManage={isAdmin}
              onEdit={() => setDialog({ contact: c })}
              onDelete={() => setPendingDelete(c)}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <ContactDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} contact={dialog?.contact ?? null} />
          <ConfirmDialog
            open={!!pendingDelete}
            onOpenChange={(o) => !o && setPendingDelete(null)}
            title={`Delete ${pendingDelete?.name ?? "contact"}?`}
            description="This removes the card for everyone. You can restore the original contacts any time from Reset demo data."
            confirmLabel="Delete"
            onConfirm={() => {
              if (!pendingDelete) return;
              deleteHelpContact(pendingDelete.id);
              toast.success(`${pendingDelete.name} deleted`);
            }}
          />
        </>
      )}
    </div>
  );
}
