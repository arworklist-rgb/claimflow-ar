import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const updateContactSchema = z.object({
  practice_id: z.string().uuid().nullable().optional(),
  category: z.string().min(1).max(60).optional(),
  name: z.string().min(1).max(160).optional(),
  phones: z.array(z.object({ type: z.string(), number: z.string() })).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  hours: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "helpdesk.manage");

    const { id } = await context.params;
    const body = await parseJsonBody(req, updateContactSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("help_contacts")
      .update(body)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) throw new ApiError(404, "NOT_FOUND", "HelpDesk contact not found.");

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "help_contact.update",
      resourceType: "help_contact",
      resourceId: id,
    });

    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/help-contacts/[id]" });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "helpdesk.manage");

    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("help_contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null);

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "help_contact.delete",
      resourceType: "help_contact",
      resourceId: id,
    });

    return ok({ deleted: true, id });
  } catch (err) {
    return handleApiError(err, { route: "DELETE /api/v1/help-contacts/[id]" });
  }
}
