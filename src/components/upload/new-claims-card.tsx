"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, ClipboardPlus, Settings2, Download, Loader2, Sparkles, Upload, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/use-auth";
import { rowsToClaims } from "@/lib/excel/claims-import";
import { downloadSoftwareTemplate } from "@/lib/excel/software-template";
import { buildNewClaimsSample, isSampleWorklistFile, withSampleDenialCodes } from "@/lib/excel/sample";
import { CLAIM_FILE_RULES } from "@/lib/excel/validate";
import { pluralize } from "@/lib/format";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { headerTypes, optionalHeaders, requiredHeaders, shownColumns, softwareAliasMap } from "@/lib/templates";
import { useCurrentUser } from "@/lib/store/selectors";
import type { Software } from "@/lib/types";
import { ColumnsHint } from "./columns-hint";
import { FileChip } from "./file-chip";
import { FileDropzone } from "./file-dropzone";
import { MissingColumnsNotice, PreviewTable } from "./preview-table";
import { UploadCard } from "./upload-card";
import { useSpreadsheetUpload } from "./use-spreadsheet-upload";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function NewClaimsCard({ software }: { software: Software | undefined }) {
  const router = useRouter();
  const practices = useDemoStore((s) => s.practices);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);
  const importNewClaims = useDemoStore((s) => s.importNewClaims);
  const setSelectedPractice = useDemoStore((s) => s.setSelectedPractice);
  const denialCodes = useDemoStore((s) => s.denialCodes);
  const currentUser = useCurrentUser();
  const { userId: authUserId, fullName: authFullName, authenticated, can } = useAuth();
  const uploader = authenticated ? authFullName : currentUser.name;
  const uploaderId = authenticated ? authUserId : currentUser.id;
  const isAdmin = can("templates.manage");

  const customFields = useDemoStore((s) => s.customFields);

  // What the chosen software's template looks like: required / optional columns, their other spellings, their types.
  const required = useMemo(() => (software ? requiredHeaders(software) : []), [software]);
  const optional = useMemo(() => (software ? optionalHeaders(software) : []), [software]);
  const aliases = useMemo(() => (software ? softwareAliasMap(software) : {}), [software]);
  const types = useMemo(() => (software ? headerTypes(software, customFields) : {}), [software, customFields]);
  const claimNoHeader = (software ? shownColumns(software) : []).find((c) => c.field === "claimId")?.header ?? "Claim No";

  const upload = useSpreadsheetUpload(CLAIM_FILE_RULES, required, optional, undefined, aliases);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    fileName: string;
    practice: string;
    added: number;
    updated: number;
    skipped: number;
    ar1Set: number;
    ar2Set: number;
    by: string;
  } | null>(null);

  const activePractices = useMemo(() => practices.filter((p) => p.status === "Active"), [practices]);
  const targetPractice = useMemo(() => {
    if (selectedPracticeId !== "all") {
      return practices.find((p) => p.id === selectedPracticeId);
    }
    return activePractices.find((p) => p.softwareId === software?.id) ?? activePractices[0];
  }, [selectedPracticeId, practices, activePractices, software?.id]);

  // Template order; optional columns only appear when the file has them.
  const previewColumns = useMemo(
    () => (software ? shownColumns(software).filter((c) => required.includes(c.header) || upload.parsed?.columns.includes(c.header)).map((c) => c.header) : []),
    [software, required, upload.parsed],
  );
  const optionalMissing = optional.filter((c) => upload.parsed && !upload.parsed.columns.includes(c));
  const claimIdMissing = upload.parsed?.missing.includes(claimNoHeader) ?? false;

  const handleSample = async () => {
    setResult(null);
    if (!software) return;
    await upload.selectFile(await buildNewClaimsSample(software, customFields));
  };

  const clear = () => {
    upload.clear();
    setResult(null);
  };

  const handleSubmit = async () => {
    const practice = targetPractice;
    let valid = true;
    if (!practice) {
      toast.error("No active practice found. Select a practice in the top bar.");
      valid = false;
    }
    if (!software) {
      upload.setError("Choose the billing software this file comes from.");
      valid = false;
    } else if (!upload.file || !upload.parsed) {
      upload.setError("Choose an Excel file to upload.");
      valid = false;
    } else if (claimIdMissing) {
      upload.setError(`This file has no ${claimNoHeader} column, so claims can't be created from it.`);
      valid = false;
    }
    if (!valid || !practice || !software || !upload.file || !upload.parsed) return;

    setSubmitting(true);
    await sleep(900);

    const uploadId = uid("up");
    const parsedClaims = rowsToClaims(upload.parsed.rows, practice, uploadId, software, customFields);
    const { skipped } = parsedClaims;
    // Denial codes aren't in any Excel template. A sample upload hands out a few so the column has something to show.
    const claims = isSampleWorklistFile(upload.file.name)
      ? withSampleDenialCodes(parsedClaims.claims, new Set(denialCodes.filter((c) => c.status === "Active").map((c) => c.code)))
      : parsedClaims.claims;
    const { added, updated, ar1Set, ar2Set } = importNewClaims(claims, {
      id: uploadId,
      fileName: upload.file.name,
      type: "New",
      practiceName: practice.name,
      rows: upload.parsed.rows.length,
      uploadedBy: uploader,
      uploadedAt: new Date().toISOString(),
      status: skipped > 0 || upload.parsed.missing.length > 0 ? "Completed with warnings" : "Completed",
    }, uploaderId);

    const notes = [
      skipped > 0 && `${skipped} ${pluralize(skipped, "row")} without a Claim No skipped`,
    ].filter(Boolean);
    const options = {
      description: notes.length ? notes.join(" · ") : undefined,
      action: {
        label: "View worklist",
        onClick: () => {
          setSelectedPractice(practice.id);
          router.push("/worklist");
        },
      },
    };

    if (added === 0 && updated === 0) toast.warning(`No claims were added to ${practice.name}`, options);
    else toast.success(`${added} new, ${updated} updated in ${practice.name} worklist`, options);
    setResult({ fileName: upload.file.name, practice: practice.name, added, updated, skipped, ar1Set, ar2Set, by: uploader });

    upload.clear();
    setSubmitting(false);
  };

  return (
    <UploadCard
      tone="blue"
      icon={<ClipboardPlus className="size-9" strokeWidth={1.5} aria-hidden />}
      title="New Claims Submission"
      description="Upload your new worklist file to add or update claims."
      footer={
        <>
          <div className="flex basis-full flex-wrap items-center justify-between gap-2 text-left text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <UserCheck className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                You&apos;ll be set as AR Level 1 on new claims and AR Level 2 on updated claims.{" "}
                <span className="whitespace-nowrap">
                  Uploading as <span className="font-semibold text-foreground/80">{uploader}</span>.
                </span>
              </span>
            </p>
            <Link href="/settings/upload-templates" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <Settings2 className="size-3" aria-hidden /> {isAdmin ? "Edit templates in Settings" : "See templates in Settings"}
            </Link>
          </div>
          <Button variant="outline" size="lg" onClick={clear} disabled={submitting}>
            Clear
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            {submitting ? "Uploading…" : "Upload New Claims"}
          </Button>
        </>
      }
    >
      {result && (
        <section
          aria-label="New claims upload result"
          className="flex items-start gap-3 rounded-xl border border-primary/25 bg-brand-soft/60 p-4 dark:bg-brand-soft/30"
        >
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" data-testid="new-result-summary">
              <span className="tabular-nums">{result.added}</span> new {pluralize(result.added, "claim")} (AR Level 1: {result.by}) ·{" "}
              <span className="tabular-nums">{result.updated}</span> updated (AR Level 2: {result.by})
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={result.fileName}>
              {result.fileName} · {result.practice}
              {result.skipped > 0 && ` · ${result.skipped} ${pluralize(result.skipped, "row")} without a Claim No skipped`}
            </p>
            {result.updated > 0 && result.ar2Set + result.ar1Set < result.updated && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                AR Level 2 changed on {result.ar2Set + result.ar1Set} of {result.updated} updated {pluralize(result.updated, "claim")}; on the
                others {result.by} was already AR Level 1 or AR Level 2.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            aria-label="Dismiss result"
            className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>
        </section>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Upload File <span className="text-destructive">*</span>
        </Label>
        {upload.file && upload.parsed ? (
          <div className="space-y-4">
            <FileChip file={upload.file} rows={upload.parsed.rows.length} onRemove={upload.clear} disabled={submitting} />
            <MissingColumnsNotice
              missing={[...upload.parsed.missing, ...optionalMissing]}
              blocking={claimIdMissing}
              blockingText={`A ${claimNoHeader} column is required before this file can be uploaded.`}
            />
            <PreviewTable expected={previewColumns} missing={[...upload.parsed.missing, ...optionalMissing]} rows={upload.parsed.rows} columnTypes={types} />
            {upload.error && (
              <p role="alert" className="text-sm text-destructive">
                {upload.error}
              </p>
            )}
          </div>
        ) : (
          <FileDropzone
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
                <ColumnsHint required={required} optional={optional} title={software ? `Columns ${software.name} files need` : undefined} />
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => software && downloadSoftwareTemplate(software, customFields)}
                    className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Download className="size-3.5" aria-hidden /> Download {software ? `${software.name} ` : ""}template
                  </button>
                  <button
                    type="button"
                    onClick={handleSample}
                    disabled={upload.parsing}
                    className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
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
