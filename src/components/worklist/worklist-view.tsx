"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Download, FileDown, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/use-auth";
import { AddClaimDialog } from "./add-claim-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledSelect } from "@/components/shared/labeled-select";
import { PageHeader } from "@/components/shared/page-header";
import { StaffChip } from "@/components/shared/staff-chip";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import {
  ageInDays,
  balanceOf,
  bucketOfAge,
  bucketShort,
  isClosed,
  lastWorkedAt,
  latestComment,
  type BucketId,
} from "@/lib/claims";
import { findStaff } from "@/lib/excel/assignment";
import { exportWorklist } from "@/lib/excel/claims-export";
import { downloadSoftwareTemplate } from "@/lib/excel/software-template";
import { parseAmount } from "@/lib/excel/parse";
import { formatCurrency, formatDate, formatDateNumeric, pluralize } from "@/lib/format";
import { codeSortKey } from "@/lib/denial-codes";
import { claimFieldText, fieldDef } from "@/lib/templates";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser } from "@/lib/store/selectors";
import { useStoreHydrated } from "@/lib/store/use-store-hydrated";
import { CLAIM_ACTIONS, SUBMITTED_STATUSES, type Claim, type ClaimAction, type WorklistColumn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BucketTabs, type BucketFilter } from "./bucket-tabs";
import { ClaimEditDialog } from "./claim-edit-dialog";
import { DenialCodeFilter, DenialCodesCell } from "./denial-codes-field";
import { ActionSelect, InlineTextCell, SubmittedSelect } from "./inline-cells";
import { SummaryCards } from "./summary-cards";

const BUCKET_STYLES: Record<BucketId, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  "30": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  "60": "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  "60plus": "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
};

export function WorklistView() {
  const hydrated = useStoreHydrated();
  const claims = useDemoStore((s) => s.claims);
  const practices = useDemoStore((s) => s.practices);
  const denialCodes = useDemoStore((s) => s.denialCodes);
  const uploadLogs = useDemoStore((s) => s.uploadLogs);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);
  const users = useDemoStore((s) => s.users);
  const updateClaim = useDemoStore((s) => s.updateClaim);
  const patchClaim = useDemoStore((s) => s.patchClaim);
  const setClaimDenialCodes = useDemoStore((s) => s.setClaimDenialCodes);
  const worklistColumns = useDemoStore((s) => s.worklistColumns);
  const customFields = useDemoStore((s) => s.customFields);
  const softwares = useDemoStore((s) => s.softwares);
  const currentUser = useCurrentUser().name;

  // Ages are computed against one timestamp per mount so rows and buckets always agree.
  const [now] = useState(() => Date.now());

  const [bucket, setBucket] = useState<BucketFilter>("all");
  const [responsible, setResponsible] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [submitted, setSubmitted] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [hideClosed, setHideClosed] = useState(true);
  const [denialFilter, setDenialFilter] = useState<string[]>([]);
  // The claim open in the edit popup. Rows no longer open anything on click; only the edit icon does.
  const [editingId, setEditingId] = useState<string | null>(null);

  // A persisted practice id can outlive its practice.
  const practiceFilter = practices.some((p) => p.id === selectedPracticeId) ? selectedPracticeId : ALL_PRACTICES;

  const scoped = useMemo(
    () => claims.filter((c) => practiceFilter === ALL_PRACTICES || c.practiceId === practiceFilter),
    [claims, practiceFilter],
  );
  const bucketScope = useMemo(() => scoped.filter((c) => !(hideClosed && isClosed(c))), [scoped, hideClosed]);
  const responsibleParties = useMemo(() => [...new Set(scoped.map((c) => c.responsible).filter(Boolean))].sort(), [scoped]);
  const responsibleFilter = responsible === "all" || responsibleParties.includes(responsible) ? responsible : "all";

  // Active staff, plus anyone deactivated who is still assigned to a claim in view.
  const assigneeOptions = useMemo(() => {
    const assigned = new Set(scoped.flatMap((c) => [c.ar1UserId, c.ar2UserId]));
    return users
      .filter((u) => u.status === "Active" || assigned.has(u.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({ value: u.id, label: u.status === "Active" ? u.name : `${u.name} (deactivated)` }));
  }, [users, scoped]);
  const assigneeFilter = ["all", "none"].includes(assignee) || assigneeOptions.some((o) => o.value === assignee) ? assignee : "all";
  const userName = (id?: string) => users.find((u) => u.id === id)?.name ?? "";

  // Denial code filter options: active codes, plus inactive ones still sitting on claims in view.
  const denialOptions = useMemo(() => {
    const inUse = new Set(scoped.flatMap((c) => c.denialCodes));
    return denialCodes.filter((c) => c.status === "Active" || inUse.has(c.code));
  }, [denialCodes, scoped]);
  const denialFilterLive = denialFilter.filter((code) => denialCodes.some((c) => c.code === code));

  const changeAction = (c: Claim, next: ClaimAction) => {
    const today = new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd in local time
    if (updateClaim(c.id, { action: next, actionDate: today }, currentUser)) {
      toast.success(`Claim ${c.claimId}: Action set to ${next}`);
    }
  };

  // Patient name and claim no are pinned left (the widths below keep the second one's offset exact), then the data
  // columns Settings > Upload Templates turns on (each shows the field it is mapped to), then the fixed columns.
  const columns = useMemo<Column<Claim>[]>(() => {
    const mono = "font-mono text-[13px]";
    const nowrap = "whitespace-nowrap";
    const sub = "mt-0.5 text-xs text-muted-foreground";
    const dash = <span className="text-muted-foreground">—</span>;
    const textCell = (value?: string) => (value ? value : dash);
    const numberOf = (c: Claim, field: string) => Number.parseFloat(claimFieldText(c, field)) || 0;

    /** One configured worklist column: shows the template field it's mapped to, formatted for that field's type. */
    const dataColumn = (wc: WorklistColumn): Column<Claim> => {
      const def = fieldDef(wc.field, customFields);
      const type = def?.type ?? "text";
      const base = { id: wc.id, header: wc.label || def?.label || "Column" };
      switch (wc.field) {
        case "aging":
          return {
            ...base,
            sortValue: (c) => ageInDays(c, now) ?? 0,
            cell: (c) => {
              const age = ageInDays(c, now);
              const id = bucketOfAge(age);
              return (
                <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums", BUCKET_STYLES[id])}>
                  {bucketShort(id)}
                  {age !== null && ` · ${age}d`}
                </span>
              );
            },
          };
        case "balance":
          return { ...base, headClassName: "text-right", className: "text-right font-bold tabular-nums", sortValue: balanceOf, cell: (c) => formatCurrency(balanceOf(c)) };
        case "paidAmount":
          return {
            ...base,
            headClassName: "text-right",
            className: "text-right",
            sortValue: (c) => c.paidAmount ?? -1,
            cell: (c) => (
              <InlineTextCell
                align="right"
                label="Paid Amount"
                inputMode="decimal"
                placeholder="0.00"
                value={c.paidAmount === undefined ? "" : String(c.paidAmount)}
                display={<span className="tabular-nums">{c.paidAmount === undefined ? dash : formatCurrency(c.paidAmount)}</span>}
                onCommit={(text) => patchClaim(c.id, { paidAmount: parseAmount(text) })}
              />
            ),
          };
        case "patientName":
          return { ...base, sortValue: (c) => c.patientName, className: nowrap, cell: (c) => <span className="font-medium">{textCell(c.patientName)}</span> };
        case "claimId":
        case "cpt":
        case "patientAcctNo":
        case "account":
          return { ...base, sortValue: (c) => claimFieldText(c, wc.field), className: cn(mono, nowrap), cell: (c) => textCell(claimFieldText(c, wc.field)) };
      }
      if (type === "date") {
        return { ...base, sortValue: (c) => claimFieldText(c, wc.field), className: cn(nowrap, "tabular-nums"), cell: (c) => (claimFieldText(c, wc.field) ? formatDateNumeric(claimFieldText(c, wc.field)) : dash) };
      }
      if (type === "currency") {
        return {
          ...base,
          headClassName: "text-right",
          className: "text-right tabular-nums",
          sortValue: (c) => numberOf(c, wc.field),
          cell: (c) => (claimFieldText(c, wc.field) ? formatCurrency(numberOf(c, wc.field)) : dash),
        };
      }
      if (type === "days") {
        return { ...base, sortValue: (c) => numberOf(c, wc.field), className: "tabular-nums", cell: (c) => (claimFieldText(c, wc.field) ? `${claimFieldText(c, wc.field)}d` : dash) };
      }
      return { ...base, sortValue: (c) => claimFieldText(c, wc.field), className: nowrap, cell: (c) => textCell(claimFieldText(c, wc.field)) };
    };

    return [
      {
        id: "patient",
        header: "Patient Name",
        stickyLeft: 0,
        sortValue: (c) => c.patientName,
        className: "w-[13rem] min-w-[13rem] max-w-[13rem]",
        cell: (c) => (
          <div className="leading-snug">
            <p className="truncate font-semibold" title={c.patientName}>{c.patientName || "—"}</p>
            <p className={cn(sub, "truncate")}>
              Rec #{c.rec ?? "—"}
              {c.patientAcctNo && ` · Acct ${c.patientAcctNo}`}
            </p>
          </div>
        ),
      },
      {
        id: "claimId",
        header: "Claim No",
        stickyLeft: 208,
        sortValue: (c) => c.claimId,
        className: cn(mono, nowrap, "w-36 min-w-36"),
        cell: (c) => c.claimId,
      },
      ...worklistColumns.filter((wc) => wc.visible).map(dataColumn),
      {
        id: "denial",
        header: "Denial Code",
        sortValue: (c) => (c.denialCodes[0] ? codeSortKey(c.denialCodes[0]) : "￿"),
        className: "min-w-44",
        cell: (c) => <DenialCodesCell value={c.denialCodes} codes={denialCodes} onChange={(next) => setClaimDenialCodes(c.id, next)} />,
      },
      {
        id: "comment",
        header: "Comment",
        sortValue: (c) => latestComment(c),
        className: "max-w-64 min-w-40",
        cell: (c) => {
          const text = latestComment(c);
          return text ? (
            <p className="line-clamp-2 text-[13px] leading-snug" title={text}>
              {text}
            </p>
          ) : (
            dash
          );
        },
      },
      {
        id: "action",
        header: "Action",
        sortValue: (c) => CLAIM_ACTIONS.indexOf(c.action),
        cell: (c) => <ActionSelect value={c.action} onChange={(next) => changeAction(c, next)} />,
      },
      {
        id: "submitted",
        header: "Submission Status",
        sortValue: (c) => (c.submittedStatus ? SUBMITTED_STATUSES.indexOf(c.submittedStatus) + 1 : 0),
        cell: (c) => <SubmittedSelect value={c.submittedStatus} onChange={(next) => patchClaim(c.id, { submittedStatus: next })} />,
      },
      {
        id: "last",
        header: "Date",
        sortValue: (c) => lastWorkedAt(c) ?? "",
        className: cn(nowrap, "tabular-nums"),
        cell: (c) => {
          const at = lastWorkedAt(c);
          return at ? formatDateNumeric(at) : <span className="text-muted-foreground">Not yet</span>;
        },
      },
      {
        id: "ar",
        header: "AR / Team",
        sortValue: (c) => userName(c.ar1UserId) || "￿",
        // Read-only: whoever uploads the claim is AR 1 (and AR 2 when a later upload updates it). Admins reassign in the popup.
        cell: (c) => {
          const ar1 = users.find((u) => u.id === c.ar1UserId);
          const ar2 = users.find((u) => u.id === c.ar2UserId);
          if (!ar1 && !ar2) return <span className="text-muted-foreground">Unassigned</span>;
          return (
            <div className="space-y-1">
              {ar1 && <StaffChip user={ar1} className="max-w-44" />}
              {ar2 && <StaffChip user={ar2} className="max-w-44 text-[13px] opacity-90" />}
            </div>
          );
        },
      },
      {
        id: "transactionBy",
        header: "Transaction By",
        sortValue: (c) => c.transactionBy ?? "",
        cell: (c) => {
          // Free text from the file; a user's name or email shows as that person.
          const user = c.transactionBy ? findStaff(c.transactionBy, users) : undefined;
          return (
            <InlineTextCell
              label="Transaction By"
              placeholder="Name or email"
              value={c.transactionBy ?? ""}
              display={user ? <StaffChip user={user} /> : <span className="whitespace-nowrap">{textCell(c.transactionBy)}</span>}
              onCommit={(text) => patchClaim(c.id, { transactionBy: text || undefined })}
            />
          );
        },
      },
      {
        id: "edit",
        header: "Actions",
        stickyRight: true,
        headClassName: "text-center",
        className: "w-16 text-center",
        cell: (c) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit claim ${c.claimId}`} onClick={() => setEditingId(c.id)}>
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit claim</TooltipContent>
          </Tooltip>
        ),
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps -- userName and changeAction only read `users` / `currentUser`
  }, [denialCodes, now, users, patchClaim, setClaimDenialCodes, updateClaim, currentUser, worklistColumns, customFields]);

  const table = useDataTable({
    data: bucketScope,
    columns,
    searchText: (c) =>
      `${c.patientName} ${c.patientAcctNo ?? ""} ${c.account ?? ""} ${Object.values(c.extra ?? {}).join(" ")} ${latestComment(c)} ${c.claimId} ${c.responsible} ${c.provider} ${c.denialCodes.join(" ")} ${c.transactionBy ?? ""} ${userName(c.ar1UserId)} ${userName(c.ar2UserId)}`,
    filter: (c) =>
      (bucket === "all" || bucketOfAge(ageInDays(c, now)) === bucket) &&
      (responsibleFilter === "all" || c.responsible === responsibleFilter) &&
      (actionFilter === "all" || c.action === actionFilter) &&
      (submitted === "all" || (submitted === "none" ? !c.submittedStatus : c.submittedStatus === submitted)) &&
      (assigneeFilter === "all" ||
        (assigneeFilter === "none"
          ? !c.ar1UserId && !c.ar2UserId
          : c.ar1UserId === assigneeFilter || c.ar2UserId === assigneeFilter)) &&
      (denialFilterLive.length === 0 || denialFilterLive.some((code) => c.denialCodes.includes(code))),
    filterKey: `${practiceFilter}|${bucket}|${responsibleFilter}|${actionFilter}|${submitted}|${assigneeFilter}|${denialFilterLive.join(",")}|${hideClosed}`,
    initialSort: { id: "patient", dir: "asc" },
    initialPageSize: 25,
  });

  const editingClaim = editingId ? (claims.find((c) => c.id === editingId) ?? null) : null;

  const lastBatch = uploadLogs.find((l) => l.type === "New");
  const description = !hydrated
    ? "Claims uploaded to your worklist."
    : claims.length === 0
      ? "Claims uploaded to your worklist."
      : `${lastBatch ? `Last batch: ${lastBatch.fileName} · uploaded ${formatDate(lastBatch.uploadedAt)} · ` : ""}${scoped.length.toLocaleString("en-US")} ${pluralize(scoped.length, "claim")}`;

  const { can } = useAuth();
  const canWrite = can("claims.write");
  const [addingClaim, setAddingClaim] = useState(false);

  const uploadButton = (
    <Button asChild size="lg">
      <Link href="/upload-claims">
        <Upload aria-hidden /> Upload claims (.xlsx)
      </Link>
    </Button>
  );

  const actions = (
    <>
      {canWrite && (
        <Button size="lg" variant="outline" className="bg-card" onClick={() => setAddingClaim(true)}>
          <Plus aria-hidden /> Add claim
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="lg" className="bg-card">
            <Download aria-hidden /> Download template <ChevronDown className="opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Template for which software?</DropdownMenuLabel>
          {softwares
            .filter((x) => x.status === "Active")
            .map((x) => (
              <DropdownMenuItem
                key={x.id}
                onSelect={async () => {
                  await downloadSoftwareTemplate(x, customFields);
                  toast.success(`${x.name} template downloaded`);
                }}
              >
                <Download /> {x.name}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="lg"
        className="bg-card"
        disabled={!hydrated || table.total === 0}
        onClick={async () => {
          await exportWorklist(table.filtered, denialCodes, users, customFields, worklistColumns);
          toast.success(`Exported ${table.total} ${pluralize(table.total, "claim")}`);
        }}
      >
        <FileDown aria-hidden /> Export worklist
      </Button>
      {uploadButton}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Worklist" description={description} actions={actions} className="gap-4" />

      {!hydrated ? (
        <Card className="gap-3 p-5">
          <Skeleton className="h-10 w-full max-w-md" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : claims.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Your worklist is empty"
            description="Upload an Excel file of claims and they'll show up here, ready to work. No file handy? Use “Try with a sample file” on the upload screen."
            action={uploadButton}
          />
        </Card>
      ) : (
        <>
          <SummaryCards claims={scoped} />

          <div className="min-w-0 space-y-4">
            <BucketTabs claims={bucketScope} value={bucket} onChange={setBucket} now={now} />
          <DataTable
            table={table}
            columns={columns}
            getRowId={(c) => c.id}
            noun="claims"
            stickyHeader
            searchPlaceholder="Patient, claim no, provider"
            emptyState={
              <EmptyState
                icon={ClipboardList}
                title="No claims match these filters"
                description="Try another bucket, responsible party, action or submitted status, or clear your search."
              />
            }
            filters={
              <>
                <LabeledSelect
                  label="Responsible:"
                  value={responsibleFilter}
                  onValueChange={setResponsible}
                  className="w-56"
                  options={[{ value: "all", label: "All" }, ...responsibleParties.map((p) => ({ value: p, label: p }))]}
                />
                <LabeledSelect
                  label="Action:"
                  value={actionFilter}
                  onValueChange={setActionFilter}
                  className="w-64"
                  options={[{ value: "all", label: "All actions" }, ...CLAIM_ACTIONS.map((a) => ({ value: a, label: a }))]}
                />
                <LabeledSelect
                  label="Submitted Status:"
                  value={submitted}
                  onValueChange={setSubmitted}
                  className="w-64"
                  options={[
                    { value: "all", label: "All" },
                    { value: "none", label: "Not submitted" },
                    ...SUBMITTED_STATUSES.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <LabeledSelect
                  label="Assigned to:"
                  value={assigneeFilter}
                  onValueChange={setAssignee}
                  className="w-60"
                  options={[
                    { value: "all", label: "Anyone" },
                    { value: "none", label: "Unassigned" },
                    ...assigneeOptions,
                  ]}
                />
                <DenialCodeFilter value={denialFilterLive} onChange={setDenialFilter} options={denialOptions} />
                <div className="flex h-9 items-center gap-2 rounded-md border bg-card px-3">
                  <Checkbox id="hide-closed" checked={hideClosed} onCheckedChange={(v) => setHideClosed(v === true)} />
                  <Label htmlFor="hide-closed" className="cursor-pointer whitespace-nowrap">
                    Hide Paid and closed
                  </Label>
                </div>
              </>
            }
          />
          </div>

          <ClaimEditDialog claim={editingClaim} onClose={() => setEditingId(null)} codes={denialCodes} users={users} now={now} customFields={customFields} />
        </>
      )}
      <AddClaimDialog open={addingClaim} onOpenChange={setAddingClaim} />
    </div>
  );
}
