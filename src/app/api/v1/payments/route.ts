import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const matchPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  applied_amount: z.number().positive(),
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("payments")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .order("payment_date", { ascending: false })
      .limit(100);

    if (status) query = query.eq("match_status", status);

    const { data, error } = await query;
    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/payments" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const body = await parseJsonBody(req, matchPaymentSchema);
    const supabase = await createSupabaseServerClient();

    const { data: match, error: matchErr } = await supabase
      .from("payment_claim_matches")
      .insert({
        organization_id: ctx.organizationId,
        payment_id: body.payment_id,
        claim_id: body.claim_id,
        applied_amount: body.applied_amount,
        matched_by: ctx.userId,
      })
      .select()
      .single();

    if (matchErr) throw matchErr;

    await supabase
      .from("payments")
      .update({ match_status: "Matched" })
      .eq("id", body.payment_id)
      .eq("organization_id", ctx.organizationId);

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "payment.match",
      resourceType: "payment",
      resourceId: body.payment_id,
      metadata: { claim_id: body.claim_id, applied_amount: body.applied_amount },
    });

    return ok(match, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/payments" });
  }
}
