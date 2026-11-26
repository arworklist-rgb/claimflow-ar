// The New Claims template is no longer fixed: each billing software has its own (Settings > Upload Templates).

/** The client's Paid Claim template, in file order. Every row in the file is treated as paid. */
export const PAID_CLAIM_COLUMNS = [
  "Patient Acct No",
  "Patient Name",
  "Service date",
  "Payment Date",
  "Transaction By",
  "Paid Amount",
] as const;
/** Needed to find the claim; the rest only warn when missing. */
export const PAID_CLAIM_REQUIRED_COLUMNS = ["Patient Name", "Service date"] as const;
export const PAID_CLAIM_OPTIONAL_COLUMNS = PAID_CLAIM_COLUMNS.filter(
  (c) => !(PAID_CLAIM_REQUIRED_COLUMNS as readonly string[]).includes(c),
);

/** The client's Denial codes file: two columns, with or without a header row. */
export const DENIAL_CODE_COLUMNS = ["Denial Code", "Description"] as const;
/** Read when a header names them, but not needed. */
export const DENIAL_CODE_OPTIONAL_COLUMNS = ["Category", "Status"] as const;


/** Lower-case, alphanumeric-only form of a header, used for tolerant matching. */
export const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Extra header spellings we accept per canonical column (all pre-normalized). */
const ALIASES: Record<string, string[]> = {
  "Patient Name": ["patientname", "patient"],
  "Claim No": ["claimno", "claimnumber", "claimid", "claim"],
  "Claim Date": ["claimdate", "dateofclaim"],
  Responsible: ["responsible", "responsibleparty", "payer", "payername", "insurance"],
  Provider: ["provider", "renderingprovider", "providername"],
  "Service date": ["servicedate", "dos", "dateofservice"],
  "Billed date": ["billeddate", "billdate", "datebilled"],
  aging: ["aging", "age", "agedays", "daysaging", "daysinar"],
  Procedure: ["procedure", "cpt", "cptcode", "procedurecode"],
  Charge: ["charge", "charges", "billedamount", "chargeamount", "amountbilled"],
  Balance: ["balance", "balancedue", "outstanding"],
  "Patient Acct No": ["patientacctno", "patientaccountno", "patientaccountnumber", "patientacct", "accountno", "acctno", "accountnumber", "acct", "patientaccount"],
  "Payment Date": ["paymentdate", "paiddate", "datepaid", "datereceived"],
  "Transaction By": ["transactionby", "transactedby", "postedby", "enteredby"],
  "Paid Amount": ["paidamount", "paid", "amountpaid", "payment", "paymentamount"],
  "Denial Code": ["denialcode", "code", "carc", "carccode", "reasoncode"],
  Description: ["description", "denialreason", "reason", "denialdescription", "codedescription"],
  Category: ["category"],
  Status: ["status"],
};

/**
 * Resolve a raw header cell to one of the expected columns, or null. `aliases` maps a column to the other
 * (pre-normalized) spellings it accepts; the built-in list is used when none is given.
 */
export function matchColumn(raw: string, expected: readonly string[], aliases: Record<string, string[]> = ALIASES): string | null {
  const key = normalizeHeader(raw);
  if (!key) return null;
  for (const col of expected) {
    if (normalizeHeader(col) === key || aliases[col]?.includes(key)) return col;
  }
  return null;
}
