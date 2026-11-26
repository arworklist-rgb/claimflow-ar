import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const createDenialCodeSchema = z.object({
  code: z.string().min(1).max(32),
  code_type: z.enum(["CARC", "RARC", "Internal"]).optional().default("CARC"),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(80),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("denial_codes")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("code", { ascending: true });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/denial-codes" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "denial_codes.manage");

    const body = await parseJsonBody(req, createDenialCodeSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("denial_codes")
      .insert({ ...body, organization_id: ctx.organizationId })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "denial_code.create",
      resourceType: "denial_code",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/denial-codes" });
  }
}
