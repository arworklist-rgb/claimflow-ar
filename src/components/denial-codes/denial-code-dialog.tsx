"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/lib/store/demo-store";
import { DENIAL_CATEGORIES, type DenialCategory, type DenialCode, type Status } from "@/lib/types";

interface DenialCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Code being edited; null/undefined means "add". */
  code?: DenialCode | null;
}

export function DenialCodeDialog({ open, onOpenChange, code }: DenialCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <CodeForm key={code?.id ?? "new"} item={code ?? null} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CodeForm({ item, onDone }: { item: DenialCode | null; onDone: () => void }) {
  const codes = useDemoStore((s) => s.denialCodes);
  const addDenialCode = useDemoStore((s) => s.addDenialCode);
  const updateDenialCode = useDemoStore((s) => s.updateDenialCode);

  const [code, setCode] = useState(item?.code ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState<DenialCategory>(item?.category ?? "Other");
  const [status, setStatus] = useState<Status>(item?.status ?? "Active");
  const [errors, setErrors] = useState<{ code?: string; description?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const trimmedCode = code.trim().toUpperCase();
    const trimmedDescription = description.trim();

    if (!trimmedCode) next.code = "Enter a denial code.";
    else if (/\s/.test(trimmedCode)) next.code = "Codes can't contain spaces (e.g. 16 or B10).";
    else if (codes.some((r) => r.id !== item?.id && r.code.toLowerCase() === trimmedCode.toLowerCase())) {
      next.code = `${trimmedCode} already exists. Codes must be unique.`;
    }
    if (trimmedDescription.length < 3) next.description = "Enter a description (at least 3 characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input = { code: trimmedCode, description: trimmedDescription, category, status };
    if (item) {
      updateDenialCode(item.id, input);
      toast.success(`${trimmedCode} updated`);
    } else {
      addDenialCode(input);
      toast.success(`${trimmedCode} added`);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader className="border-b p-5">
        <DialogTitle>{item ? `Edit denial code ${item.code}` : "Add denial code"}</DialogTitle>
        <DialogDescription>
          {item ? "Update this denial code's details." : "Add a denial code that users can pick on worklist claims."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="denial-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="denial-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 16 or B10"
              className="font-mono uppercase placeholder:normal-case"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "denial-code-error" : undefined}
              autoFocus
            />
            {errors.code && (
              <p id="denial-code-error" role="alert" className="text-sm text-destructive">
                {errors.code}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="denial-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger id="denial-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="denial-description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="denial-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Claim/service lacks information or has submission/billing error(s)."
            rows={6}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "denial-description-error" : undefined}
          />
          {errors.description && (
            <p id="denial-description-error" role="alert" className="text-sm text-destructive">
              {errors.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="denial-category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as DenialCategory)}>
            <SelectTrigger id="denial-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DENIAL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="border-t p-5">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{item ? "Save changes" : "Add code"}</Button>
      </DialogFooter>
    </form>
  );
}
