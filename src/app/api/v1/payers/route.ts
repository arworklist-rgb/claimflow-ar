import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const payerSchema = z.object({
  payer_code: z.string().min(1).max(32),
  name: z.string().min(1).max(160),
  edi_payer_id: z.string().max(40).optional(),
  timely_filing_days: z.number().int().positive().default(90),
  appeal_filing_days: z.number().int().positive().default(60),
  phone: z.string().max(40).optional(),
  portal_url: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payers")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("name");

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/payers" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "practices.manage");

    const body = await parseJsonBody(req, payerSchema);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payers")
      .insert({ ...body, organization_id: ctx.organizationId })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "payer.create",
      resourceType: "payer",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/payers" });
  }
}
