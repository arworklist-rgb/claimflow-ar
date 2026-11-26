"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Practice, Status } from "@/lib/types";

interface PracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Practice being edited; null/undefined means "add". */
  practice?: Practice | null;
}

export function PracticeDialog({ open, onOpenChange, practice }: PracticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        {/* The form mounts fresh every time the dialog opens, so its state always starts from `practice`. */}
        <PracticeForm practice={practice ?? null} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PracticeForm({ practice, onDone }: { practice: Practice | null; onDone: () => void }) {
  const practices = useDemoStore((s) => s.practices);
  const users = useDemoStore((s) => s.users);
  const addPractice = useDemoStore((s) => s.addPractice);
  const updatePractice = useDemoStore((s) => s.updatePractice);

  const [name, setName] = useState(practice?.name ?? "");
  const [npi, setNpi] = useState(practice?.npi ?? "");
  const [status, setStatus] = useState<Status>(practice?.status ?? "Active");
  const [userIds, setUserIds] = useState<Set<string>>(new Set(practice?.userIds ?? []));
  const [userQuery, setUserQuery] = useState("");
  const [errors, setErrors] = useState<{ name?: string; npi?: string }>({});

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
  }, [users, userQuery]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const trimmed = name.trim();
    if (trimmed.length < 2) next.name = "Enter a practice name (at least 2 characters).";
    else if (practices.some((p) => p.id !== practice?.id && p.name.toLowerCase() === trimmed.toLowerCase())) {
      next.name = "A practice with this name already exists.";
    }
    if (npi.trim() && !/^\d{10}$/.test(npi.trim())) next.npi = "NPI must be exactly 10 digits.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = { name: trimmed, npi: npi.trim(), status, userIds: [...userIds] };
    if (practice) {
      updatePractice(practice.id, input);
      toast.success(`${trimmed} updated`);
    } else {
      const created = addPractice(input);
      toast.success(`${created.name} added as ${created.code}`);
    }
    onDone();
  };

  const toggleUser = (id: string, checked: boolean) =>
    setUserIds((cur) => {
      const next = new Set(cur);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <form onSubmit={submit} noValidate className="flex max-h-[90vh] flex-col">
      <DialogHeader className="border-b p-5">
        <DialogTitle>{practice ? "Edit practice" : "Add practice"}</DialogTitle>
        <DialogDescription>
          {practice
            ? `Update details and user access for ${practice.code}.`
            : "Create a practice and choose which users can work its claims."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="space-y-2">
          <Label htmlFor="practice-name">
            Practice Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="practice-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Harbor Pediatrics"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "practice-name-error" : undefined}
            autoFocus
          />
          {errors.name && (
            <p id="practice-name-error" role="alert" className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="practice-npi">
              NPI <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="practice-npi"
              value={npi}
              onChange={(e) => setNpi(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit NPI"
              className="font-mono"
              aria-invalid={!!errors.npi}
              aria-describedby={errors.npi ? "practice-npi-error" : undefined}
            />
            {errors.npi && (
              <p id="practice-npi-error" role="alert" className="text-sm text-destructive">
                {errors.npi}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger id="practice-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="text-sm leading-none font-medium">Assigned Users</legend>
            <span className="text-xs text-muted-foreground">{userIds.size} selected</span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users…"
              aria-label="Search users"
              className="pl-9"
            />
          </div>
          <ul className="max-h-52 divide-y overflow-y-auto rounded-lg border">
            {filteredUsers.length === 0 && (
              <li className="p-4 text-center text-sm text-muted-foreground">No users match “{userQuery}”.</li>
            )}
            {filteredUsers.map((u) => (
              <li key={u.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/60">
                  <Checkbox checked={userIds.has(u.id)} onCheckedChange={(v) => toggleUser(u.id, v === true)} />
                  <UserAvatar user={u} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.role}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>

      <DialogFooter className="border-t p-5">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{practice ? "Save changes" : "Add practice"}</Button>
      </DialogFooter>
    </form>
  );
}
