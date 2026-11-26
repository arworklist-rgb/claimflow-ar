"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, pluralize } from "@/lib/format";
import { extOf, titleFromFileName } from "@/lib/knowledge/files";
import { KNOWLEDGE_CATEGORIES, type KnowledgeCategory } from "@/lib/types";
import { FileTypeIcon } from "./file-type-icon";

export interface UploadDraft {
  key: string;
  file: File;
  title: string;
  category: KnowledgeCategory;
  description: string;
}

export const makeDrafts = (files: File[]): UploadDraft[] =>
  files.map((file, i) => ({
    key: `${file.name}-${file.size}-${i}`,
    file,
    title: titleFromFileName(file.name),
    category: "Other",
    description: "",
  }));

interface UploadDialogProps {
  drafts: UploadDraft[] | null;
  onCancel: () => void;
  onConfirm: (drafts: UploadDraft[]) => Promise<void>;
}

/** Asks for a title (defaults to the file name), a category and an optional description for each chosen file. */
export function UploadDialog({ drafts, onCancel, onConfirm }: UploadDialogProps) {
  return (
    <Dialog open={!!drafts} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-2xl">
        {drafts && <UploadForm key={drafts.map((d) => d.key).join("|")} initial={drafts} onCancel={onCancel} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

function UploadForm({ initial, onCancel, onConfirm }: { initial: UploadDraft[]; onCancel: () => void; onConfirm: (d: UploadDraft[]) => Promise<void> }) {
  const [drafts, setDrafts] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (key: string, p: Partial<UploadDraft>) => setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...p } : d)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (drafts.some((d) => !d.title.trim())) {
      setError("Every document needs a title.");
      return;
    }
    setSaving(true);
    try {
      await onConfirm(drafts.map((d) => ({ ...d, title: d.title.trim(), description: d.description.trim() })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b p-5">
        <DialogTitle>
          Add {drafts.length} {pluralize(drafts.length, "document")}
        </DialogTitle>
        <DialogDescription>Give each file a title and a category so your team can find it.</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {drafts.map((d, i) => (
          <fieldset key={d.key} className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <legend className="sr-only">{d.file.name}</legend>
            <div className="flex items-center gap-3">
              <FileTypeIcon ext={extOf(d.file.name)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={d.file.name}>
                  {d.file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatBytes(d.file.size)}</p>
              </div>
              {drafts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${d.file.name}`}
                  onClick={() => setDrafts((list) => list.filter((x) => x.key !== d.key))}
                >
                  <X />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="space-y-1.5">
                <Label htmlFor={`kd-title-${i}`}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input id={`kd-title-${i}`} value={d.title} onChange={(e) => patch(d.key, { title: e.target.value })} className="bg-card" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`kd-category-${i}`}>Category</Label>
                <Select value={d.category} onValueChange={(v) => patch(d.key, { category: v as KnowledgeCategory })}>
                  <SelectTrigger id={`kd-category-${i}`} className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWLEDGE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`kd-desc-${i}`}>
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id={`kd-desc-${i}`} rows={2} value={d.description} onChange={(e) => patch(d.key, { description: e.target.value })} className="bg-card" />
            </div>
          </fieldset>
        ))}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t p-5">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || drafts.length === 0}>
          {saving && <Loader2 className="animate-spin" aria-hidden />}
          {saving ? "Uploading…" : `Upload ${drafts.length} ${pluralize(drafts.length, "document")}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
