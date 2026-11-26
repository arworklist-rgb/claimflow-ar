import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/server/auth/rbac";

export interface ClaimImportRow {
  claim_no: string;
  patient_name: string;
  patient_acct_no?: string;
  service_date: string;
  billed_amount: number;
  responsible?: string;
  extra_fields?: Record<string, unknown>;
}

export interface PaidImportRow {
  patient_acct_no?: string;
  patient_name: string;
  service_date: string;
  payment_date: string;
  transaction_by?: string;
  paid_amount: number;
}

/** Calculate claim age in days from service_date (or denial_date if provided). */
export function calculateAgeDays(referenceDate: string): number {
  const start = new Date(referenceDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

/** Map age in days to standard AR aging bucket label. */
export function getAgingBucketLabel(days: number): string {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  if (days <= 120) return "91-120";
  return "120+";
}

/**
 * Reconcile a batch of new claims for a practice:
 * - New claim -> uploader becomes AR 1
 * - Existing claim -> if uploader != AR 1, uploader becomes AR 2
 */
export async function processNewClaimsImport(params: {
  ctx: AuthContext;
  practiceId: string;
  softwareTemplateId?: string;
  rows: ClaimImportRow[];
}) {
  const supabase = await createSupabaseServerClient();
  let inserted = 0;
  let updated = 0;
  const errors: Array<{ row_number: number; error_message: string; raw_row: unknown }> = [];

  for (let i = 0; i < params.rows.length; i++) {
    const row = params.rows[i];
    if (!row.claim_no || !row.patient_name || !row.service_date) {
      errors.push({
        row_number: i + 1,
        error_message: "Missing required claim_no, patient_name, or service_date.",
        raw_row: row,
      });
      continue;
    }

    const { data: existing } = await supabase
      .from("claims")
      .select("id, ar1_user_id, ar2_user_id")
      .eq("organization_id", params.ctx.organizationId)
      .eq("practice_id", params.practiceId)
      .eq("claim_no", row.claim_no)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("claims").insert({
        organization_id: params.ctx.organizationId,
        practice_id: params.practiceId,
        software_template_id: params.softwareTemplateId ?? null,
        claim_no: row.claim_no,
        patient_name: row.patient_name,
        patient_acct_no: row.patient_acct_no ?? null,
        service_date: row.service_date,
        billed_amount: row.billed_amount,
        responsible: row.responsible ?? null,
        extra_fields: row.extra_fields ?? {},
        ar1_user_id: params.ctx.userId,
        action: "New",
      });

      if (error) {
        errors.push({ row_number: i + 1, error_message: error.message, raw_row: row });
      } else {
        inserted++;
      }
    } else {
      const assignAr2 = existing.ar1_user_id !== params.ctx.userId ? params.ctx.userId : existing.ar2_user_id;
      const { error } = await supabase
        .from("claims")
        .update({
          patient_name: row.patient_name,
          billed_amount: row.billed_amount,
          responsible: row.responsible ?? undefined,
          extra_fields: row.extra_fields ?? undefined,
          ar2_user_id: assignAr2,
        })
        .eq("id", existing.id);

      if (error) {
        errors.push({ row_number: i + 1, error_message: error.message, raw_row: row });
      } else {
        updated++;
      }
    }
  }

  return { inserted, updated, failed: errors.length, errors };
}

/**
 * Reconcile a batch of paid claim rows:
 * - Matches on normalized patient_name + service_date within the organization
 * - Handles unmatched, multiple-match, partial payment, and auto-close when paid >= billed
 */
export async function processPaidClaimsImport(params: {
  ctx: AuthContext;
  rows: PaidImportRow[];
}) {
  const supabase = await createSupabaseServerClient();
  let matched = 0;
  let unmatched = 0;
  let multipleMatches = 0;

  for (const row of params.rows) {
    const { data: candidates } = await supabase
      .from("claims")
      .select("id, billed_amount, paid_amount")
      .eq("organization_id", params.ctx.organizationId)
      .ilike("patient_name", row.patient_name.trim())
      .eq("service_date", row.service_date)
      .is("deleted_at", null);

    let matchStatus: "Matched" | "Partial" | "Multiple_Match" | "Unmatched" = "Unmatched";

    if (!candidates || candidates.length === 0) {
      unmatched++;
      matchStatus = "Unmatched";
    } else if (candidates.length > 1) {
      multipleMatches++;
      matchStatus = "Multiple_Match";
    } else {
      const claim = candidates[0];
      const nextPaid = Number(claim.paid_amount) + Number(row.paid_amount);
      const isSettled = nextPaid >= Number(claim.billed_amount) && Number(claim.billed_amount) > 0;
      matchStatus = isSettled ? "Matched" : "Partial";
      matched++;

      await supabase
        .from("claims")
        .update({
          paid_amount: nextPaid,
          action: isSettled ? "Paid and closed" : "Inprocess",
          closed_at: isSettled ? new Date().toISOString() : null,
        })
        .eq("id", claim.id);

      await supabase.from("claim_events").insert({
        organization_id: params.ctx.organizationId,
        claim_id: claim.id,
        actor_user_id: params.ctx.userId,
        action: isSettled ? "Paid and closed" : "Inprocess",
        action_date: row.payment_date,
        comment: `Payment posted: $${Number(row.paid_amount).toFixed(2)}${row.transaction_by ? ` via ${row.transaction_by}` : ""}`,
        is_system: true,
      });
    }

    await supabase.from("payments").insert({
      organization_id: params.ctx.organizationId,
      patient_acct_no: row.patient_acct_no ?? null,
      patient_name: row.patient_name,
      service_date: row.service_date,
      payment_date: row.payment_date,
      transaction_by: row.transaction_by ?? null,
      amount: row.paid_amount,
      match_status: matchStatus,
    });
  }

  return { matched, unmatched, multipleMatches, total: params.rows.length };
}
