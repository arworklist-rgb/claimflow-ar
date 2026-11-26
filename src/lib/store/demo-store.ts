import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SEED_DENIAL_CODES } from "@/lib/mock-data/denial-codes";
import { SEED_HELP_CONTACTS } from "@/lib/mock-data/help-contacts";
import { SEED_KNOWLEDGE_DOCS } from "@/lib/mock-data/knowledge-docs";
import { SEED_SOFTWARES } from "@/lib/mock-data/software-templates";
import { DEFAULT_WORKLIST_COLUMNS, uidShort } from "@/lib/templates";
import { SEED_PRACTICES } from "@/lib/mock-data/practices";
import { SEED_UPLOAD_LOGS } from "@/lib/mock-data/upload-logs";
import { summarizePaidResults, type PaidRowResult } from "@/lib/claims";
import { normalizeDate } from "@/lib/dates";
import { defaultStaffing } from "@/lib/excel/assignment";
import { DEFAULT_VIEW_AS_ID, SEED_USERS } from "@/lib/mock-data/users";
import { DEFAULT_ACTION, PAID_ACTION } from "@/lib/types";
import type {
  Claim,
  ClaimAction,
  ClaimEvent,
  ClaimStaffSlot,
  CustomField,
  FieldType,
  DenialCode,
  HelpContact,
  KnowledgeDoc,
  Practice,
  Software,
  SoftwareColumn,
  Status,
  UploadLog,
  User,
  WorklistColumn,
} from "@/lib/types";

export const ALL_PRACTICES = "all";

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

interface DemoData {
  practices: Practice[];
  users: User[];
  denialCodes: DenialCode[];
  claims: Claim[];
  uploadLogs: UploadLog[];
  /** "all" or a practice id. Shared by the top-nav select and the worklist. */
  selectedPracticeId: string;
  /** The user the demo is "viewing as". Decides who uploads, who is an admin, and who is credited in history. */
  viewAsUserId: string;
  helpContacts: HelpContact[];
  knowledgeDocs: KnowledgeDoc[];
  /** Billing softwares and their upload templates (Settings > Upload Templates). */
  softwares: Software[];
  customFields: CustomField[];
  /** The configurable data columns of the worklist, in order. */
  worklistColumns: WorklistColumn[];
}

export interface PracticeInput {
  name: string;
  npi?: string;
  status: Status;
  userIds: string[];
}

export type DenialCodeInput = Omit<DenialCode, "id">;
/** A row to import: category and status are optional (the client's file has neither). */
export type DenialCodeImportRow = Pick<DenialCodeInput, "code" | "description"> & Partial<Pick<DenialCodeInput, "category" | "status">>;
export interface SoftwareInput {
  name: string;
  status: Status;
  columns: SoftwareColumn[];
}
export type HelpContactInput = Omit<HelpContact, "id">;

export interface ClaimUpdate {
  action: ClaimAction;
  comment?: string;
  /** yyyy-mm-dd */
  actionDate: string;
}

export type ClaimPatch = Partial<Pick<Claim, "submittedStatus" | "transactionBy" | "paidAmount" | "denialCodes">>;

interface DemoActions {
  setSelectedPractice: (id: string) => void;

  addPractice: (input: PracticeInput) => Practice;
  updatePractice: (id: string, input: PracticeInput) => void;
  deletePractice: (id: string) => void;

  addDenialCode: (input: DenialCodeInput) => void;
  /** Renaming a code carries over to the claims that use it. */
  updateDenialCode: (id: string, input: DenialCodeInput) => void;
  duplicateDenialCode: (id: string) => DenialCode | null;
  setDenialCodeStatus: (ids: string[], status: Status) => void;
  /** Deleting a code also removes it from every claim that has it. */
  deleteDenialCodes: (ids: string[]) => void;
  /** New codes are added, existing ones are updated. A row with no category / status keeps the existing one. */
  importDenialCodes: (rows: DenialCodeImportRow[]) => { added: number; updated: number };
  /** Replaces the denial codes on a claim (no history entry). */
  setClaimDenialCodes: (id: string, codes: string[]) => void;

  setViewAs: (userId: string) => void;

  /** New software; with `copyFromId` it starts from that software's columns. */
  addSoftware: (name: string, copyFromId?: string) => Software;
  updateSoftware: (id: string, input: SoftwareInput) => void;
  deleteSoftware: (id: string) => void;
  setWorklistColumns: (columns: WorklistColumn[]) => void;
  addCustomField: (label: string, type: FieldType) => CustomField;
  updateCustomField: (id: string, patch: { label: string; type: FieldType }) => void;
  /** Removes the field from every template, worklist column and claim that uses it. */
  deleteCustomField: (id: string) => void;

  addHelpContact: (input: HelpContactInput) => void;
  updateHelpContact: (id: string, input: HelpContactInput) => void;
  deleteHelpContact: (id: string) => void;

  addKnowledgeDocs: (docs: KnowledgeDoc[]) => void;
  updateKnowledgeDoc: (id: string, patch: Partial<Pick<KnowledgeDoc, "title" | "category" | "description">>) => void;
  deleteKnowledgeDoc: (id: string) => void;
  /** Records the real size of a generated sample file. */
  setKnowledgeDocSize: (id: string, size: number) => void;

  /** Applies a worklist edit and records it in the claim's history. Returns false if nothing changed. */
  updateClaim: (id: string, update: ClaimUpdate, by: string) => boolean;

  /** Sets (or, with null, clears) the AR 1 / AR 2 staff member on a claim. */
  assignClaim: (id: string, slot: ClaimStaffSlot, userId: string | null, by?: string) => void;

  /** Inline edits from the worklist table (no history entry). */
  patchClaim: (id: string, patch: ClaimPatch) => void;

  /**
   * Adds new claims (AR 1 = the uploader); a Claim No that already exists for the same practice updates that
   * claim instead, and the uploader becomes AR 2 when they aren't already AR 1.
   */
  importNewClaims: (
    claims: Claim[],
    log: UploadLog,
    uploaderId: string,
  ) => { added: number; updated: number; ar2Set: number; ar1Set: number };
  /** Marks the claims of every "updated" result as Paid and logs the upload. */
  applyPaidClaims: (results: PaidRowResult[], log: Omit<UploadLog, "status">) => void;

  resetDemo: () => void;
}

export type DemoState = DemoData & DemoActions;

function seedData(): DemoData {
  return {
    practices: structuredClone(SEED_PRACTICES),
    users: structuredClone(SEED_USERS),
    denialCodes: structuredClone(SEED_DENIAL_CODES),
    claims: [],
    uploadLogs: structuredClone(SEED_UPLOAD_LOGS),
    selectedPracticeId: ALL_PRACTICES,
    viewAsUserId: DEFAULT_VIEW_AS_ID,
    helpContacts: structuredClone(SEED_HELP_CONTACTS),
    knowledgeDocs: structuredClone(SEED_KNOWLEDGE_DOCS),
    softwares: structuredClone(SEED_SOFTWARES),
    customFields: [],
    worklistColumns: structuredClone(DEFAULT_WORKLIST_COLUMNS),
  };
}

function nextPracticeCode(practices: Practice[]): string {
  const max = practices.reduce((acc, p) => {
    const n = Number.parseInt(p.code.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 1000);
  return `PR-${max + 1}`;
}

/** Every field an older save might carry, whatever its version. */
type LegacyClaim = Partial<Claim> & {
  status?: string;
  payer?: string;
  denialDate?: string;
  denialCode?: string;
  acctNo?: string;
  dob?: string;
  paidDate?: string;
};
type LegacyEvent = Omit<ClaimEvent, "action"> & {
  action?: ClaimAction;
  status?: string;
  denialChange?: { from: string; to: string };
};

/** v1-v3 had a "status"; the client's Action list replaced it. Open -> New, Paid -> Paid and closed. */
function legacyAction(status?: string, action?: string): ClaimAction {
  if (action) return action as ClaimAction;
  switch (status) {
    case "Paid":
    case "Paid/Closed":
      return PAID_ACTION;
    case "Submitted":
      return "Resubmitted";
    default:
      return DEFAULT_ACTION;
  }
}

/** Case-insensitive lookup from a code to the code as stored ("b10" -> "B10"). */
const codeLookup = (codes: DenialCode[]) => new Map(codes.map((c) => [c.code.toLowerCase(), c.code]));

/**
 * Old claims held one code like "CO-16", "PR-27" or "CO-01". Drop the group prefix and leading zeros
 * ("CO-16" -> "16", "CO-01" -> "1") and keep the code only if the client's list has it.
 */
export function normalizeLegacyDenialCode(raw: string | undefined, valid: Map<string, string>): string | undefined {
  const base = (raw ?? "").trim().replace(/^(CO|PR|OA|PI|CR)[-\s]*/i, "");
  if (!base) return undefined;
  return valid.get(base.toLowerCase()) ?? valid.get(base.replace(/^0+(?=.)/, "").toLowerCase());
}

/**
 * Brings a claim saved by an earlier version up to the current shape (idempotent).
 *  - v1 had no AR 1 / AR 2, and AR 1 is now always set: claims without one are staffed with realistic defaults.
 *  - v2/v3 used acctNo / dob / payer / denialDate / status; they map onto the new fields
 *    (payer -> Responsible, denial date -> Claim Date and Billed date) and the old ones are dropped.
 *  - v4 had one denialCode per claim; it becomes denialCodes (see normalizeLegacyDenialCode).
 * New fields with no data (provider, transaction by, submitted status, ...) are simply left empty.
 */
function upgradeClaim(c: LegacyClaim, index: number, users: User[], validCodes: Map<string, string>): Claim {
  const { status, payer, denialDate, denialCode, acctNo, dob, paidDate, ...rest } = c;
  const legacyCode = normalizeLegacyDenialCode(denialCode, validCodes);
  return {
    ...(rest as Claim),
    action: legacyAction(status, c.action),
    patientAcctNo: c.patientAcctNo ?? acctNo ?? undefined,
    dateOfBirth: c.dateOfBirth ?? dob ?? undefined,
    claimDate: c.claimDate ?? denialDate ?? "",
    responsible: c.responsible ?? payer ?? "",
    provider: c.provider ?? "",
    billedDate: c.billedDate ?? denialDate ?? c.dos ?? "",
    denialCodes: c.denialCodes ?? (legacyCode ? [legacyCode] : []),
    paidOn: c.paidOn ?? paidDate,
    ...(c.ar1UserId ? {} : defaultStaffing(index, users)),
    history: c.history?.map((e) => {
      const { status: oldStatus, denialChange, ...event } = e as LegacyEvent;
      const note = denialChange ? `Denial code ${denialChange.from || "—"} → ${denialChange.to}` : undefined;
      return {
        ...event,
        action: legacyAction(oldStatus, event.action),
        comment: [event.comment, note].filter(Boolean).join(" · ") || undefined,
      };
    }),
  };
}

const normKey = (s: string) => s.trim().toLowerCase();

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...seedData(),

      setSelectedPractice: (id) => set({ selectedPracticeId: id }),

      addPractice: (input) => {
        const practice: Practice = {
          id: uid("p"),
          code: nextPracticeCode(get().practices),
          name: input.name.trim(),
          npi: input.npi?.trim() || undefined,
          status: input.status,
          userIds: input.userIds,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ practices: [practice, ...s.practices] }));
        return practice;
      },

      updatePractice: (id, input) =>
        set((s) => ({
          practices: s.practices.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: input.name.trim(),
                  npi: input.npi?.trim() || undefined,
                  status: input.status,
                  userIds: input.userIds,
                }
              : p,
          ),
        })),

      deletePractice: (id) =>
        set((s) => ({
          practices: s.practices.filter((p) => p.id !== id),
          selectedPracticeId: s.selectedPracticeId === id ? ALL_PRACTICES : s.selectedPracticeId,
        })),

      addDenialCode: (input) =>
        set((s) => ({
          denialCodes: [{ ...input, id: uid("dc") }, ...s.denialCodes],
        })),

      updateDenialCode: (id, input) =>
        set((s) => {
          const before = s.denialCodes.find((r) => r.id === id);
          const renamed = before && before.code !== input.code;
          return {
            denialCodes: s.denialCodes.map((r) => (r.id === id ? { ...r, ...input } : r)),
            claims: renamed
              ? s.claims.map((c) =>
                  c.denialCodes.includes(before.code)
                    ? { ...c, denialCodes: c.denialCodes.map((x) => (x === before.code ? input.code : x)) }
                    : c,
                )
              : s.claims,
          };
        }),

      duplicateDenialCode: (id) => {
        const { denialCodes } = get();
        const index = denialCodes.findIndex((r) => r.id === id);
        if (index === -1) return null;
        const source = denialCodes[index];
        const existing = new Set(denialCodes.map((r) => normKey(r.code)));
        let code = `${source.code}-COPY`;
        for (let n = 2; existing.has(normKey(code)); n++) code = `${source.code}-COPY${n}`;
        const copy: DenialCode = { ...source, id: uid("dc"), code };
        const next = [...denialCodes];
        next.splice(index + 1, 0, copy);
        set({ denialCodes: next });
        return copy;
      },

      setDenialCodeStatus: (ids, status) => {
        const target = new Set(ids);
        set((s) => ({
          denialCodes: s.denialCodes.map((r) => (target.has(r.id) ? { ...r, status } : r)),
        }));
      },

      deleteDenialCodes: (ids) => {
        const target = new Set(ids);
        set((s) => {
          const gone = new Set(s.denialCodes.filter((r) => target.has(r.id)).map((r) => r.code));
          return {
            denialCodes: s.denialCodes.filter((r) => !target.has(r.id)),
            claims: s.claims.map((c) =>
              c.denialCodes.some((x) => gone.has(x)) ? { ...c, denialCodes: c.denialCodes.filter((x) => !gone.has(x)) } : c,
            ),
          };
        });
      },

      importDenialCodes: (rows) => {
        let added = 0;
        let updated = 0;
        const list = [...get().denialCodes];
        const byCode = new Map(list.map((r, i) => [normKey(r.code), i]));
        for (const row of rows) {
          const key = normKey(row.code);
          const at = byCode.get(key);
          if (at === undefined) {
            byCode.set(key, list.length);
            // A file with no category / status column gives `undefined`, which must not override the defaults.
            list.push({ id: uid("dc"), code: row.code, description: row.description, category: row.category ?? "Other", status: row.status ?? "Active" });
            added++;
          } else {
            // Keep the stored spelling of the code, and any category / status the file didn't give.
            list[at] = { ...list[at], description: row.description, category: row.category ?? list[at].category, status: row.status ?? list[at].status };
            updated++;
          }
        }
        set({ denialCodes: list });
        return { added, updated };
      },

      setClaimDenialCodes: (id, codes) =>
        set((s) => ({
          claims: s.claims.map((c) => (c.id === id ? { ...c, denialCodes: [...new Set(codes)] } : c)),
        })),

      setViewAs: (userId) => set({ viewAsUserId: userId }),

      addSoftware: (name, copyFromId) => {
        const source = get().softwares.find((x) => x.id === copyFromId);
        const software: Software = {
          id: uid("sw"),
          name: name.trim(),
          status: "Active",
          columns: source ? source.columns.map((c) => ({ ...c, id: uidShort("col") })) : [],
        };
        set((s) => ({ softwares: [...s.softwares, software] }));
        return software;
      },
      updateSoftware: (id, input) =>
        set((s) => ({ softwares: s.softwares.map((x) => (x.id === id ? { ...x, name: input.name.trim(), status: input.status, columns: input.columns } : x)) })),
      deleteSoftware: (id) => set((s) => ({ softwares: s.softwares.filter((x) => x.id !== id) })),
      setWorklistColumns: (columns) => set({ worklistColumns: columns }),

      addCustomField: (label, type) => {
        const id = uidShort("cf");
        const field: CustomField = { id, key: `x_${id.slice(3)}`, label: label.trim(), type };
        set((s) => ({ customFields: [...s.customFields, field] }));
        return field;
      },
      updateCustomField: (id, patch) =>
        set((s) => ({ customFields: s.customFields.map((f) => (f.id === id ? { ...f, label: patch.label.trim(), type: patch.type } : f)) })),
      deleteCustomField: (id) =>
        set((s) => {
          const field = s.customFields.find((f) => f.id === id);
          if (!field) return {};
          return {
            customFields: s.customFields.filter((f) => f.id !== id),
            softwares: s.softwares.map((x) => ({ ...x, columns: x.columns.filter((c) => c.field !== field.key) })),
            worklistColumns: s.worklistColumns.filter((c) => c.field !== field.key),
            claims: s.claims.map((c) => {
              if (!c.extra || !(field.key in c.extra)) return c;
              const { [field.key]: _removed, ...rest } = c.extra;
              void _removed;
              return { ...c, extra: rest };
            }),
          };
        }),

      addHelpContact: (input) => set((s) => ({ helpContacts: [{ ...input, id: uid("hc") }, ...s.helpContacts] })),
      updateHelpContact: (id, input) =>
        set((s) => ({ helpContacts: s.helpContacts.map((c) => (c.id === id ? { ...input, id } : c)) })),
      deleteHelpContact: (id) => set((s) => ({ helpContacts: s.helpContacts.filter((c) => c.id !== id) })),

      addKnowledgeDocs: (docs) => set((s) => ({ knowledgeDocs: [...docs, ...s.knowledgeDocs] })),
      updateKnowledgeDoc: (id, patch) =>
        set((s) => ({ knowledgeDocs: s.knowledgeDocs.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteKnowledgeDoc: (id) => set((s) => ({ knowledgeDocs: s.knowledgeDocs.filter((d) => d.id !== id) })),
      setKnowledgeDocSize: (id, size) =>
        set((s) => ({ knowledgeDocs: s.knowledgeDocs.map((d) => (d.id === id ? { ...d, size } : d)) })),

      importNewClaims: (incoming, log, uploaderId) => {
        const keyOf = (c: Claim) => `${c.practiceId}|${normKey(c.claimId)}`;
        const uploaderName = get().users.find((u) => u.id === uploaderId)?.name ?? log.uploadedBy;
        const day = log.uploadedAt.slice(0, 10);
        const list = [...get().claims];
        const index = new Map(list.map((c, i) => [keyOf(c), i]));
        const createdIds = new Set<string>();
        let rec = list.reduce((max, c) => Math.max(max, c.rec ?? 0), 0);
        let updated = 0;
        let ar1Set = 0;
        let ar2Set = 0;

        // AR 1 / AR 2 come from whoever uploads, never from the file. The history entry is automatic
        // (`system`), so it doesn't count as the team working the claim.
        const assignEvent = (claim: Claim, slot: "AR 1" | "AR 2"): ClaimEvent => ({
          id: uid("ev"),
          at: log.uploadedAt,
          actionDate: day,
          by: uploaderName,
          action: claim.action,
          comment: `${slot} set to ${uploaderName} via upload ${log.fileName}`,
          system: true,
        });

        for (const claim of incoming) {
          const at = index.get(keyOf(claim));
          if (at === undefined) {
            index.set(keyOf(claim), list.length);
            createdIds.add(claim.id);
            const fresh: Claim = { ...claim, rec: ++rec, ar1UserId: uploaderId, ar2UserId: undefined };
            fresh.history = [assignEvent(fresh, "AR 1"), ...(fresh.history ?? [])];
            list.push(fresh);
            continue;
          }
          // Refresh the claim from the file, but don't let the file's blanks erase what we know, and
          // never touch the team's own work (action, submitted status, history, paid details).
          const existing = list[at];
          const given = <T,>(next: T, prev: T) => (next === "" || next === undefined ? prev : next);
          const next: Claim = {
            ...existing,
            patientName: given(claim.patientName, existing.patientName),
            claimDate: given(claim.claimDate, existing.claimDate),
            responsible: given(claim.responsible, existing.responsible),
            provider: given(claim.provider, existing.provider),
            dos: given(claim.dos, existing.dos),
            billedDate: given(claim.billedDate, existing.billedDate),
            aging: given(claim.aging, existing.aging),
            cpt: given(claim.cpt, existing.cpt),
            billedAmount: claim.billedAmount || existing.billedAmount,
            balance: given(claim.balance, existing.balance),
            patientAcctNo: given(claim.patientAcctNo, existing.patientAcctNo),
            account: given(claim.account, existing.account),
            paidAmount: given(claim.paidAmount, existing.paidAmount),
            extra: claim.extra && Object.keys(claim.extra).length ? { ...existing.extra, ...claim.extra } : existing.extra,
            softwareId: claim.softwareId ?? existing.softwareId,
          };
          // The uploader is AR 1 already: nothing changes. Otherwise they become AR 2 (overwriting the previous
          // AR 2). A legacy claim with no AR 1 gets the uploader as AR 1 instead.
          const isRepeatInFile = createdIds.has(existing.id);
          if (!isRepeatInFile) {
            if (!existing.ar1UserId) {
              next.ar1UserId = uploaderId;
              next.history = [assignEvent(next, "AR 1"), ...(existing.history ?? [])];
              ar1Set++;
            } else if (existing.ar1UserId !== uploaderId && existing.ar2UserId !== uploaderId) {
              next.ar2UserId = uploaderId;
              next.history = [assignEvent(next, "AR 2"), ...(existing.history ?? [])];
              ar2Set++;
            }
            updated++;
          }
          list[at] = next;
        }

        // Newest claims first, like before.
        const claims = [...list.filter((c) => createdIds.has(c.id)), ...list.filter((c) => !createdIds.has(c.id))];
        set((s) => ({
          claims,
          uploadLogs: [log, ...s.uploadLogs],
        }));
        return { added: createdIds.size, updated, ar2Set, ar1Set };
      },

      applyPaidClaims: (results, log) => {
        const uploadDay = log.uploadedAt.slice(0, 10);
        const toPay = new Map(results.filter((r) => r.outcome === "updated" && r.claimId).map((r) => [r.claimId!, r]));
        const { notFound, multiple, alreadyPaid } = summarizePaidResults(results);
        set((s) => ({
          claims: s.claims.map((claim) => {
            const result = toPay.get(claim.id);
            if (!result) return claim;
            const { row } = result;
            // The file's Payment Date, or the upload date when it's blank or unreadable.
            const day = normalizeDate(row.paymentDate);
            const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : uploadDay;
            const event: ClaimEvent = {
              id: uid("ev"),
              at: log.uploadedAt,
              actionDate: paidOn,
              by: log.uploadedBy,
              action: PAID_ACTION,
              comment: `Marked Paid and closed from paid claim file ${log.fileName} (row ${row.rowNumber}).`,
            };
            return {
              ...claim,
              action: PAID_ACTION,
              paidOn,
              paidAmount: row.paidAmount ?? claim.paidAmount,
              transactionBy: row.transactionBy.trim() || claim.transactionBy,
              history: [event, ...(claim.history ?? [])],
            };
          }),
          uploadLogs: [
            { ...log, status: notFound + multiple + alreadyPaid > 0 ? "Completed with warnings" : "Completed" },
            ...s.uploadLogs,
          ],
        }));
      },

      assignClaim: (id, slot, userId, by) =>
        set((s) => {
          const label = slot === "ar1" ? "AR 1" : "AR 2";
          const who = userId ? (s.users.find((u) => u.id === userId)?.name ?? "someone") : undefined;
          return {
            claims: s.claims.map((c) => {
              if (c.id !== id) return c;
              const field = slot === "ar1" ? "ar1UserId" : "ar2UserId";
              const next = { ...c, [field]: userId ?? undefined };
              if (!by) return next;
              const event: ClaimEvent = {
                id: uid("ev"),
                at: new Date().toISOString(),
                actionDate: new Date().toISOString().slice(0, 10),
                by,
                action: c.action,
                comment: who ? `${label} set to ${who} (reassigned by ${by})` : `${label} cleared (by ${by})`,
                system: true,
              };
              return { ...next, history: [event, ...(c.history ?? [])] };
            }),
          };
        }),

      patchClaim: (id, patch) =>
        set((s) => ({ claims: s.claims.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      updateClaim: (id, update, by) => {
        const claim = get().claims.find((c) => c.id === id);
        if (!claim) return false;
        const comment = update.comment?.trim() || undefined;
        if (!comment && update.action === claim.action) return false;

        const event: ClaimEvent = {
          id: uid("ev"),
          at: new Date().toISOString(),
          actionDate: update.actionDate,
          by,
          action: update.action,
          comment,
        };
        const closing = update.action === PAID_ACTION;
        set((s) => ({
          claims: s.claims.map((c) =>
            c.id !== id
              ? c
              : {
                  ...c,
                  action: update.action,
                  history: [event, ...(c.history ?? [])],
                  paidOn: closing ? (c.paidOn ?? update.actionDate) : undefined,
                },
          ),
        }));
        return true;
      },

      resetDemo: () => set(seedData()),
    }),
    {
      name: "claimflow-ar-demo",
      version: 6,
      // Older saves are upgraded in place, step by step, so a later upgrade never redoes an earlier one:
      //  < 5: the client's 116 denial codes replace the old list, claims move to the current shape (upgradeClaim)
      //  < 6: billing softwares, custom fields and the worklist column setup are added
      migrate: (persisted, version) => {
        const state = persisted as Partial<DemoData> & { denialReasons?: unknown };
        // An empty or missing user list would leave every assignment (and "View as") dangling, whatever the version.
        const users = state.users?.length ? state.users : SEED_USERS;
        state.users = users;
        if (version < 5) {
          delete state.denialReasons;
          state.denialCodes = structuredClone(SEED_DENIAL_CODES);
          const valid = codeLookup(state.denialCodes);
          state.claims = (state.claims ?? []).map((c, i) => upgradeClaim(c as LegacyClaim, i, users, valid));
          state.viewAsUserId ??= DEFAULT_VIEW_AS_ID;
          state.helpContacts ??= structuredClone(SEED_HELP_CONTACTS);
          state.knowledgeDocs ??= structuredClone(SEED_KNOWLEDGE_DOCS);
        }
        if (version < 6) {
          state.softwares ??= structuredClone(SEED_SOFTWARES);
          state.customFields ??= [];
          state.worklistColumns ??= structuredClone(DEFAULT_WORKLIST_COLUMNS);
        }
        return state as DemoState;
      },
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually from <StoreHydrator /> so the first client render
      // matches the server-rendered seed data.
      skipHydration: true,
      partialize: (s): DemoData => ({
        practices: s.practices,
        users: s.users,
        denialCodes: s.denialCodes,
        claims: s.claims,
        uploadLogs: s.uploadLogs,
        selectedPracticeId: s.selectedPracticeId,
        viewAsUserId: s.viewAsUserId,
        helpContacts: s.helpContacts,
        knowledgeDocs: s.knowledgeDocs,
        softwares: s.softwares,
        customFields: s.customFields,
        worklistColumns: s.worklistColumns,
      }),
    },
  ),
);
