import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  tax_id: z.string().max(32).nullable().optional(),
  npi: z.string().max(20).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  retention_days: z.number().int().min(30).max(3650).optional(),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", ctx.organizationId)
      .single();

    if (error) throw error;
    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/organization" });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "practices.manage");

    const body = await parseJsonBody(req, updateOrgSchema);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("organizations")
      .update(body)
      .eq("id", ctx.organizationId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "organization.update",
      resourceType: "organization",
      resourceId: ctx.organizationId,
    });

    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/organization" });
  }
}
