export type Status = "Active" | "Inactive";

export type UserRole = "Admin" | "AR Specialist" | "Billing Manager" | "Coder";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: Status;
  /** Index into the avatar palette so every user keeps a stable colour. */
  colorIndex: number;
}

export interface Practice {
  id: string;
  /** Human-facing identifier, e.g. PR-1001. */
  code: string;
  name: string;
  npi?: string;
  /** Billing software template tied to this practice. */
  softwareId?: string;
  status: Status;
  userIds: string[];
  /** ISO date (yyyy-mm-dd or full ISO). */
  createdAt: string;
}

export const DENIAL_CATEGORIES = [
  "Authorization",
  "Missing Information",
  "Coverage",
  "Duplicate",
  "Non-Covered Service",
  "Benefit Limit",
  "Coding",
  "Network",
  "Timely Filing",
  "Patient Responsibility",
  "Other",
] as const;

export type DenialCategory = (typeof DENIAL_CATEGORIES)[number];

export interface DenialCode {
  id: string;
  code: string;
  description: string;
  category: DenialCategory;
  status: Status;
}

export type ClaimStaffSlot = "ar1" | "ar2";

/** What the team has done / is doing with a claim. Order is the order shown in dropdowns. */
export const CLAIM_ACTIONS = [
  "Resubmitted",
  "Write off",
  "Patient Balance",
  "Paid and closed",
  "Set to pay",
  "New",
  "Inprocess",
  "Query",
  "Posting error corrected",
  "EOB sent",
] as const;
export type ClaimAction = (typeof CLAIM_ACTIONS)[number];

/** The action a paid-claims file sets, and the one that closes a claim. */
export const PAID_ACTION: ClaimAction = "Paid and closed";
/** The action every freshly uploaded claim starts with. */
export const DEFAULT_ACTION: ClaimAction = "New";

export const SUBMITTED_STATUSES = ["First", "Second", "Third"] as const;
export type SubmittedStatus = (typeof SUBMITTED_STATUSES)[number];

/** One entry in a claim's work history (an action change, comment or denial-reason change). */
export interface ClaimEvent {
  id: string;
  /** When the entry was saved (ISO). */
  at: string;
  /** The date the user says the action happened (yyyy-mm-dd). */
  actionDate: string;
  by: string;
  action: ClaimAction;
  comment?: string;
  /** Automatic entries (e.g. AR assignment from an upload) don't count as the team working the claim. */
  system?: boolean;
}

export interface Claim {
  id: string;
  /** "Claim No" in the client's templates. Text: leading zeros are kept. */
  claimId: string;
  /** Sequence number within the upload batch(es), shown as "Rec #". */
  rec?: number;
  patientName: string;
  /** "Account" in some billing softwares' templates. */
  account?: string;
  /** Optional: not in the current templates, but old data and manual entry can have it. */
  patientAcctNo?: string;
  dateOfBirth?: string;
  /** yyyy-mm-dd; every date below is "" when the file didn't give one. */
  claimDate: string;
  /** Who owes the balance: "Insurance", "Patient" or a payer name. */
  responsible: string;
  provider: string;
  /** "Service date" in the client's templates. */
  dos: string;
  billedDate: string;
  /** Days, as given in the file. When absent it is calculated from the billed date. */
  aging?: number;
  /** "Procedure" in the client's templates (text). */
  cpt: string;
  /** "Charge" in the client's templates. */
  billedAmount: number;
  /** Balance as given in the file; defaults to the charge. */
  balance?: number;
  /** Denial codes (Settings > Denial Codes) set on the claim inside the app. Not part of any Excel template. */
  denialCodes: string[];
  practiceId: string;
  practiceName: string;
  action: ClaimAction;
  submittedStatus?: SubmittedStatus;
  /** Free text from the paid file, e.g. a user's name or "ERA auto-post". */
  transactionBy?: string;
  paidAmount?: number;
  /** yyyy-mm-dd of the payment (the file's Payment Date, else the upload / action date). */
  paidOn?: string;
  /** Staff working the claim (User ids & First + Last name). */
  ar1UserId?: string;
  ar1Name?: string;
  ar2UserId?: string;
  ar2Name?: string;
  /** ISO timestamp when the claim record was created/uploaded. */
  createdAt?: string;
  uploadId?: string;
  /** The billing software whose template the claim was uploaded with. */
  softwareId?: string;
  /** Values of custom fields (Settings > Upload Templates), keyed by the field's key. */
  extra?: Record<string, string>;
  history?: ClaimEvent[];
}

export type UploadType = "New" | "Paid";
export type UploadStatus = "Completed" | "Completed with warnings" | "Failed";

export interface UploadLog {
  id: string;
  fileName: string;
  type: UploadType;
  practiceName: string;
  rows: number;
  uploadedBy: string;
  uploadedAt: string;
  status: UploadStatus;
}

export const HELP_CATEGORIES = ["Payer", "Clearinghouse", "Practice", "Internal", "Other"] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export interface HelpPhone {
  id: string;
  /** e.g. "Provider Services", "Claims", "Fax". */
  type: string;
  number: string;
  ext?: string;
}

/** A HelpDesk card: contact details and reference notes for a payer, clearinghouse, practice or teammate. */
export interface HelpContact {
  id: string;
  name: string;
  category: HelpCategory;
  /** Practice id, or undefined for "All practices". */
  practiceId?: string;
  phones: HelpPhone[];
  email?: string;
  website?: string;
  hours?: string;
  notes?: string;
}

export const KNOWLEDGE_CATEGORIES = ["SOP", "Payer Guidelines", "Templates", "Training", "Other"] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

/** Metadata for a Knowledge Center document. The file itself lives in IndexedDB under the same id. */
export interface KnowledgeDoc {
  id: string;
  title: string;
  category: KnowledgeCategory;
  description?: string;
  fileName: string;
  /** Lower-case extension without the dot, e.g. "xlsx". */
  ext: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  /** Seeded sample documents are generated into IndexedDB on first visit. */
  seed?: boolean;
}

/** How a template field's values are read and shown. "days" is a whole number of days. */
export type FieldType = "text" | "date" | "days" | "currency";

/** A field super users add on top of the built-in ones; its values live in `Claim.extra[key]`. */
export interface CustomField {
  id: string;
  /** "x_<id>": what templates and worklist columns store to point at it. */
  key: string;
  label: string;
  type: FieldType;
}

/** One column of a billing software's upload template. */
export interface SoftwareColumn {
  id: string;
  /** The column name exactly as that software exports it (and as the downloaded template writes it). */
  header: string;
  /** Other spellings of the same column that are accepted when reading a file. */
  aliases: string[];
  /** The template field this column feeds (a built-in or custom field key). */
  field: string;
  required: boolean;
  /** Hidden columns stay in the setup but are left out of the template, preview and import. */
  hidden?: boolean;
}

/** A billing / practice-management software and the Excel template its files follow. */
export interface Software {
  id: string;
  name: string;
  status: Status;
  columns: SoftwareColumn[];
  /** Per-software worklist display & order settings. */
  worklistColumns?: WorklistColumn[];
}

/** One configurable worklist column: its label, the template field it shows, and whether it's displayed. */
export interface WorklistColumn {
  id: string;
  label: string;
  field: string;
  visible: boolean;
}
