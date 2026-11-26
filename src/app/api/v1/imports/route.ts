import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, requirePracticeAccess, writeAuditLog } from "@/server/auth/rbac";

const createImportSchema = z.object({
  practice_id: z.string().uuid().optional(),
  job_type: z.enum(["new_claims", "paid_claims", "denial_codes"]),
  file_name: z.string().min(1).max(255),
  file_hash: z.string().min(1).max(128),
  cloudinary_public_id: z.string().min(1),
  total_rows: z.number().int().nonnegative().optional().default(0),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("import_jobs")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/imports" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.import");

    const body = await parseJsonBody(req, createImportSchema);
    if (body.practice_id) {
      requirePracticeAccess(ctx, body.practice_id);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("import_jobs")
      .insert({
        ...body,
        organization_id: ctx.organizationId,
        uploaded_by: ctx.userId,
        cloudinary_resource_type: "raw",
        status: "Queued",
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "import.create",
      resourceType: "import_job",
      resourceId: data.id,
      metadata: { job_type: body.job_type, file_name: body.file_name },
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/imports" });
  }
}
