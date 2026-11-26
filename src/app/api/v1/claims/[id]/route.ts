import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, requirePracticeAccess, writeAuditLog } from "@/server/auth/rbac";

const patchClaimSchema = z.object({
  action: z.string().min(1).optional(),
  submitted_status: z.enum(["First", "Second", "Third"]).nullable().optional(),
  denial_codes: z.array(z.string()).optional(),
  paid_amount: z.number().nonnegative().optional(),
  responsible: z.string().max(100).optional(),
  follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  escalated: z.boolean().optional(),
  comment: z.string().max(2000).optional(),
  action_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const { id } = await context.params;
    const body = await parseJsonBody(req, patchClaimSchema);
    const supabase = await createSupabaseServerClient();

    const { data: existing, error: fetchError } = await supabase
      .from("claims")
      .select("id, practice_id, billed_amount, paid_amount, action")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      throw new ApiError(404, "NOT_FOUND", "Claim not found.");
    }
    requirePracticeAccess(ctx, existing.practice_id);

    const { comment, action_date, ...updates } = body;
    const nextPaid = updates.paid_amount ?? Number(existing.paid_amount);
    const isSettled = nextPaid >= Number(existing.billed_amount) && Number(existing.billed_amount) > 0;

    const { data: updated, error: updateError } = await supabase
      .from("claims")
      .update({
        ...updates,
        ...(isSettled && !updates.action ? { action: "Paid and closed", closed_at: new Date().toISOString() } : {}),
      })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (updates.action || comment) {
      await supabase.from("claim_events").insert({
        organization_id: ctx.organizationId,
        claim_id: id,
        actor_user_id: ctx.userId,
        action: updates.action ?? existing.action,
        action_date: action_date ?? new Date().toISOString().slice(0, 10),
        comment: comment ?? null,
      });
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "claim.update",
      resourceType: "claim",
      resourceId: id,
      metadata: { fields: Object.keys(updates) },
    });

    return ok(updated);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/claims/[id]" });
  }
}
