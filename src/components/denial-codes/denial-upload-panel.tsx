"use client";

import { useMemo } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileChip } from "@/components/upload/file-chip";
import { FileDropzone } from "@/components/upload/file-dropzone";
import type { useSpreadsheetUpload } from "@/components/upload/use-spreadsheet-upload";
import { classifyDenialRows, type ImportRowState } from "@/lib/excel/denial-import";
import { downloadDenialCodeTemplate } from "@/lib/excel/denial-template";
import { DENIAL_FILE_RULES } from "@/lib/excel/validate";
import { pluralize } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./category-badge";

const RESULT_STYLES: Record<ImportRowState, string> = {
  New: "bg-success-soft text-success",
  Update: "bg-brand-soft text-brand-soft-foreground",
  Error: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

interface DenialUploadPanelProps {
  upload: ReturnType<typeof useSpreadsheetUpload>;
  onImported: () => void;
}

export function DenialUploadPanel({ upload, onImported }: DenialUploadPanelProps) {
  const codes = useDemoStore((s) => s.denialCodes);
  const importDenialCodes = useDemoStore((s) => s.importDenialCodes);

  const rows = useMemo(
    () => (upload.parsed ? classifyDenialRows(upload.parsed.rows, codes, upload.parsed.rowNumbers) : []),
    [upload.parsed, codes],
  );
  const counts = {
    New: rows.filter((r) => r.state === "New").length,
    Update: rows.filter((r) => r.state === "Update").length,
    Error: rows.filter((r) => r.state === "Error").length,
  };
  const importable = counts.New + counts.Update;

  const handleImport = () => {
    const values = rows.flatMap((r) => (r.value ? [r.value] : []));
    const { added, updated } = importDenialCodes(values);
    toast.success(`Imported ${values.length} denial ${pluralize(values.length, "code")}`, {
      description: `${added} new · ${updated} updated${counts.Error ? ` · ${counts.Error} skipped with errors` : ""}`,
    });
    upload.clear();
    onImported();
  };

  const handleTemplate = async () => {
    await downloadDenialCodeTemplate();
    toast.success("Template downloaded");
  };

  if (!upload.file || !upload.parsed) {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">Upload Denial Codes</h3>
            <p className="text-sm text-muted-foreground">
              Import denial codes from an Excel or CSV file: two columns, code then description, with or without a header row. Existing codes get the new description; new codes are added.
            </p>
          </div>
          <Button variant="outline" onClick={handleTemplate}>
            <Download aria-hidden /> Download Template
          </Button>
        </div>
        <FileDropzone
          rules={DENIAL_FILE_RULES}
          onFile={upload.selectFile}
          busy={upload.parsing}
          error={upload.error}
          title="Drag and drop your file here"
        />
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-5">
      <FileChip file={upload.file} rows={upload.parsed.rows.length} onRemove={upload.clear} />
      
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Preview</span>
        {(["New", "Update", "Error"] as const).map((state) => (
          <Badge key={state} variant="secondary" className={cn("rounded-full border-transparent font-semibold", RESULT_STYLES[state])}>
            {counts[state]} {state === "Error" ? pluralize(counts[state], "error") : state}
          </Badge>
        ))}
      </div>

      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14">#</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.line}>
                <TableCell className="text-muted-foreground tabular-nums">{r.line}</TableCell>
                <TableCell className="font-mono text-[13px] font-medium">
                  {r.data.code || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="min-w-64 max-w-xl whitespace-normal">
                  {r.data.description ? (
                    <span className="line-clamp-2">{r.data.description}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.value?.category ? (
                    <CategoryBadge category={r.value.category} />
                  ) : (
                    <span className="text-muted-foreground">{r.state === "New" ? "Other" : r.state === "Update" ? "Unchanged" : "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.value?.status ? (
                    <StatusBadge status={r.value.status} />
                  ) : (
                    <span className="text-muted-foreground">{r.state === "New" ? "Active" : r.state === "Update" ? "Unchanged" : "—"}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant="secondary" className={cn("rounded-full border-transparent text-xs font-semibold", RESULT_STYLES[r.state])}>
                      {r.state}
                    </Badge>
                    {r.message && <span className="text-xs whitespace-normal text-destructive">{r.message}</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" size="lg" onClick={upload.clear}>
          Cancel
        </Button>
        <Button size="lg" disabled={importable === 0} onClick={handleImport}>
          <Upload aria-hidden /> Import {importable} {pluralize(importable, "code")}
        </Button>
      </div>
    </Card>
  );
}
