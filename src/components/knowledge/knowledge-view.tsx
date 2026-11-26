"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Download, Eye, FileText, LifeBuoy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledSelect } from "@/components/shared/labeled-select";
import { PageHeader } from "@/components/shared/page-header";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/use-auth";
import { HelpGuideTab } from "./help-guide-tab";
import { formatBytes, formatDate, pluralize } from "@/lib/format";
import { deleteKnowledgeFile, loadKnowledgeFile, saveKnowledgeFile } from "@/lib/knowledge/file-store";
import { downloadBlob, extOf, KNOWLEDGE_FILE_RULES, mimeOf, validateKnowledgeFile } from "@/lib/knowledge/files";
import { ensureSeedFiles } from "@/lib/knowledge/seed-files";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser } from "@/lib/store/selectors";
import { useStoreHydrated } from "@/lib/store/use-store-hydrated";
import { KNOWLEDGE_CATEGORIES, type KnowledgeCategory, type KnowledgeDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DetailsDialog } from "./details-dialog";
import { FileTypeIcon } from "./file-type-icon";
import { PreviewDialog } from "./preview-dialog";
import { makeDrafts, UploadDialog, type UploadDraft } from "./upload-dialog";

const CATEGORY_STYLES: Record<KnowledgeCategory, string> = {
  SOP: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Payer Guidelines": "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Templates: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  Training: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Other: "bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300",
};

export function KnowledgeView() {
  const hydrated = useStoreHydrated();
  const docs = useDemoStore((s) => s.knowledgeDocs);
  const addKnowledgeDocs = useDemoStore((s) => s.addKnowledgeDocs);
  const deleteKnowledgeDoc = useDemoStore((s) => s.deleteKnowledgeDoc);
  const setKnowledgeDocSize = useDemoStore((s) => s.setKnowledgeDocSize);
  const currentUser = useCurrentUser();
  const { userId, can } = useAuth();
  const isAdmin = can("documents.manage");

  const [category, setCategory] = useState("all");
  const [drafts, setDrafts] = useState<UploadDraft[] | null>(null);
  const [previewing, setPreviewing] = useState<KnowledgeDoc | null>(null);
  const [editing, setEditing] = useState<KnowledgeDoc | null>(null);
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDoc | null>(null);

  // The sample documents are real files: make sure they exist in IndexedDB (once the saved state has loaded).
  const seeded = useRef(false);
  useEffect(() => {
    if (!hydrated || seeded.current) return;
    seeded.current = true;
    void ensureSeedFiles(docs)
      .then((created) => created.forEach(({ id, size }) => setKnowledgeDocSize(id, size)))
      .catch(() => toast.error("Couldn't create the sample documents in this browser."));
  }, [hydrated, docs, setKnowledgeDocSize]);

  const canChange = (d: KnowledgeDoc) => isAdmin || d.uploadedById === userId || d.uploadedById === currentUser.id;

  const handleFiles = (files: File[]) => {
    const good: File[] = [];
    const bad: string[] = [];
    for (const f of files) {
      const problem = validateKnowledgeFile(f);
      if (problem) bad.push(`${f.name}: ${problem}`);
      else good.push(f);
    }
    if (bad.length > 0) {
      toast.error(`${bad.length} ${pluralize(bad.length, "file")} skipped`, { description: bad.join("\n") });
    }
    if (good.length > 0) setDrafts(makeDrafts(good));
  };

  const confirmUpload = async (list: UploadDraft[]) => {
    const added: KnowledgeDoc[] = [];
    for (const d of list) {
      const ext = extOf(d.file.name);
      const id = uid("kd");
      try {
        await saveKnowledgeFile(id, new Blob([d.file], { type: mimeOf(ext) }));
      } catch {
        toast.error(`Couldn't store ${d.file.name} in this browser`);
        continue;
      }
      added.push({
        id,
        title: d.title,
        category: d.category,
        description: d.description || undefined,
        fileName: d.file.name,
        ext,
        mimeType: mimeOf(ext),
        size: d.file.size,
        uploadedById: currentUser.id,
        uploadedByName: currentUser.name,
        uploadedAt: new Date().toISOString(),
      });
    }
    if (added.length > 0) {
      addKnowledgeDocs(added);
      toast.success(`${added.length} ${pluralize(added.length, "document")} uploaded`);
    }
    setDrafts(null);
  };

  const download = async (d: KnowledgeDoc) => {
    const blob = await loadKnowledgeFile(d.id);
    if (!blob) {
      toast.error("That file isn't stored in this browser any more.");
      return;
    }
    downloadBlob(blob, d.fileName);
  };

  const columns = useMemo<Column<KnowledgeDoc>[]>(
    () => [
      {
        id: "title",
        header: "Document",
        sortValue: (d) => d.title,
        className: "min-w-72 max-w-md whitespace-normal",
        cell: (d) => (
          <div className="flex items-center gap-3">
            <FileTypeIcon ext={d.ext} />
            <div className="min-w-0">
              <p className="truncate font-semibold" title={d.title}>
                {d.title}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={d.description ?? d.fileName}>
                {d.description ?? d.fileName}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        sortValue: (d) => d.category,
        cell: (d) => (
          <Badge variant="secondary" className={cn("rounded-md border-transparent px-2 py-0.5 text-xs font-semibold whitespace-nowrap", CATEGORY_STYLES[d.category])}>
            {d.category}
          </Badge>
        ),
      },
      { id: "size", header: "Size", sortValue: (d) => d.size, className: "whitespace-nowrap tabular-nums", cell: (d) => (d.size ? formatBytes(d.size) : "—") },
      { id: "by", header: "Uploaded by", sortValue: (d) => d.uploadedByName, className: "whitespace-nowrap", cell: (d) => d.uploadedByName },
      { id: "date", header: "Uploaded", sortValue: (d) => d.uploadedAt, className: "whitespace-nowrap", cell: (d) => formatDate(d.uploadedAt) },
      {
        id: "actions",
        header: "Actions",
        headClassName: "text-center",
        cell: (d) => (
          <div className="flex items-center justify-center gap-0.5">
            <IconAction label={`Preview ${d.title}`} tip="Preview" onClick={() => setPreviewing(d)}>
              <Eye />
            </IconAction>
            <IconAction label={`Download ${d.title}`} tip="Download" onClick={() => void download(d)}>
              <Download />
            </IconAction>
            <IconAction
              label={`Edit details of ${d.title}`}
              tip={canChange(d) ? "Edit details" : "Only admins or the uploader can edit"}
              disabled={!canChange(d)}
              onClick={() => setEditing(d)}
            >
              <Pencil />
            </IconAction>
            <IconAction
              label={`Delete ${d.title}`}
              tip={canChange(d) ? "Delete" : "Only admins or the uploader can delete"}
              disabled={!canChange(d)}
              onClick={() => setPendingDelete(d)}
              danger
            >
              <Trash2 />
            </IconAction>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- canChange/download only read the current user and IndexedDB
    [currentUser.id, isAdmin],
  );

  const table = useDataTable({
    data: docs,
    columns,
    searchText: (d) => `${d.title} ${d.fileName} ${d.description ?? ""} ${d.uploadedByName} ${d.category}`,
    filter: (d) => category === "all" || d.category === category,
    filterKey: category,
    initialSort: { id: "date", dir: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Center"
        description="Complete A-to-Z user guide, role manuals, troubleshooting playbooks, and your team's SOP & document library."
      />

      <Tabs defaultValue="guide" className="space-y-6">
        <TabsList variant="line" className="h-11 w-full justify-start gap-2 border-b p-0">
          <TabsTrigger value="guide" className="h-full flex-none gap-2 px-4 text-sm font-semibold sm:text-[15px] data-active:text-primary">
            <LifeBuoy className="size-4" aria-hidden /> A-to-Z Help &amp; Guide
          </TabsTrigger>
          <TabsTrigger value="library" className="h-full flex-none gap-2 px-4 text-sm font-semibold sm:text-[15px] data-active:text-primary">
            <FileText className="size-4" aria-hidden /> Document Library ({docs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <HelpGuideTab />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card className="gap-3 p-5">
            <div>
              <h2 className="text-[15px] font-bold">Add documents</h2>
              <p className="text-[13px] text-muted-foreground">Everyone can upload and download. Only admins or the uploader can edit or delete a document.</p>
            </div>
            <FileDropzone
              size="compact"
              multiple
              rules={KNOWLEDGE_FILE_RULES}
              onFiles={handleFiles}
              title="Upload documents"
              hint="Word (.doc, .docx), Excel (.xls, .xlsx, .csv) or PDF · up to 10 MB each · choose several at once"
            />
          </Card>

          <DataTable
            table={table}
            columns={columns}
            getRowId={(d) => d.id}
            noun="documents"
            searchPlaceholder="Search by title, file name or uploader..."
            emptyState={
              <EmptyState
                icon={BookOpen}
                title="No documents found"
                description={docs.length === 0 ? "Upload your first document above." : "Try a different search term, or clear the category filter."}
              />
            }
            filters={
              <LabeledSelect
                label="Category:"
                value={category}
                onValueChange={setCategory}
                className="w-64"
                options={[{ value: "all", label: "All" }, ...KNOWLEDGE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
              />
            }
          />
        </TabsContent>
      </Tabs>

      <UploadDialog drafts={drafts} onCancel={() => setDrafts(null)} onConfirm={confirmUpload} />
      <PreviewDialog doc={previewing} onClose={() => setPreviewing(null)} />
      <DetailsDialog doc={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete “${pendingDelete?.title ?? "document"}”?`}
        description="The document is removed for everyone. This can't be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteKnowledgeFile(pendingDelete.id).catch(() => undefined);
          deleteKnowledgeDoc(pendingDelete.id);
          toast.success(`${pendingDelete.title} deleted`);
        }}
      />
    </div>
  );
}

function IconAction({
  label,
  tip,
  onClick,
  children,
  disabled,
  danger,
}: {
  label: string;
  tip: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A disabled button swallows pointer events, so the tooltip hangs off a wrapper. */}
        <span tabIndex={disabled ? 0 : -1} className="inline-flex">
          <Button variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick} className={cn(danger && "hover:text-destructive")}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
