import type { StyledColumn } from "./write";
import { buildStyledWorkbookFile, downloadFile } from "./write";

const DATE = "mm/dd/yyyy";
const MONEY = "$#,##0.00";

/** The client's Paid Claim template: same columns, same order, green header row. */
export const PAID_TEMPLATE_COLUMNS: StyledColumn[] = [
  { header: "Patient Acct No", width: 16, numFmt: "@" },
  { header: "Patient Name", width: 24 },
  { header: "Service date", width: 14, numFmt: DATE },
  { header: "Payment Date", width: 14, numFmt: DATE },
  { header: "Transaction By", width: 20 },
  { header: "Paid Amount", width: 14, numFmt: MONEY },
];

/** Blank paid-claim template with one example row. */
export async function downloadPaidClaimsTemplate() {
  const file = await buildStyledWorkbookFile("paid_claim_template.xlsx", "Paid Claims", PAID_TEMPLATE_COLUMNS, [
    ["38226", "Adam Sote", new Date(Date.UTC(2026, 0, 19)), new Date(Date.UTC(2026, 1, 12)), "Ananya Kapoor", 152.4],
  ]);
  downloadFile(file);
}
