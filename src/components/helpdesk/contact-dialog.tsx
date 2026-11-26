"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { normalizeWebsite } from "@/lib/clipboard";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { HELP_CATEGORIES, type HelpCategory, type HelpContact, type HelpPhone } from "@/lib/types";

const ALL = "all";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Contact being edited; null means "add". */
  contact: HelpContact | null;
}

export function ContactDialog({ open, onOpenChange, contact }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-xl">
        <ContactForm key={contact?.id ?? "new"} contact={contact} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

const blankPhone = (): HelpPhone => ({ id: uid("ph"), type: "", number: "", ext: "" });

function ContactForm({ contact, onDone }: { contact: HelpContact | null; onDone: () => void }) {
  const practices = useDemoStore((s) => s.practices);
  const addHelpContact = useDemoStore((s) => s.addHelpContact);
  const updateHelpContact = useDemoStore((s) => s.updateHelpContact);

  const [name, setName] = useState(contact?.name ?? "");
  const [category, setCategory] = useState<HelpCategory>(contact?.category ?? "Payer");
  const [practiceId, setPracticeId] = useState(contact?.practiceId ?? ALL);
  const [phones, setPhones] = useState<HelpPhone[]>(contact?.phones.length ? contact.phones.map((p) => ({ ...p })) : [blankPhone()]);
  const [email, setEmail] = useState(contact?.email ?? "");
  const [website, setWebsite] = useState(contact?.website ?? "");
  const [hours, setHours] = useState(contact?.hours ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string; website?: string }>({});

  const setPhone = (id: string, patch: Partial<HelpPhone>) => setPhones((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Enter a name.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    const site = normalizeWebsite(website);
    if (website.trim() && !site) next.website = "Enter a valid web address (http or https).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = {
      name: name.trim(),
      category,
      practiceId: practiceId === ALL ? undefined : practiceId,
      // Blank rows are dropped.
      phones: phones
        .filter((p) => p.number.trim())
        .map((p) => ({ id: p.id, type: p.type.trim(), number: p.number.trim(), ext: p.ext?.trim() || undefined })),
      email: email.trim() || undefined,
      website: site,
      hours: hours.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (contact) {
      updateHelpContact(contact.id, input);
      toast.success(`${input.name} updated`);
    } else {
      addHelpContact(input);
      toast.success(`${input.name} added to HelpDesk`);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b p-5">
        <DialogTitle>{contact ? `Edit ${contact.name}` : "Add contact"}</DialogTitle>
        <DialogDescription>Phone numbers, links and notes your team can look up and copy.</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <div className="space-y-2">
          <Label htmlFor="hc-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input id="hc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aetna" aria-invalid={!!errors.name} autoFocus />
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hc-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as HelpCategory)}>
              <SelectTrigger id="hc-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HELP_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hc-practice">Practice</Label>
            <Select value={practiceId} onValueChange={setPracticeId}>
              <SelectTrigger id="hc-practice" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All practices</SelectItem>
                {practices.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Phone numbers</legend>
          {phones.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_1.2fr_5rem_auto]">
              <Input aria-label={`Phone ${i + 1} type`} placeholder="Type (e.g. Claims)" value={p.type} onChange={(e) => setPhone(p.id, { type: e.target.value })} />
              <Input
                aria-label={`Phone ${i + 1} number`}
                placeholder="(800) 555-0100"
                inputMode="tel"
                value={p.number}
                onChange={(e) => setPhone(p.id, { number: e.target.value })}
                className="max-sm:col-span-1"
              />
              <Input aria-label={`Phone ${i + 1} extension`} placeholder="Ext" value={p.ext ?? ""} onChange={(e) => setPhone(p.id, { ext: e.target.value })} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove phone ${i + 1}`}
                onClick={() => setPhones((list) => (list.length > 1 ? list.filter((x) => x.id !== p.id) : [blankPhone()]))}
                className="hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setPhones((list) => [...list, blankPhone()])}>
            <Plus aria-hidden /> Add phone
          </Button>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hc-email">Email</Label>
            <Input id="hc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" aria-invalid={!!errors.email} />
            {errors.email && (
              <p role="alert" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hc-website">Website / portal</Label>
            <Input id="hc-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://portal.example.com" aria-invalid={!!errors.website} />
            {errors.website && (
              <p role="alert" className="text-sm text-destructive">
                {errors.website}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hc-hours">Hours</Label>
          <Input id="hc-hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon–Fri, 8am–5pm ET" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hc-notes">Notes</Label>
          <Textarea id="hc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Filing limits, who to ask for, what to have ready…" />
        </div>
      </div>

      <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t p-5">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{contact ? "Save changes" : "Add contact"}</Button>
      </DialogFooter>
    </form>
  );
}
