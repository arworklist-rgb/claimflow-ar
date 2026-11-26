import { deleteCloudinaryAsset } from "@/lib/cloudinary/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "documents.manage");

    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, cloudinary_public_id")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !doc) throw new ApiError(404, "NOT_FOUND", "Document not found.");

    await deleteCloudinaryAsset(doc.cloudinary_public_id);

    const { error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "document.delete",
      resourceType: "document",
      resourceId: id,
    });

    return ok({ deleted: true, id });
  } catch (err) {
    return handleApiError(err, { route: "DELETE /api/v1/documents/[id]" });
  }
}
