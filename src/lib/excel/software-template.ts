import type { CustomField, FieldType, Software } from "@/lib/types";
import { fieldDef, shownColumns } from "@/lib/templates";
import { buildStyledWorkbookFile, downloadFile, type StyledColumn } from "./write";

const DATE = "mm/dd/yyyy";
const MONEY = "$#,##0.00";
/** Fields that are identifiers: keep their leading zeros by writing them as text. */
const TEXT_IDS = new Set(["claimId", "cpt", "patientAcctNo", "account"]);

function formatFor(field: string, type: FieldType): Pick<StyledColumn, "width" | "numFmt"> {
  if (TEXT_IDS.has(field)) return { width: 16, numFmt: "@" };
  switch (type) {
    case "date":
      return { width: 14, numFmt: DATE };
    case "currency":
      return { width: 13, numFmt: MONEY };
    case "days":
      return { width: 10, numFmt: "0" };
    default:
      return { width: field === "patientName" ? 24 : 20 };
  }
}

/** The columns of a software's template, in order, with the formats its fields need. */
export function softwareColumns(software: Software, custom: CustomField[]): StyledColumn[] {
  return shownColumns(software).map((c) => ({
    header: c.header,
    ...formatFor(c.field, fieldDef(c.field, custom)?.type ?? "text"),
  }));
}

const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/** An example value for a field, so the downloaded template shows what goes where. */
export function exampleValue(field: string, type: FieldType, label: string): string | number | Date {
  switch (field) {
    case "patientName":
      return "Jane Doe";
    case "claimId":
      return "0010001";
    case "account":
      return "A-20417";
    case "patientAcctNo":
      return "30417";
    case "responsible":
      return "Insurance";
    case "provider":
      return "Dr. Emily Carter";
    case "cpt":
      return "99214";
    case "claimDate":
      return day(2026, 9, 8);
    case "dos":
      return day(2026, 9, 2);
    case "billedDate":
      return day(2026, 9, 9);
    case "aging":
      return 56;
    case "billedAmount":
    case "balance":
      return 195;
    case "paidAmount":
      return 0;
  }
  if (type === "date") return day(2026, 9, 2);
  if (type === "currency") return 100;
  if (type === "days") return 30;
  return `Example ${label}`;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** The upload template for a software: its own column names and order, green header row, one example row. */
export async function buildSoftwareTemplate(software: Software, custom: CustomField[]): Promise<File> {
  const row = shownColumns(software).map((c) => {
    const def = fieldDef(c.field, custom);
    return exampleValue(c.field, def?.type ?? "text", def?.label ?? c.header);
  });
  return buildStyledWorkbookFile(`${slug(software.name)}_worklist_template.xlsx`, "Worklist", softwareColumns(software, custom), [row]);
}

export async function downloadSoftwareTemplate(software: Software, custom: CustomField[]) {
  downloadFile(await buildSoftwareTemplate(software, custom));
}
