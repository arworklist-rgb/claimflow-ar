import { balanceOf, isClosed, normalizeName } from "@/lib/claims";
import { normalizeDate } from "@/lib/dates";
import type { Claim, CustomField, Software, User } from "@/lib/types";
import { shownColumns } from "@/lib/templates";
import { softwareColumns } from "./software-template";
import { PAID_TEMPLATE_COLUMNS } from "./paid-template";
import { buildStyledWorkbookFile } from "./write";

const PATIENTS = [
  "Olivia Bennett", "Marcus Hall", "Sofia Ramirez", "Ethan Brooks", "Priya Natarajan",
  "James Whitaker", "Chloe Nguyen", "Daniel Foster", "Hannah Kowalski", "Isaiah Coleman",
  "Mia Fernandez", "Lucas Anderson", "Grace Thompson", "Noah Patel", "Ava Mitchell",
  "William Reyes", "Emma Schwartz", "Benjamin Cho", "Layla Hassan", "Henry Dubois",
  "Zoe Campbell", "Oliver Grant", "Amelia Park", "Samuel Ortiz",
];

const PROVIDERS = ["Dr. Emily Carter", "Dr. Raj Patel", "Dr. Lena Okoro", "Dr. Marcus Webb", "Dr. Sofia Alvarez"];

/** Who owes the balance: a payer, or the patient. */
const RESPONSIBLE = ["Insurance", "Insurance", "Patient", "Aetna", "UnitedHealthcare", "BCBS", "Cigna", "Medicare", "Humana"];

/** [Procedure (CPT), typical charge] */
const PROCEDURES: [string, number][] = [
  ["99213", 135], ["99214", 195], ["99204", 245], ["99395", 215], ["93000", 62],
  ["80053", 41], ["85025", 33], ["36415", 17], ["71046", 124], ["97110", 88],
  ["20610", 232], ["96372", 46], ["81002", 14], ["90471", 38], ["99406", 52],
];

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const between = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const money = (n: number) => Math.round(n * 100) / 100;
const utc = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

/**
 * 25 realistic worklist rows laid out in the chosen billing software's own template: its column names, its
 * order, and only the fields it has. Claim No is text with a leading zero, `aging` is filled in for most rows
 * (the app calculates the rest), and the last two rows are one patient billed twice on the same day, so a paid
 * file can show a "Multiple matches" row.
 */
export async function buildNewClaimsSample(software: Software, customFields: CustomField[]): Promise<File> {
  const batch = Date.now().toString().slice(-5);
  const records: Record<string, string | number | Date | null>[] = [];
  for (let i = 0; i < 25; i++) {
    const twin = i === 24 && records[23]; // same patient and service date as row 24
    const [procedure, base] = pick(PROCEDURES);
    const dosAgo = between(18, 130);
    const claimAgo = Math.max(1, dosAgo - between(1, 5));
    const billedAgo = Math.max(1, claimAgo - between(0, 3));
    const charge = money(base * (0.9 + Math.random() * 0.4));
    const responsible = pick(RESPONSIBLE);
    const balance = responsible === "Patient" || Math.random() < 0.35 ? money(charge * (0.25 + Math.random() * 0.6)) : charge;
    const rec: Record<string, string | number | Date | null> = {
      patientName: twin ? (twin as typeof rec).patientName : PATIENTS[i % PATIENTS.length],
      claimId: `0${batch}${String(i + 1).padStart(2, "0")}`,
      account: `A-${between(10000, 99999)}`,
      patientAcctNo: String(between(30000, 49999)),
      claimDate: twin ? (twin as typeof rec).claimDate : utc(isoDaysAgo(claimAgo)),
      responsible: twin ? (twin as typeof rec).responsible : responsible,
      provider: twin ? (twin as typeof rec).provider : pick(PROVIDERS),
      dos: twin ? (twin as typeof rec).dos : utc(isoDaysAgo(dosAgo)),
      billedDate: twin ? (twin as typeof rec).billedDate : utc(isoDaysAgo(billedAgo)),
      aging: i % 5 === 4 || twin ? null : billedAgo, // blank aging: calculated from the billed date
      cpt: procedure,
      billedAmount: charge,
      balance,
      paidAmount: null,
    };
    for (const f of customFields) {
      rec[f.key] = f.type === "date" ? utc(isoDaysAgo(between(5, 90))) : f.type === "currency" ? money(between(10, 300)) : f.type === "days" ? between(1, 90) : `${f.label} ${between(1, 9)}`;
    }
    records.push(rec);
  }
  const rows = records.map((rec) => shownColumns(software).map((c) => rec[c.field] ?? null));
  const slug = software.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
  return buildStyledWorkbookFile(`sample_new_worklist_${slug}_${batch}.xlsx`, "Worklist", softwareColumns(software, customFields), rows);
}

const usDate = (isoDate: string) => `${isoDate.slice(5, 7)}/${isoDate.slice(8, 10)}/${isoDate.slice(0, 4)}`;
const excelSerial = (isoDate: string) => (utc(isoDate).getTime() - Date.UTC(1899, 11, 30)) / 86_400_000;
const longDate = (isoDate: string) =>
  utc(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** The same date written five different ways, to show the matcher doesn't care how Excel stored it. */
function dateCell(isoDate: string, variant: number): string | number | Date {
  switch (variant % 5) {
    case 0:
      return utc(isoDate); // a real Excel date
    case 1:
      return usDate(isoDate); // text MM/DD/YYYY
    case 2:
      return excelSerial(isoDate); // bare serial number, e.g. 46041
    case 3:
      return isoDate; // text YYYY-MM-DD
    default:
      return longDate(isoDate); // text "Jan 19, 2026"
  }
}

/** "Olivia Bennett" written the ways billing systems actually export it. */
function nameVariant(name: string, variant: number): string {
  const [first, ...rest] = name.split(" ");
  const last = rest.join(" ");
  switch (variant % 4) {
    case 1:
      return `${last}, ${first}`;
    case 2:
      return name.toUpperCase();
    case 3:
      return `  ${name.toLowerCase()} `;
    default:
      return name;
  }
}

/**
 * About 20 rows in the client's Paid Claim layout, built from claims already in the worklist so a test upload
 * really finds matches (Patient Name + Service date): most rows match one claim, one matches two claims
 * (a patient billed twice on the same day), two don't exist, and, when some claims are already
 * Paid and closed, one row hits those.
 */
export async function buildPaidClaimsSample(claims: Claim[], users: User[]): Promise<File> {
  const batch = Date.now().toString().slice(-5);
  const keyOf = (c: Claim) => `${normalizeName(c.patientName)}|${normalizeDate(c.dos)}`;
  const counts = new Map<string, number>();
  claims.forEach((c) => counts.set(keyOf(c), (counts.get(keyOf(c)) ?? 0) + 1));

  const unique = (c: Claim) => counts.get(keyOf(c)) === 1;
  const matched = shuffle(claims.filter((c) => !isClosed(c) && unique(c))).slice(0, 16);
  const twin = claims.find((c) => !isClosed(c) && (counts.get(keyOf(c)) ?? 0) > 1);
  const alreadyPaid = claims.find((c) => isClosed(c) && unique(c));

  const staffNames = users.filter((u) => u.status === "Active").map((u) => u.name);
  const staffEmails = users.filter((u) => u.status === "Active").map((u) => u.email);
  const transactionBy = (i: number) =>
    [staffNames[i % staffNames.length], staffEmails[(i + 3) % staffEmails.length], "ERA auto-post", "Lockbox", staffNames[(i + 5) % staffNames.length]][i % 5];

  const specs: { claim?: Claim; name?: string; dos?: string; acct?: string }[] = [
    ...matched.map((claim) => ({ claim })),
    ...(twin ? [{ claim: twin }] : []),
    ...(alreadyPaid ? [{ claim: alreadyPaid }] : []),
    { name: "Marisol Dietrich", dos: isoDaysAgo(45), acct: `91${batch.slice(-3)}` },
    { name: "Peter Abernathy", dos: isoDaysAgo(60), acct: `92${batch.slice(-3)}` },
  ];

  const rows = shuffle(specs).map((spec, i) => {
    const c = spec.claim;
    const dos = spec.dos ?? c?.dos ?? "";
    const amount = c ? money(balanceOf(c) > 0 ? balanceOf(c) * (0.7 + Math.random() * 0.3) : c.billedAmount * 0.8) : between(40, 220);
    return [
      spec.acct ?? c?.patientAcctNo ?? (i % 4 === 0 ? String(between(30000, 49999)) : ""), // the worklist template has no acct no
      nameVariant(spec.name ?? c?.patientName ?? "", i),
      dos ? dateCell(dos, i) : "",
      utc(isoDaysAgo(between(0, 12))),
      transactionBy(i),
      i % 6 === 5 ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : amount, // currency text or a number
    ];
  });

  return buildStyledWorkbookFile(`sample_paid_claims_${batch}.xlsx`, "Paid Claims", PAID_TEMPLATE_COLUMNS, rows);
}

const SAMPLE_FILE_PREFIX = "sample_new_worklist_";

/** True for files made by "Try with a sample file" (they have no denial codes, because the template has none). */
export const isSampleWorklistFile = (fileName: string) => fileName.startsWith(SAMPLE_FILE_PREFIX);

/** Realistic codes from the client's list that the demo hands out. */
const SAMPLE_DENIAL_CODES = ["16", "197", "29", "50", "96", "4", "11", "22", "27", "252"];

/**
 * Denial codes live in the app, not in the Excel template. So a sample upload gives about half its claims
 * one or two realistic codes (only codes that exist and are active), to show the Denial Code column working.
 */
export function withSampleDenialCodes(claims: Claim[], activeCodes: Set<string>): Claim[] {
  const usable = SAMPLE_DENIAL_CODES.filter((c) => activeCodes.has(c));
  if (usable.length === 0) return claims;
  return claims.map((claim, i) => {
    if (i % 2 === 1) return claim; // about half the claims
    const first = usable[(i * 3) % usable.length];
    const second = i % 6 === 0 ? usable[(i * 3 + 4) % usable.length] : undefined;
    return { ...claim, denialCodes: [...new Set([first, second].filter((c): c is string => !!c))] };
  });
}
