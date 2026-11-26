import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const updatePracticeSchema = z.object({
  code: z.string().min(1).max(32).optional(),
  name: z.string().min(1).max(160).optional(),
  npi: z.string().max(20).nullable().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "practices.manage");

    const { id } = await context.params;
    const body = await parseJsonBody(req, updatePracticeSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("practices")
      .update(body)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) throw new ApiError(404, "NOT_FOUND", "Practice not found.");

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "practice.update",
      resourceType: "practice",
      resourceId: id,
    });

    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/practices/[id]" });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "practices.manage");

    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("practices")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null);

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "practice.delete",
      resourceType: "practice",
      resourceId: id,
    });

    return ok({ deleted: true, id });
  } catch (err) {
    return handleApiError(err, { route: "DELETE /api/v1/practices/[id]" });
  }
}
