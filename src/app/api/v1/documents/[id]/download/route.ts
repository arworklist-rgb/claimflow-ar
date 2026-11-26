import { createSignedDownloadUrl } from "@/lib/cloudinary/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "documents.read");

    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, cloudinary_public_id, file_name")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .single();

    if (error || !doc) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    const signedUrl = createSignedDownloadUrl(doc.cloudinary_public_id, 300);

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "document.download",
      resourceType: "document",
      resourceId: doc.id,
    });

    return ok({ url: signedUrl, fileName: doc.file_name, expiresInSeconds: 300 });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/documents/[id]/download" });
  }
}
