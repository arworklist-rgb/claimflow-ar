import { matchColumn } from "./columns";

export { normalizeDate } from "@/lib/dates";

export interface ParsedSheet {
  sheetName: string;
  /** Canonical column names that were found in the file. */
  columns: string[];
  /** Expected columns that were not found. */
  missing: string[];
  /** One record per data row, keyed by canonical column name, values as trimmed strings. */
  rows: Record<string, string>[];
  /** Sheet row number (as shown in Excel) of each entry in `rows`. */
  rowNumbers: number[];
}

export class SpreadsheetError extends Error {}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

/**
 * Parse the first sheet of an .xlsx / .xls / .csv file in the browser and map its
 * headers onto the expected columns (tolerating case, spacing and common aliases).
 */
export async function parseSpreadsheet(
  file: File,
  expected: readonly string[],
  /** Columns that are mapped when present but not reported as missing. */
  optional: readonly string[] = [],
  /**
   * For files that may have no header row at all (the denial codes list): when no header is recognised, the
   * first columns of the sheet are read in this order instead of failing.
   */
  headerlessColumns?: readonly string[],
  /** Other accepted spellings per column (a billing software's own naming). Defaults to the built-in list. */
  aliases?: Record<string, string[]>,
): Promise<ParsedSheet> {
  const recognised = [...expected, ...optional];
  // SheetJS is large, so it is only loaded when a file is actually parsed.
  const XLSX = await import("xlsx");

  let matrix: unknown[][];
  let sheetName: string;
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), {
      type: "array",
      cellDates: true,
      UTC: true,
    });
    sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new SpreadsheetError("The workbook has no sheets.");
    matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      blankrows: true, // keep blank rows so indexes line up with Excel's row numbers
      raw: true,
      UTC: true,
    });
  } catch (err) {
    if (err instanceof SpreadsheetError) throw err;
    throw new SpreadsheetError("We couldn't read this file. Is it a valid Excel or CSV file?");
  }

  // The header row is the first row that matches at least one expected column.
  const headerIndex = matrix.findIndex((row) =>
    row.some((cell) => matchColumn(cellToString(cell), recognised, aliases)),
  );
  if (headerIndex === -1 && headerlessColumns) {
    const rowsOut: Record<string, string>[] = [];
    const rowNumbers: number[] = [];
    matrix.forEach((cells, index) => {
      const record: Record<string, string> = {};
      headerlessColumns.forEach((col, i) => (record[col] = cellToString(cells[i])));
      if (Object.values(record).every((v) => v === "")) return; // blank rows are skipped
      rowsOut.push(record);
      rowNumbers.push(index + 1);
    });
    if (rowsOut.length === 0) throw new SpreadsheetError("No data rows were found in this file.");
    return { sheetName, columns: [...headerlessColumns], missing: [], rows: rowsOut, rowNumbers };
  }
  if (headerIndex === -1) {
    throw new SpreadsheetError(
      `No recognizable header row found. Expected columns: ${expected.join(", ")}.`,
    );
  }

  const headerRow = matrix[headerIndex].map((cell) => matchColumn(cellToString(cell), recognised, aliases));
  const columns = [...new Set(headerRow.filter((c): c is string => c !== null))];
  const missing = expected.filter((c) => !columns.includes(c));

  const parsedRows = matrix
    .map((cells, index) => {
      const record: Record<string, string> = {};
      headerRow.forEach((col, i) => {
        if (col && !(col in record)) record[col] = cellToString(cells[i]);
      });
      return { record, rowNumber: index + 1 };
    })
    .filter(({ rowNumber }) => rowNumber > headerIndex + 1)
    .filter(({ record }) => Object.values(record).some((v) => v !== ""));
  const rows = parsedRows.map((r) => r.record);
  const rowNumbers = parsedRows.map((r) => r.rowNumber);

  if (rows.length === 0) throw new SpreadsheetError("No data rows were found in this file.");

  return { sheetName, columns, missing, rows, rowNumbers };
}

export function parseAmount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const negative = /^\(.*\)$/.test(value.trim());
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return undefined;
  return negative ? -Math.abs(n) : n;
}
