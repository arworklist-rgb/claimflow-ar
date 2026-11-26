import { DENIAL_CATEGORIES, type DenialCategory, type DenialCode, type Status } from "@/lib/types";

export type ImportRowState = "New" | "Update" | "Error";

export interface DenialImportRow {
  line: number;
  state: ImportRowState;
  message?: string;
  data: { code: string; description: string; category: string; status: string };
  /** Present for New / Update rows. Category / status are left out when the file doesn't give them. */
  value?: { code: string; description: string; category?: DenialCategory; status?: Status };
}

const CATEGORY_LOOKUP = new Map(DENIAL_CATEGORIES.map((c) => [c.toLowerCase(), c]));

/**
 * Classify each parsed row against the existing codes: New, Update or Error.
 * `fileRows` are the rows of the sheet in order, so "line" matches the spreadsheet's row number.
 */
export function classifyDenialRows(
  rows: Record<string, string>[],
  existing: DenialCode[],
  rowNumbers: number[] = [],
): DenialImportRow[] {
  const existingCodes = new Set(existing.map((r) => r.code.toLowerCase()));
  const seenInFile = new Set<string>();

  return rows.map((row, i) => {
    const data = {
      code: (row["Denial Code"] ?? "").trim(),
      description: (row["Description"] ?? "").trim(),
      category: (row["Category"] ?? "").trim(),
      status: (row["Status"] ?? "").trim(),
    };
    const base = { line: rowNumbers[i] ?? i + 1, data };

    const missing: string[] = [];
    if (!data.code) missing.push("Denial Code");
    if (!data.description) missing.push("Description");
    if (missing.length > 0) return { ...base, state: "Error", message: `Missing ${missing.join(", ")}` };
    if (/\s/.test(data.code)) return { ...base, state: "Error", message: "Codes can't contain spaces" };

    let category: DenialCategory | undefined;
    if (data.category) {
      category = CATEGORY_LOOKUP.get(data.category.toLowerCase());
      if (!category) return { ...base, state: "Error", message: `Unknown category "${data.category}"` };
    }

    const statusKey = data.status.toLowerCase();
    if (statusKey && statusKey !== "active" && statusKey !== "inactive") {
      return { ...base, state: "Error", message: "Status must be Active or Inactive" };
    }
    const status: Status | undefined = statusKey ? (statusKey === "inactive" ? "Inactive" : "Active") : undefined;

    const codeKey = data.code.toLowerCase();
    if (seenInFile.has(codeKey)) return { ...base, state: "Error", message: "Duplicate code in this file" };
    seenInFile.add(codeKey);

    // Codes are stored exactly as written ("B10", "197"); only the case-insensitive match decides New vs Update.
    const value = { code: data.code, description: data.description, category, status };
    return { ...base, state: existingCodes.has(codeKey) ? "Update" : "New", value };
  });
}
