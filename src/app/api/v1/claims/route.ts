import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, requirePracticeAccess, writeAuditLog } from "@/server/auth/rbac";

const createClaimSchema = z.object({
  practice_id: z.string().uuid(),
  claim_no: z.string().min(1).max(64),
  patient_name: z.string().min(1).max(160),
  patient_acct_no: z.string().max(64).optional(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billed_amount: z.number().nonnegative(),
  paid_amount: z.number().nonnegative().optional().default(0),
  responsible: z.string().max(100).optional(),
  denial_codes: z.array(z.string()).optional().default([]),
  extra_fields: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const url = new URL(req.url);
    const practiceId = url.searchParams.get("practiceId");
    const action = url.searchParams.get("action");
    const search = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const offset = (page - 1) * limit;

    if (practiceId) {
      requirePracticeAccess(ctx, practiceId);
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("claims")
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("service_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (practiceId) query = query.eq("practice_id", practiceId);
    if (action) query = query.eq("action", action);
    if (search) query = query.or(`claim_no.ilike.%${search}%,patient_name.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return ok({ items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/claims" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const body = await parseJsonBody(req, createClaimSchema);
    requirePracticeAccess(ctx, body.practice_id);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("claims")
      .insert({
        ...body,
        organization_id: ctx.organizationId,
        ar1_user_id: ctx.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "claim.create",
      resourceType: "claim",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/claims" });
  }
}
