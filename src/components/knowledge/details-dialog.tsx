"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/lib/store/demo-store";
import { KNOWLEDGE_CATEGORIES, type KnowledgeCategory, type KnowledgeDoc } from "@/lib/types";

export function DetailsDialog({ doc, onClose }: { doc: KnowledgeDoc | null; onClose: () => void }) {
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">{doc && <DetailsForm key={doc.id} doc={doc} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function DetailsForm({ doc, onClose }: { doc: KnowledgeDoc; onClose: () => void }) {
  const updateKnowledgeDoc = useDemoStore((s) => s.updateKnowledgeDoc);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState<KnowledgeCategory>(doc.category);
  const [description, setDescription] = useState(doc.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    updateKnowledgeDoc(doc.id, { title: title.trim(), category, description: description.trim() || undefined });
    toast.success("Document details updated");
    onClose();
  };

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader className="border-b p-5">
        <DialogTitle>Edit details</DialogTitle>
        <DialogDescription className="truncate">{doc.fileName}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="kd-edit-title">Title</Label>
          <Input id="kd-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!error} autoFocus />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="kd-edit-category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as KnowledgeCategory)}>
            <SelectTrigger id="kd-edit-category" className="w-full">
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
        <div className="space-y-2">
          <Label htmlFor="kd-edit-desc">Description</Label>
          <Textarea id="kd-edit-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t p-5">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
}
