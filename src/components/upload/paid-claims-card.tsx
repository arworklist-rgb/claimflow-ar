"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Database, Download, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { isClosed, matchPaidRows, type PaidOutcome, type PaidRowResult } from "@/lib/claims";
import {
  PAID_CLAIM_COLUMNS,
  PAID_CLAIM_OPTIONAL_COLUMNS,
  PAID_CLAIM_REQUIRED_COLUMNS,
} from "@/lib/excel/columns";
import { rowsToPaidFileRows } from "@/lib/excel/claims-import";
import { downloadPaidClaimsTemplate } from "@/lib/excel/paid-template";
import { buildPaidClaimsSample } from "@/lib/excel/sample";
import { CLAIM_FILE_RULES } from "@/lib/excel/validate";
import { pluralize } from "@/lib/format";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser } from "@/lib/store/selectors";
import { ColumnsHint } from "./columns-hint";
import { FileChip } from "./file-chip";
import { FileDropzone } from "./file-dropzone";
import { PaidResult } from "./paid-result";
import { MissingColumnsNotice, PreviewTable } from "./preview-table";
import { UploadCard } from "./upload-card";
import { useSpreadsheetUpload } from "./use-spreadsheet-upload";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MATCH_BADGES: Record<PaidOutcome, { label: string; tone: string }> = {
  updated: { label: "Will mark Paid and closed", tone: "bg-success-soft text-success" },
  alreadyPaid: { label: "Already paid and closed", tone: "bg-muted text-muted-foreground" },
  notFound: { label: "Not found", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  multiple: { label: "Multiple matches", tone: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

export function PaidClaimsCard() {
  const router = useRouter();
  const claims = useDemoStore((s) => s.claims);
  const users = useDemoStore((s) => s.users);
  const applyPaidClaims = useDemoStore((s) => s.applyPaidClaims);
  const uploader = useCurrentUser().name;

  const upload = useSpreadsheetUpload(CLAIM_FILE_RULES, PAID_CLAIM_REQUIRED_COLUMNS, PAID_CLAIM_OPTIONAL_COLUMNS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ fileName: string; results: PaidRowResult[] } | null>(null);

  const missingRequired = upload.parsed?.missing ?? [];
  const blocked = missingRequired.length > 0;
  const optionalMissing = PAID_CLAIM_OPTIONAL_COLUMNS.filter((c) => upload.parsed && !upload.parsed.columns.includes(c));

  // What each uploaded row would do against the worklist as it is right now.
  const fileRows = useMemo(
    () => (upload.parsed ? rowsToPaidFileRows(upload.parsed.rows, upload.parsed.rowNumbers) : []),
    [upload.parsed],
  );
  const previewMatches = useMemo(() => matchPaidRows(fileRows, claims), [fileRows, claims]);

  const handleSample = async () => {
    if (claims.every(isClosed)) {
      toast.info("The worklist has no unpaid claims, so every row in this sample will be “not found”.", {
        description: "Upload a New Worklist sample first to see claims turn Paid and closed.",
      });
    }
    setResult(null);
    await upload.selectFile(await buildPaidClaimsSample(claims, users));
  };

  const handleSubmit = async () => {
    if (!upload.file || !upload.parsed) {
      upload.setError("Choose an Excel file to upload.");
      return;
    }
    if (blocked) {
      upload.setError(`This file is missing required columns: ${missingRequired.join(", ")}.`);
      return;
    }

    setSubmitting(true);
    await sleep(900);

    // Match against the latest worklist, not the snapshot from when the file was picked.
    const results = matchPaidRows(fileRows, useDemoStore.getState().claims);
    const updated = results.filter((r) => r.outcome === "updated").length;
    const notFound = results.filter((r) => r.outcome === "notFound").length;
    applyPaidClaims(results, {
      id: uid("up"),
      fileName: upload.file.name,
      type: "Paid",
      practiceName: "—",
      rows: results.length,
      uploadedBy: uploader,
      uploadedAt: new Date().toISOString(),
    });

    const flagged = results.length - updated;
    const options = {
      description: flagged > 0 ? `${flagged} ${pluralize(flagged, "row")} didn't update — see the details below.` : undefined,
      action: { label: "View worklist", onClick: () => router.push("/worklist") },
    };
    const message = `${updated} ${pluralize(updated, "claim")} updated to Paid and closed, ${notFound} not found in worklist`;
    if (updated === 0) toast.warning(message, options);
    else toast.success(message, options);

    setResult({ fileName: upload.file.name, results });
    upload.clear();
    setSubmitting(false);
  };

  return (
    <UploadCard
      tone="green"
      icon={
        <span className="relative">
          <Database className="size-9" strokeWidth={1.5} aria-hidden />
          <CircleCheck className="absolute -right-1.5 -bottom-1 size-4 rounded-full bg-success-soft fill-success text-white" aria-hidden />
        </span>
      }
      title="Paid Claims Submission"
      description="Upload paid claims to mark matching worklist claims as Paid and closed."
      footer={
        <>
          <Button variant="outline" size="lg" onClick={() => { upload.clear(); setResult(null); }} disabled={submitting}>
            Clear
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            {submitting ? "Uploading…" : "Upload Paid Claims"}
          </Button>
        </>
      }
    >
      {result && <PaidResult fileName={result.fileName} results={result.results} onDismiss={() => setResult(null)} />}

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Upload Paid Claim File <span className="text-destructive">*</span>
        </Label>
        {upload.file && upload.parsed ? (
          <div className="space-y-4">
            <FileChip file={upload.file} rows={upload.parsed.rows.length} tone="green" onRemove={upload.clear} disabled={submitting} />
            <MissingColumnsNotice
              missing={[...upload.parsed.missing, ...optionalMissing]}
              blocking={blocked}
              blockingText="Patient Name and Service date are required before this file can be uploaded."
            />
            <PreviewTable
              expected={PAID_CLAIM_COLUMNS}
              missing={[...upload.parsed.missing, ...optionalMissing]}
              rows={upload.parsed.rows}
              extra={{
                header: "Worklist match",
                cell: (_row, index) => {
                  const badge = MATCH_BADGES[previewMatches[index]?.outcome ?? "notFound"];
                  return (
                    <Badge variant="secondary" className={`rounded-full border-transparent text-[11px] font-semibold ${badge.tone}`}>
                      {badge.label}
                    </Badge>
                  );
                },
              }}
            />
            {upload.error && (
              <p role="alert" className="text-sm text-destructive">
                {upload.error}
              </p>
            )}
          </div>
        ) : (
          <FileDropzone
            tone="green"
            rules={CLAIM_FILE_RULES}
            onFile={(file) => {
              setResult(null);
              upload.selectFile(file);
            }}
            busy={upload.parsing}
            disabled={submitting}
            error={upload.error}
            footer={
              <div className="mt-4 space-y-4">
                <ColumnsHint required={PAID_CLAIM_REQUIRED_COLUMNS} optional={PAID_CLAIM_OPTIONAL_COLUMNS} />
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => downloadPaidClaimsTemplate()}
                    className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-success hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Download className="size-3.5" aria-hidden /> Download template
                  </button>
                  <button
                    type="button"
                    onClick={handleSample}
                    disabled={upload.parsing}
                    className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-success hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <Sparkles className="size-3.5" aria-hidden /> Try with a sample file
                  </button>
                </div>
              </div>
            }
          />
        )}
      </div>
    </UploadCard>
  );
}
