import { normalizeDate } from "@/lib/dates";
import { PAID_ACTION, type Claim } from "@/lib/types";

export type BucketId = "new" | "30" | "60" | "60plus";

export const BUCKETS: { id: BucketId; label: string; short: string }[] = [
  { id: "new", label: "New", short: "New" },
  { id: "30", label: "30 Days", short: "30" },
  { id: "60", label: "60 Days", short: "60" },
  { id: "60plus", label: "More than 60 Days", short: "60+" },
];

export const isClosed = (c: Claim) => c.action === PAID_ACTION;

/** Outstanding balance: the file's balance (or the charge), and nothing once the claim is Paid and closed. */
export const balanceOf = (c: Claim) => (isClosed(c) ? 0 : (c.balance ?? c.billedAmount));

/** The aging figure from the file, else whole days since Date of Service (falling back to billed / claim date). */
export function ageInDays(c: Claim, now = Date.now()): number | null {
  if (c.aging !== undefined && Number.isFinite(c.aging)) return Math.max(0, Math.round(c.aging));
  const t = Date.parse(c.dos || c.billedDate || c.claimDate);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}

/** New: up to 20 days, 30: 21-30, 60: 31-60, 60+: older. */
export function bucketOfAge(age: number | null): BucketId {
  if (age === null || age <= 20) return "new";
  if (age <= 30) return "30";
  if (age <= 60) return "60";
  return "60plus";
}

export const bucketShort = (id: BucketId) => BUCKETS.find((b) => b.id === id)!.short;

/** Entries the team made themselves; automatic ones (AR assignment) don't count as working the claim. */
const teamEvents = (c: Claim) => (c.history ?? []).filter((e) => !e.system);

export function lastWorkedAt(c: Claim): string | undefined {
  return teamEvents(c)[0]?.at;
}

/** Open claims nobody has touched yet. */
export const isNotWorked = (c: Claim) => c.action === "New" && teamEvents(c).length === 0;

// ---------------------------------------------------------------------------
// Paid-claims matching
//
// To change how a paid file is matched to the worklist, edit `claimsForPaidRow`
// (the match key). `normalizeName` and `normalizeAcctNo` are its building blocks.
// ---------------------------------------------------------------------------

/** One data row of the client's Paid Claim file. Values are as typed; matching normalizes them. */
export interface PaidFileRow {
  /** Row number in the spreadsheet. */
  rowNumber: number;
  acctNo: string;
  patientName: string;
  serviceDate: string;
  paymentDate: string;
  transactionBy: string;
  paidAmount?: number;
}

export type PaidOutcome = "updated" | "alreadyPaid" | "notFound" | "multiple";

export interface PaidRowResult {
  row: PaidFileRow;
  outcome: PaidOutcome;
  /** Human-readable explanation, set for every outcome except "updated". */
  reason?: string;
  /** The worklist claim to mark Paid and closed (only for "updated"). */
  claimId?: string;
}

/** Account numbers compare as text without surrounding spaces or leading zeros ("038226" == 38226). */
export function normalizeAcctNo(value: string | undefined): string {
  const v = (value ?? "").trim().replace(/\.0+$/, ""); // Excel numbers can arrive as "38226.0"
  return v.replace(/^0+(?=.)/, "").toLowerCase();
}

/** Case, spacing, punctuation and "Last, First" order don't matter: "SOTE, Adam " == "adam sote". */
export function normalizeName(name: string | undefined): string {
  const n = (name ?? "").trim();
  const ordered = n.includes(",") ? n.split(",").reverse().join(" ") : n;
  return ordered
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/**
 * The match key: Patient Name + Service date. When the worklist claim has a Patient Acct No
 * (old data, manual entry) and the file gives one too, the two must agree.
 */
export function claimsForPaidRow(row: PaidFileRow, claims: Claim[]): Claim[] {
  const name = normalizeName(row.patientName);
  const dos = normalizeDate(row.serviceDate);
  const acct = normalizeAcctNo(row.acctNo);
  if (!name || !dos) return [];
  return claims.filter(
    (c) =>
      normalizeName(c.patientName) === name &&
      normalizeDate(c.dos) === dos &&
      (!acct || !c.patientAcctNo || normalizeAcctNo(c.patientAcctNo) === acct),
  );
}

/**
 * Decide what each row of a paid file does to the worklist. Pure: nothing is changed here.
 * Every row in the file counts as paid. A row that matches several claims updates none of them.
 */
export function matchPaidRows(rows: PaidFileRow[], claims: Claim[]): PaidRowResult[] {
  const used = new Set<string>();
  return rows.map((row): PaidRowResult => {
    const matches = claimsForPaidRow(row, claims);
    if (matches.length === 0) return { row, outcome: "notFound", reason: "Not found" };
    if (matches.length > 1) return { row, outcome: "multiple", reason: "Multiple matches" };
    const [claim] = matches;
    if (isClosed(claim) || used.has(claim.id)) return { row, outcome: "alreadyPaid", reason: "Already paid and closed" };
    used.add(claim.id);
    return { row, outcome: "updated", claimId: claim.id };
  });
}

export function summarizePaidResults(results: PaidRowResult[]) {
  const count = (o: PaidOutcome) => results.filter((r) => r.outcome === o).length;
  return {
    updated: count("updated"),
    alreadyPaid: count("alreadyPaid"),
    notFound: count("notFound"),
    multiple: count("multiple"),
  };
}

/** The most recent comment the team left on a claim (automatic assignment notes don't count). */
export function latestComment(c: Claim): string {
  return (c.history ?? []).find((e) => !e.system && e.comment)?.comment ?? "";
}
