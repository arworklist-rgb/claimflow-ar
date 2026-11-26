import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const createDocSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  file_name: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(120),
  size_bytes: z.number().int().positive().max(10 * 1024 * 1024),
  cloudinary_public_id: z.string().min(1),
  cloudinary_asset_id: z.string().optional(),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "documents.read");

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/documents" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "documents.manage");

    const body = await parseJsonBody(req, createDocSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("documents")
      .insert({
        ...body,
        organization_id: ctx.organizationId,
        uploaded_by: ctx.userId,
        cloudinary_resource_type: "raw",
        cloudinary_delivery_type: "authenticated",
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "document.create",
      resourceType: "document",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/documents" });
  }
}
