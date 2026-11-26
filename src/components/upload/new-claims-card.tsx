"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, ClipboardPlus, Settings2, Download, Loader2, Plus, Sparkles, Upload, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/use-auth";
import { rowsToClaims } from "@/lib/excel/claims-import";
import { downloadSoftwareTemplate } from "@/lib/excel/software-template";
import { buildNewClaimsSample, isSampleWorklistFile, withSampleDenialCodes } from "@/lib/excel/sample";
import { CLAIM_FILE_RULES } from "@/lib/excel/validate";
import { pluralize } from "@/lib/format";
import { uid, useDemoStore } from "@/lib/store/demo-store";
import { headerTypes, optionalHeaders, requiredHeaders, shownColumns, softwareAliasMap } from "@/lib/templates";
import { useIsAdmin } from "@/lib/store/selectors";
import { useCurrentUser } from "@/lib/store/selectors";
import { ColumnsHint } from "./columns-hint";
import { FileChip } from "./file-chip";
import { FileDropzone } from "./file-dropzone";
import { MissingColumnsNotice, PreviewTable } from "./preview-table";
import { UploadCard } from "./upload-card";
import { useSpreadsheetUpload } from "./use-spreadsheet-upload";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function NewClaimsCard() {
  const router = useRouter();
  const practices = useDemoStore((s) => s.practices);
  const importNewClaims = useDemoStore((s) => s.importNewClaims);
  const setSelectedPractice = useDemoStore((s) => s.setSelectedPractice);
  const denialCodes = useDemoStore((s) => s.denialCodes);
  const currentUser = useCurrentUser();
  const uploader = currentUser.name;

  const softwares = useDemoStore((s) => s.softwares);
  const addSoftware = useDemoStore((s) => s.addSoftware);
  const customFields = useDemoStore((s) => s.customFields);
  const { can } = useAuth();
  const isAdmin = can("templates.manage");
  const activeSoftwares = useMemo(() => softwares.filter((x) => x.status === "Active"), [softwares]);
  const [softwareChoice, setSoftwareChoice] = useState("");
  const [addingSoftware, setAddingSoftware] = useState(false);
  const [newSoftwareName, setNewSoftwareName] = useState("");
  // The first active software until the user picks one (or the picked one disappears).
  const software = activeSoftwares.find((x) => x.id === softwareChoice) ?? activeSoftwares[0];

  // What the chosen software's template looks like: required / optional columns, their other spellings, their types.
  const required = useMemo(() => (software ? requiredHeaders(software) : []), [software]);
  const optional = useMemo(() => (software ? optionalHeaders(software) : []), [software]);
  const aliases = useMemo(() => (software ? softwareAliasMap(software) : {}), [software]);
  const types = useMemo(() => (software ? headerTypes(software, customFields) : {}), [software, customFields]);
  const claimNoHeader = (software ? shownColumns(software) : []).find((c) => c.field === "claimId")?.header ?? "Claim No";

  const upload = useSpreadsheetUpload(CLAIM_FILE_RULES, required, optional, undefined, aliases);
  const [practiceId, setPracticeId] = useState("");
  const [practiceError, setPracticeError] = useState<string | null>(null);
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
    setPracticeId("");
    setPracticeError(null);
  };

  const handleSubmit = async () => {
    const practice = practices.find((p) => p.id === practiceId);
    let valid = true;
    if (!practice) {
      setPracticeError("Select a practice to continue.");
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
    }, currentUser.id);

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
          <p className="flex basis-full items-start gap-2 text-left text-xs text-muted-foreground">
            <UserCheck className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              You&apos;ll be set as AR 1 on new claims and AR 2 on updated claims.{" "}
              <span className="whitespace-nowrap">
                Uploading as <span className="font-semibold text-foreground/80">{uploader}</span>.
              </span>
            </span>
          </p>
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
      <div className="space-y-2">
        <Label htmlFor="new-claims-software" className="text-sm font-semibold">
          Billing Software <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Select
            value={software?.id ?? ""}
            onValueChange={(v) => {
              setSoftwareChoice(v);
              // The columns this file must have depend on the software, so start over with a fresh file.
              upload.clear();
              setResult(null);
            }}
            disabled={submitting}
          >
            <SelectTrigger id="new-claims-software" className="w-full bg-card">
              <SelectValue placeholder="Select software" />
            </SelectTrigger>
            <SelectContent>
              {activeSoftwares.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button type="button" variant="outline" size="icon" title="Add new billing software" onClick={() => setAddingSoftware(true)}>
              <Plus className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        <Dialog open={addingSoftware} onOpenChange={setAddingSoftware}>
          <DialogContent className="sm:max-w-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = newSoftwareName.trim();
                if (!trimmed) return;
                const created = addSoftware(trimmed, software?.id);
                setSoftwareChoice(created.id);
                setNewSoftwareName("");
                setAddingSoftware(false);
                upload.clear();
                toast.success(`Added software "${created.name}"`);
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Add Billing Software</DialogTitle>
                <DialogDescription>Create a new software template starting from the current layout.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="quick-sw-name">Software Name</Label>
                <Input id="quick-sw-name" required autoFocus placeholder="e.g. NextGen" value={newSoftwareName} onChange={(e) => setNewSoftwareName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddingSoftware(false)}>Cancel</Button>
                <Button type="submit">Add &amp; Select</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <p className="text-xs text-muted-foreground">
          The template columns and their names follow the software.{" "}
          <Link href="/settings/upload-templates" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <Settings2 className="size-3" aria-hidden /> {isAdmin ? "Edit templates in Settings" : "See templates in Settings"}
          </Link>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-claims-practice" className="text-sm font-semibold">
          Practice Name <span className="text-destructive">*</span>
        </Label>
        <Select
          value={practiceId}
          onValueChange={(v) => {
            setPracticeId(v);
            setPracticeError(null);
          }}
          disabled={submitting}
        >
          <SelectTrigger
            id="new-claims-practice"
            className="w-full bg-card"
            aria-invalid={!!practiceError}
            aria-describedby={practiceError ? "new-claims-practice-error" : undefined}
          >
            <SelectValue placeholder="Select Practice" />
          </SelectTrigger>
          <SelectContent>
            {activePractices.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {practiceError && (
          <p id="new-claims-practice-error" role="alert" className="text-sm text-destructive">
            {practiceError}
          </p>
        )}
      </div>

      {result && (
        <section
          aria-label="New claims upload result"
          className="flex items-start gap-3 rounded-xl border border-primary/25 bg-brand-soft/60 p-4 dark:bg-brand-soft/30"
        >
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" data-testid="new-result-summary">
              <span className="tabular-nums">{result.added}</span> new {pluralize(result.added, "claim")} (AR 1: {result.by}) ·{" "}
              <span className="tabular-nums">{result.updated}</span> updated (AR 2: {result.by})
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={result.fileName}>
              {result.fileName} · {result.practice}
              {result.skipped > 0 && ` · ${result.skipped} ${pluralize(result.skipped, "row")} without a Claim No skipped`}
            </p>
            {result.updated > 0 && result.ar2Set + result.ar1Set < result.updated && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                AR 2 changed on {result.ar2Set + result.ar1Set} of {result.updated} updated {pluralize(result.updated, "claim")}; on the
                others {result.by} was already AR 1 or AR 2.
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
