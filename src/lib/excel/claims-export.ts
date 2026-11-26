import { ageInDays, balanceOf, lastWorkedAt, latestComment } from "@/lib/claims";
import { claimFieldText, fieldDef } from "@/lib/templates";
import type { Claim, CustomField, DenialCode, User, WorklistColumn } from "@/lib/types";
import { buildWorkbookFile, downloadFile } from "./write";

/**
 * Exports the given claims (typically the filtered worklist) to .xlsx.
 * The sheet follows the worklist: Patient Name and Claim No, then the columns configured in Settings (their names, order and
 * mapped fields, custom fields included), then the fixed columns, then a few extras the screen doesn't have room for.
 */
export async function exportWorklist(
  claims: Claim[],
  codes: DenialCode[],
  users: User[],
  customFields: CustomField[] = [],
  worklistColumns: WorklistColumn[] = [],
) {
  const nameOf = (id?: string) => users.find((u) => u.id === id)?.name ?? "";
  const byCode = new Map(codes.map((r) => [r.code, r.description.split("Usage:")[0].trim()]));
  const now = Date.now();

  /** One configured worklist column's value: numbers for currency / days, text otherwise. */
  const fieldValue = (c: Claim, field: string): string | number => {
    const type = fieldDef(field, customFields)?.type ?? "text";
    if (field === "aging") return ageInDays(c, now) ?? "";
    if (field === "balance") return balanceOf(c);
    const text = claimFieldText(c, field);
    if ((type === "currency" || type === "days") && text !== "") {
      const n = Number.parseFloat(text);
      return Number.isFinite(n) ? n : text;
    }
    return text;
  };

  const shown = worklistColumns.filter((wc) => wc.visible && fieldDef(wc.field, customFields));

  const columns: { header: string; value: (c: Claim) => string | number }[] = [
    { header: "Patient Name", value: (c) => c.patientName },
    { header: "Claim No", value: (c) => c.claimId },
    ...shown.map((wc) => ({ header: wc.label, value: (c: Claim) => fieldValue(c, wc.field) })),
    { header: "Denial Code", value: (c) => c.denialCodes.join(", ") },
    { header: "Denial Code Description", value: (c) => c.denialCodes.map((x) => `${x}: ${byCode.get(x) ?? ""}`).join(" | ") },
    { header: "Comment", value: (c) => latestComment(c) },
    { header: "Action", value: (c) => c.action },
    { header: "Submission Status", value: (c) => c.submittedStatus ?? "" },
    { header: "Date", value: (c) => lastWorkedAt(c)?.slice(0, 10) ?? "" },
    { header: "AR / Team", value: (c) => [nameOf(c.ar1UserId), nameOf(c.ar2UserId)].filter(Boolean).join(", ") },
    { header: "Transaction By", value: (c) => c.transactionBy ?? "" },
    { header: "Practice", value: (c) => c.practiceName },
    { header: "Rec #", value: (c) => c.rec ?? "" },
  ];

  const file = await buildWorkbookFile(
    `worklist_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Worklist",
    columns.map((c) => c.header),
    claims.map((c) => columns.map((col) => col.value(c))),
  );
  downloadFile(file);
}
