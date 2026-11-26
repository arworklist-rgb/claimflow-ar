import type { Claim, CustomField, Practice, Software } from "@/lib/types";
import { DEFAULT_ACTION } from "@/lib/types";
import type { PaidFileRow } from "@/lib/claims";
import { uid } from "@/lib/store/demo-store";
import { shownColumns } from "@/lib/templates";
import { normalizeDate, parseAmount } from "./parse";

/** A whole number of days from a cell, or undefined when blank / not a number (the app then calculates it). */
function parseDays(value: string | undefined): number | undefined {
  const n = Number.parseFloat((value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
}

/**
 * Convert parsed rows into claims using the chosen billing software's template: each column's value goes to the
 * field that column is mapped to. Claim No is kept as typed (text, leading zeros intact); rows without one are
 * skipped. If two columns feed the same field, the first one with a value wins. Fields the file doesn't give are
 * left empty.
 */
export function rowsToClaims(
  rows: Record<string, string>[],
  practice: Practice,
  uploadId: string,
  software: Software,
  customFields: CustomField[],
): { claims: Claim[]; skipped: number } {
  const claims: Claim[] = [];
  let skipped = 0;
  for (const row of rows) {
    const v: Record<string, string> = {};
    for (const col of shownColumns(software)) {
      const raw = row[col.header]?.trim();
      if (raw && !(col.field in v)) v[col.field] = raw;
    }
    const claimId = v.claimId?.trim();
    if (!claimId) {
      skipped++;
      continue;
    }

    const extra: Record<string, string> = {};
    for (const f of customFields) {
      const raw = v[f.key];
      if (!raw) continue;
      extra[f.key] =
        f.type === "date" ? normalizeDate(raw) : f.type === "currency" ? String(parseAmount(raw) ?? raw) : f.type === "days" ? String(parseDays(raw) ?? raw) : raw;
    }

    claims.push({
      id: uid("clm"),
      claimId,
      patientName: v.patientName ?? "",
      account: v.account || undefined,
      patientAcctNo: v.patientAcctNo || undefined,
      claimDate: normalizeDate(v.claimDate),
      responsible: v.responsible ?? "",
      provider: v.provider ?? "",
      dos: normalizeDate(v.dos),
      billedDate: normalizeDate(v.billedDate),
      aging: parseDays(v.aging),
      cpt: v.cpt ?? "",
      billedAmount: parseAmount(v.billedAmount) ?? 0,
      balance: parseAmount(v.balance),
      paidAmount: parseAmount(v.paidAmount),
      denialCodes: [],
      practiceId: practice.id,
      practiceName: practice.name,
      action: DEFAULT_ACTION,
      uploadId,
      softwareId: software.id,
      extra: Object.keys(extra).length ? extra : undefined,
    });
  }
  return { claims, skipped };
}

/** Convert parsed "Paid Claim" rows into rows the matcher understands (raw values; the matcher normalizes). */
export function rowsToPaidFileRows(rows: Record<string, string>[], rowNumbers: number[]): PaidFileRow[] {
  return rows.map((row, i) => ({
    rowNumber: rowNumbers[i] ?? i + 2,
    acctNo: row["Patient Acct No"] ?? "",
    patientName: row["Patient Name"] ?? "",
    serviceDate: row["Service date"] ?? "",
    paymentDate: row["Payment Date"] ?? "",
    transactionBy: row["Transaction By"] ?? "",
    paidAmount: parseAmount(row["Paid Amount"]),
  }));
}
