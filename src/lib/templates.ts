import type { Claim, CustomField, FieldType, Software, SoftwareColumn, WorklistColumn } from "@/lib/types";

/** A field a template column can feed and a worklist column can show. */
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  builtIn: boolean;
}

/** The "software dropdown" list from the client's sheet: every field an upload template can map to. */
export const BUILT_IN_FIELDS: FieldDef[] = [
  { key: "account", label: "Account", type: "text", builtIn: true },
  { key: "patientName", label: "Patient", type: "text", builtIn: true },
  { key: "patientAcctNo", label: "Patient Acct No", type: "text", builtIn: true },
  { key: "claimDate", label: "Claim Date", type: "date", builtIn: true },
  { key: "claimId", label: "Claim No", type: "text", builtIn: true },
  { key: "responsible", label: "Responsible", type: "text", builtIn: true },
  { key: "provider", label: "Provider", type: "text", builtIn: true },
  { key: "dos", label: "Service date", type: "date", builtIn: true },
  { key: "billedDate", label: "Billed date", type: "date", builtIn: true },
  { key: "aging", label: "Aging", type: "days", builtIn: true },
  { key: "cpt", label: "Procedure", type: "text", builtIn: true },
  { key: "billedAmount", label: "Charge", type: "currency", builtIn: true },
  { key: "balance", label: "Balance", type: "currency", builtIn: true },
  { key: "paidAmount", label: "Paid Amount", type: "currency", builtIn: true },
];

/** Every template has to be able to create a claim, so these three fields must be mapped (and are required). */
export const REQUIRED_FIELD_KEYS = ["patientName", "claimId", "dos"] as const;

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  date: "Date",
  days: "Number of days",
  currency: "Currency",
};

export const allFields = (custom: CustomField[]): FieldDef[] => [
  ...BUILT_IN_FIELDS,
  ...custom.map((c): FieldDef => ({ key: c.key, label: c.label, type: c.type, builtIn: false })),
];

export const fieldDef = (key: string, custom: CustomField[]): FieldDef | undefined => allFields(custom).find((f) => f.key === key);

/** A claim's raw value for a field (built-in or custom), as text. */
export function claimFieldText(claim: Claim, key: string): string {
  switch (key) {
    case "account":
      return claim.account ?? "";
    case "patientName":
      return claim.patientName;
    case "patientAcctNo":
      return claim.patientAcctNo ?? "";
    case "claimDate":
      return claim.claimDate;
    case "claimId":
      return claim.claimId;
    case "responsible":
      return claim.responsible;
    case "provider":
      return claim.provider;
    case "dos":
      return claim.dos;
    case "billedDate":
      return claim.billedDate;
    case "aging":
      return claim.aging === undefined ? "" : String(claim.aging);
    case "cpt":
      return claim.cpt;
    case "billedAmount":
      return String(claim.billedAmount);
    case "balance":
      return claim.balance === undefined ? "" : String(claim.balance);
    case "paidAmount":
      return claim.paidAmount === undefined ? "" : String(claim.paidAmount);
    default:
      return claim.extra?.[key] ?? "";
  }
}

const normHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

export const MANUAL_DATA_INPUT = "Manual data input";
export const isManualMapping = (c: Pick<SoftwareColumn, "header">) =>
  c.header.trim().toLowerCase() === MANUAL_DATA_INPUT.toLowerCase();

/** The columns a software's template actually uses (hidden or manual-input ones are left out). */
export const shownColumns = (software: Pick<Software, "columns">): SoftwareColumn[] =>
  software.columns.filter((c) => !c.hidden && !isManualMapping(c));

/** Column names a file may use for a software column, normalized for tolerant matching. */
export function softwareAliasMap(software: Software): Record<string, string[]> {
  return Object.fromEntries(shownColumns(software).map((c) => [c.header, c.aliases.map(normHeader).filter(Boolean)]));
}

/** Headers a file must have (columns marked required, or mapped to a field every claim needs). */
export function requiredHeaders(software: Software): string[] {
  return shownColumns(software).filter((c) => isRequired(c)).map((c) => c.header);
}
export const optionalHeaders = (software: Software) => shownColumns(software).filter((c) => !isRequired(c)).map((c) => c.header);
export const isRequired = (c: SoftwareColumn) => c.required || (REQUIRED_FIELD_KEYS as readonly string[]).includes(c.field);

/** header -> field type, for formatting preview cells. */
export function headerTypes(software: Software, custom: CustomField[]): Record<string, FieldType> {
  const out: Record<string, FieldType> = {};
  for (const c of shownColumns(software)) out[c.header] = fieldDef(c.field, custom)?.type ?? "text";
  return out;
}

/** Problems that stop a software template from being saved. Empty means it's valid. */
export function validateSoftware(
  software: Pick<Software, "name" | "columns">,
  custom: CustomField[],
  others: Software[] = [],
  selfId?: string,
): string[] {
  const errors: string[] = [];
  const name = software.name.trim();
  if (!name) errors.push("Enter a software name.");
  else if (others.some((o) => o.id !== selfId && o.name.trim().toLowerCase() === name.toLowerCase())) errors.push(`“${name}” already exists.`);

  const seen = new Map<string, number>();
  software.columns.forEach((c, i) => {
    const row = i + 1;
    if (!c.header.trim()) errors.push(`Column ${row}: enter the column name.`);
    else if (!isManualMapping(c)) {
      for (const spelling of c.hidden ? [] : [c.header, ...c.aliases]) {
        const key = normHeader(spelling);
        if (!key) continue;
        const prev = seen.get(key);
        if (prev !== undefined && prev !== i) errors.push(`Column ${row}: “${spelling}” is already used by column ${prev + 1}.`);
        else seen.set(key, i);
      }
    }
    if (!c.field.trim()) errors.push(`Column ${row}: choose which field it maps to.`);
  });
  for (const key of REQUIRED_FIELD_KEYS) {
    if (!shownColumns(software).some((c) => c.field === key)) {
      errors.push(`Map a column to ${BUILT_IN_FIELDS.find((f) => f.key === key)!.label}: every claim needs it.`);
    }
  }
  return errors;
}

export const uidShort = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/** Sensible starting spot for the data columns of the worklist (the client's "Column 1..12"). */
export const DEFAULT_WORKLIST_COLUMNS: WorklistColumn[] = [
  { id: "wc-account", label: "Account", field: "account", visible: true },
  { id: "wc-acct-no", label: "Patient Acct No", field: "patientAcctNo", visible: true },
  { id: "wc-claim-date", label: "Claim Date", field: "claimDate", visible: true },
  { id: "wc-responsible", label: "Responsible", field: "responsible", visible: true },
  { id: "wc-provider", label: "Provider", field: "provider", visible: true },
  { id: "wc-dos", label: "Service date", field: "dos", visible: true },
  { id: "wc-billed", label: "Billed date", field: "billedDate", visible: true },
  { id: "wc-aging", label: "Aging", field: "aging", visible: true },
  { id: "wc-procedure", label: "Procedure", field: "cpt", visible: true },
  { id: "wc-charge", label: "Charge", field: "billedAmount", visible: true },
  { id: "wc-balance", label: "Balance", field: "balance", visible: true },
  { id: "wc-paid", label: "Paid Amount", field: "paidAmount", visible: true },
];
