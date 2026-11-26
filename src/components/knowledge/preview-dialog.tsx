"use client";

import { useEffect, useState } from "react";
import { Download, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadKnowledgeFile } from "@/lib/knowledge/file-store";
import { downloadBlob, kindOf } from "@/lib/knowledge/files";
import { formatBytes } from "@/lib/format";
import type { KnowledgeDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileTypeIcon } from "./file-type-icon";

const MAX_ROWS = 500;
const MAX_COLS = 40;

type Sheet = { name: string; rows: string[][]; truncated: boolean };
type Preview =
  | { kind: "loading" }
  | { kind: "sheets"; sheets: Sheet[] }
  | { kind: "html"; html: string }
  | { kind: "pdf"; url: string }
  | { kind: "none"; message: string };

export function PreviewDialog({ doc, onClose }: { doc: KnowledgeDoc | null; onClose: () => void }) {
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[min(46rem,calc(100dvh-2rem))] flex-col gap-0 p-0 sm:max-w-4xl max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none">
        {doc && <PreviewBody key={doc.id} doc={doc} />}
      </DialogContent>
    </Dialog>
  );
}

const DOC_CSS = `body{font:15px/1.6 system-ui,sans-serif;color:#0f172a;margin:0;padding:28px 32px;max-width:760px}
h1{font-size:26px;margin:0 0 12px}h2{font-size:19px;margin:24px 0 8px}p{margin:0 0 10px}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:6px 10px}a{color:#1d4ed8}`;

function PreviewBody({ doc }: { doc: KnowledgeDoc }) {
  const [preview, setPreview] = useState<Preview>({ kind: "loading" });
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    (async () => {
      try {
        const file = await loadKnowledgeFile(doc.id);
        if (cancelled) return;
        if (!file) {
          setPreview({ kind: "none", message: "This file isn't stored in this browser any more." });
          return;
        }
        setBlob(file);
        const kind = kindOf(doc.ext);
        if (doc.ext === "doc" || !kind) {
          setPreview({ kind: "none", message: "Preview not available, download to open." });
        } else if (kind === "pdf") {
          objectUrl = URL.createObjectURL(file);
          setPreview({ kind: "pdf", url: objectUrl });
        } else if (kind === "word") {
          const mammoth = await import("mammoth/mammoth.browser");
          const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
          if (!cancelled) setPreview({ kind: "html", html: value });
        } else {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
          const sheets = wb.SheetNames.map((name): Sheet => {
            const all = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: "", blankrows: false, raw: false });
            return {
              name,
              rows: all.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS).map((c) => String(c ?? ""))),
              truncated: all.length > MAX_ROWS,
            };
          });
          if (!cancelled) setPreview({ kind: "sheets", sheets });
        }
      } catch {
        if (!cancelled) setPreview({ kind: "none", message: "This file couldn't be previewed. Download it to open." });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id, doc.ext]);

  const sheet = preview.kind === "sheets" ? preview.sheets[Math.min(sheetIndex, preview.sheets.length - 1)] : undefined;

  return (
    <>
      <header className="flex items-center gap-3 border-b px-5 py-4 pr-14">
        <FileTypeIcon ext={doc.ext} />
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-base font-bold">{doc.title}</DialogTitle>
          <DialogDescription className="truncate text-xs">
            {doc.fileName} · {formatBytes(doc.size || blob?.size || 0)}
          </DialogDescription>
        </div>
        <Button variant="outline" size="sm" disabled={!blob} onClick={() => blob && downloadBlob(blob, doc.fileName)}>
          <Download aria-hidden /> Download
        </Button>
      </header>

      <div className="min-h-0 flex-1 bg-muted/30">
        {preview.kind === "loading" && (
          <div className="grid h-full place-items-center text-muted-foreground" role="status">
            <span className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Loading preview…
            </span>
          </div>
        )}

        {preview.kind === "none" && (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="max-w-sm space-y-2">
              <FileQuestion className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="font-semibold">{preview.message}</p>
            </div>
          </div>
        )}

        {preview.kind === "pdf" && <iframe title={`Preview of ${doc.title}`} src={preview.url} className="size-full border-0 bg-white" />}

        {preview.kind === "html" && (
          // A sandboxed frame without scripts: the document's own content can't run anything.
          <iframe
            title={`Preview of ${doc.title}`}
            sandbox=""
            srcDoc={`<!doctype html><meta charset="utf-8"><style>${DOC_CSS}</style>${preview.html}`}
            className="size-full border-0 bg-white"
          />
        )}

        {sheet && preview.kind === "sheets" && (
          <div className="flex h-full min-h-0 flex-col">
            {preview.sheets.length > 1 && (
              <div role="tablist" aria-label="Sheets" className="flex gap-1 overflow-x-auto border-b bg-card px-3 pt-2">
                {preview.sheets.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    role="tab"
                    aria-selected={s === sheet}
                    onClick={() => setSheetIndex(i)}
                    className={cn(
                      "-mb-px shrink-0 rounded-t-md border border-b-0 px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      s === sheet ? "border-border bg-background text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto bg-background" data-testid="sheet-preview">
              <Table className="text-[13px]">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {sheet.rows[0] && (
                    <TableRow className="hover:bg-transparent">
                      {sheet.rows[0].map((cell, i) => (
                        <TableHead key={i} className="h-9 px-3 font-semibold whitespace-nowrap">
                          {cell}
                        </TableHead>
                      ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {sheet.rows.slice(1).map((row, r) => (
                    <TableRow key={r}>
                      {row.map((cell, c) => (
                        <TableCell key={c} className="max-w-xs px-3 py-1.5 whitespace-normal">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {sheet.truncated && <p className="p-3 text-xs text-muted-foreground">Showing the first {MAX_ROWS} rows. Download the file to see everything.</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
