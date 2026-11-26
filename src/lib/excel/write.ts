/** Build an .xlsx File fully in memory from a header row and data rows. */
export async function buildWorkbookFile(
  fileName: string,
  sheetName: string,
  header: readonly string[],
  rows: (string | number)[][],
  columnWidths?: number[],
): Promise<File> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([[...header], ...rows]);
  if (columnWidths) sheet["!cols"] = columnWidths.map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([bytes], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Trigger a browser download for an in-memory file. */
export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface StyledColumn {
  header: string;
  width?: number;
  /** Excel number format for the column's data cells, e.g. "mmm d, yyyy". */
  numFmt?: string;
}

/** Excel's own "light green" and "yellow" header fills (the client's templates use green). */
export const HEADER_GREEN = "FF92D050";
export const HEADER_YELLOW = "FFFFFF00";

/**
 * Like buildWorkbookFile, but with a bold, coloured header row (green by default) (SheetJS' free build can't style cells,
 * so this uses ExcelJS, loaded only when needed). Date values are written as real Excel dates.
 */
export async function buildStyledWorkbookFile(
  fileName: string,
  sheetName: string,
  columns: StyledColumn[],
  rows: (string | number | Date | null)[][],
  headerColor: string = HEADER_GREEN,
): Promise<File> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, width: c.width ?? 16, style: c.numFmt ? { numFmt: c.numFmt } : {} }));
  rows.forEach((row) => sheet.addRow(row));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF000000" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF7F7F7F" } } };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const bytes = await workbook.xlsx.writeBuffer();
  return new File([bytes as BlobPart], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
