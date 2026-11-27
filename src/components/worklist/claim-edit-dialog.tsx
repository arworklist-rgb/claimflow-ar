"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StaffChip } from "@/components/shared/staff-chip";
import { ACTION_STYLES, ClaimActionBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ageInDays, balanceOf, bucketOfAge, bucketShort } from "@/lib/claims";
import { parseAmount } from "@/lib/excel/parse";
import { formatCurrency, formatDateNumeric } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser } from "@/lib/store/selectors";
import {
  CLAIM_ACTIONS,
  SUBMITTED_STATUSES,
  type Claim,
  type ClaimAction,
  type CustomField,
  type DenialCode,
  type SubmittedStatus,
  type User,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AssigneeCell } from "./assignee-cell";
import { DenialCodesCell } from "./denial-codes-field";

const today = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd in local time
const NOT_SUBMITTED = "none";

interface ClaimEditDialogProps {
  /** The claim being edited; null keeps the dialog closed. */
  claim: Claim | null;
  onClose: () => void;
  codes: DenialCode[];
  users: User[];
  now: number;
  customFields?: CustomField[];
}

/**
 * The claim editor, as a centered popup. Opens only from the row's edit icon. Esc, a click outside and the X all
 * ask "Discard changes?" first when something was edited.
 */
export function ClaimEditDialog({ claim, onClose, codes, users, now, customFields = [] }: ClaimEditDialogProps) {
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());

  return (
    <>
      <Dialog
        open={!!claim}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-3xl",
            // Full screen on phones.
            "max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          )}
        >
          {claim && (
            <EditForm
              key={claim.id}
              claim={claim}
              codes={codes}
              users={users}
              now={now}
              customFields={customFields}
              onDirtyChange={setDirty}
              onCancel={requestClose}
              onSaved={() => {
                setDirty(false);
                onClose();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="You have unsaved changes to this claim. If you close now they will be lost."
        confirmLabel="Discard"
        onConfirm={() => {
          setDirty(false);
          onClose();
        }}
      />
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

interface EditFormProps {
  claim: Claim;
  codes: DenialCode[];
  users: User[];
  now: number;
  customFields: CustomField[];
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
}

function EditForm({ claim, codes, users, now, customFields, onDirtyChange, onCancel, onSaved }: EditFormProps) {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser.role === "Admin";
  const updateClaim = useDemoStore((s) => s.updateClaim);
  const patchClaim = useDemoStore((s) => s.patchClaim);
  const assignClaim = useDemoStore((s) => s.assignClaim);

  const [action, setAction] = useState<ClaimAction>(claim.action);
  const [submitted, setSubmitted] = useState<SubmittedStatus | undefined>(claim.submittedStatus);
  const [denialCodes, setDenialCodes] = useState<string[]>(claim.denialCodes);
  const [paidAmount, setPaidAmount] = useState(claim.paidAmount === undefined ? "" : String(claim.paidAmount));
  const [transactionBy, setTransactionBy] = useState(claim.transactionBy ?? "");
  const [ar1, setAr1] = useState(claim.ar1UserId);
  const [ar2, setAr2] = useState(claim.ar2UserId);
  const [actionDate, setActionDate] = useState(today);
  const [comment, setComment] = useState("");

  const dirty =
    action !== claim.action ||
    submitted !== claim.submittedStatus ||
    denialCodes.join("|") !== claim.denialCodes.join("|") ||
    paidAmount.trim() !== (claim.paidAmount === undefined ? "" : String(claim.paidAmount)) ||
    transactionBy.trim() !== (claim.transactionBy ?? "") ||
    (isAdmin && (ar1 !== claim.ar1UserId || ar2 !== claim.ar2UserId)) ||
    comment.trim() !== "";

  // Keep the parent's "Discard changes?" guard in step with the form.
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    updateClaim(claim.id, { action, comment, actionDate }, currentUser.name);
    patchClaim(claim.id, {
      submittedStatus: submitted,
      transactionBy: transactionBy.trim() || undefined,
      paidAmount: parseAmount(paidAmount.trim()),
      denialCodes,
    });
    if (isAdmin) {
      if (ar1 !== claim.ar1UserId) assignClaim(claim.id, "ar1", ar1 ?? null, currentUser.name);
      if (ar2 !== claim.ar2UserId) assignClaim(claim.id, "ar2", ar2 ?? null, currentUser.name);
    }
    toast.success("Claim updated");
    onSaved();
  };

  const age = ageInDays(claim, now);
  const reasonByCode = useMemo(() => new Map(codes.map((c) => [c.code, c])), [codes]);
  const userOf = (id?: string) => users.find((u) => u.id === id);
  const history = claim.history ?? [];

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <header className="space-y-1.5 border-b px-5 py-4 pr-14 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="min-w-0 truncate text-lg leading-tight font-bold tracking-tight">
            {claim.patientName || "Unnamed patient"}
          </DialogTitle>
          <ClaimActionBadge action={claim.action} />
        </div>
        <DialogDescription className="text-[13px]">
          Claim <span className="font-mono">{claim.claimId}</span> · {claim.practiceName}
          {claim.rec !== undefined && <> · Rec #{claim.rec}</>}
        </DialogDescription>
      </header>

      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5 sm:px-6">
        <section aria-label="Edit claim" className="rounded-xl border bg-muted/40 p-4 sm:p-5">
          <SectionTitle>Edit claim</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Action" htmlFor="claim-action">
              <Select value={action} onValueChange={(v) => setAction(v as ClaimAction)}>
                <SelectTrigger id="claim-action" className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <span aria-hidden className={cn("size-2 rounded-full", ACTION_STYLES[a].dot)} />
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Submitted Status" htmlFor="claim-submitted">
              <Select
                value={submitted ?? NOT_SUBMITTED}
                onValueChange={(v) => setSubmitted(v === NOT_SUBMITTED ? undefined : (v as SubmittedStatus))}
              >
                <SelectTrigger id="claim-submitted" className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOT_SUBMITTED}>Not submitted</SelectItem>
                  {SUBMITTED_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Denial codes" className="sm:col-span-2">
              <div className="rounded-lg border bg-card p-1">
                <DenialCodesCell value={denialCodes} onChange={setDenialCodes} codes={codes} max={Infinity} className="min-h-9 w-full" />
              </div>
              {denialCodes.length > 0 && (
                <ul className="space-y-0.5 pt-1 text-xs text-muted-foreground">
                  {denialCodes.map((c) => {
                    const rec = reasonByCode.get(c);
                    return (
                      <li key={c} className="line-clamp-1">
                        <span className="font-mono font-semibold text-foreground/80">{c}</span>{" "}
                        {rec ? rec.description.split("Usage:")[0].trim() : "Unknown code"}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Field>

            <Field label="Paid Amount" htmlFor="claim-paid">
              <Input
                id="claim-paid"
                inputMode="decimal"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="bg-card tabular-nums"
              />
            </Field>

            <Field label="Transaction By" htmlFor="claim-transaction-by">
              <Input
                id="claim-transaction-by"
                placeholder="Name or email"
                value={transactionBy}
                onChange={(e) => setTransactionBy(e.target.value)}
                className="bg-card"
              />
            </Field>

            <Field label="AR Level 1">
              {isAdmin ? (
                <div className="rounded-lg border bg-card px-1 py-0.5">
                  <AssigneeCell label="AR Level 1" users={users} value={ar1} onChange={(id) => setAr1(id ?? undefined)} />
                </div>
              ) : (
                <ReadOnlyStaff user={userOf(claim.ar1UserId)} />
              )}
            </Field>

            <Field label="AR Level 2">
              {isAdmin ? (
                <div className="rounded-lg border bg-card px-1 py-0.5">
                  <AssigneeCell label="AR Level 2" users={users} value={ar2} onChange={(id) => setAr2(id ?? undefined)} />
                </div>
              ) : (
                <ReadOnlyStaff user={userOf(claim.ar2UserId)} />
              )}
            </Field>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                AR Level 1 and AR Level 2 are set automatically from who uploads the claim. Only admins can reassign them.
              </p>
            )}

            <Field label="Action date" htmlFor="claim-action-date">
              <Input id="claim-action-date" type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} className="bg-card" required />
            </Field>

            <Field label="Comment" htmlFor="claim-comment" className="sm:col-span-2">
              <Textarea
                id="claim-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you do, and what's the next step?"
                rows={3}
                className="bg-card"
              />
            </Field>
          </div>
        </section>

        <section aria-label="Claim details">
          <SectionTitle>Claim details</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
            <Fact label="Responsible">{claim.responsible || "—"}</Fact>
            <Fact label="Provider">{claim.provider || "—"}</Fact>
            <Fact label="Practice">{claim.practiceName}</Fact>
            <Fact label="Service date">{formatDateNumeric(claim.dos)}</Fact>
            <Fact label="Billed date">{formatDateNumeric(claim.billedDate)}</Fact>
            <Fact label="Claim date">{formatDateNumeric(claim.claimDate)}</Fact>
            <Fact label="Aging">
              {bucketShort(bucketOfAge(age))}
              {age !== null && <span className="text-muted-foreground"> · {age} days</span>}
            </Fact>
            <Fact label="Procedure">
              <span className="font-mono">{claim.cpt || "—"}</span>
            </Fact>
            <Fact label="Charge">
              <span className="tabular-nums">{formatCurrency(claim.billedAmount)}</span>
            </Fact>
            <Fact label="Balance">
              <span className="font-bold tabular-nums">{formatCurrency(balanceOf(claim))}</span>
            </Fact>
            {claim.paidOn && <Fact label="Paid on">{formatDateNumeric(claim.paidOn)}</Fact>}
            {claim.account && <Fact label="Account">{claim.account}</Fact>}
            {claim.patientAcctNo && <Fact label="Patient acct no">{claim.patientAcctNo}</Fact>}
            {customFields.map((f) => (claim.extra?.[f.key] ? <Fact key={f.key} label={f.label}>{claim.extra[f.key]}</Fact> : null))}
            {claim.dateOfBirth && <Fact label="Date of birth">{formatDateNumeric(claim.dateOfBirth)}</Fact>}
          </dl>
        </section>

        <section aria-labelledby="claim-history">
          <SectionTitle id="claim-history">History</SectionTitle>
          <ol className="ml-1.5 space-y-5 border-l pl-5 text-sm">
            {history.map((e) => (
              <li key={e.id} className="relative space-y-1">
                <span
                  aria-hidden
                  className={cn("absolute top-1.5 -left-[26px] size-2.5 rounded-full ring-4 ring-popover", e.system ? "bg-slate-400" : ACTION_STYLES[e.action].dot)}
                />
                <p className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                  {e.system ? "Assignment" : e.action}
                  <span className="text-xs font-normal text-muted-foreground">{formatDateNumeric(e.actionDate)}</span>
                </p>
                {e.comment && (
                  <p className="rounded-lg bg-muted/60 px-3 py-2 whitespace-pre-wrap text-foreground/90">{e.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">by {e.by}</p>
              </li>
            ))}
            <li className="relative space-y-1">
              <span aria-hidden className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-slate-400 ring-4 ring-popover" />
              <p className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                Added to worklist
                <span className="text-xs font-normal text-muted-foreground">
                  {formatDateNumeric(claim.billedDate || claim.claimDate || claim.dos)}
                </span>
              </p>
              <p className="text-foreground/90">Imported from a claims file.</p>
            </li>
          </ol>
        </section>
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={!dirty}>
          Save changes
        </Button>
      </footer>
    </form>
  );
}

function ReadOnlyStaff({ user }: { user?: User }) {
  return (
    <div className="flex h-10 items-center rounded-lg border bg-muted/60 px-3 text-sm">
      {user ? <StaffChip user={user} /> : <span className="text-muted-foreground">Unassigned</span>}
    </div>
  );
}
