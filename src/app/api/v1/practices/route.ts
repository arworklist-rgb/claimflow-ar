import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const createPracticeSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(160),
  npi: z.string().max(20).optional(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/practices" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "practices.manage");

    const body = await parseJsonBody(req, createPracticeSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("practices")
      .insert({ ...body, organization_id: ctx.organizationId })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "practice.create",
      resourceType: "practice",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/practices" });
  }
}
