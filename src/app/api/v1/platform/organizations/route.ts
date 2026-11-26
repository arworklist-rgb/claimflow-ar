import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, writeAuditLog } from "@/server/auth/rbac";

const createOrgSchema = z.object({
  name: z.string().min(1).max(160),
  tax_id: z.string().max(32).optional(),
  npi: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  status: z.enum(["Active", "Inactive", "Suspended"]).optional().default("Active"),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx.roleKey !== "super_admin") {
      throw new ApiError(403, "FORBIDDEN", "Super Admin access required.");
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("organizations")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/platform/organizations" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    if (ctx.roleKey !== "super_admin") {
      throw new ApiError(403, "FORBIDDEN", "Super Admin access required.");
    }

    const body = await parseJsonBody(req, createOrgSchema);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("organizations")
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "platform.organization.create",
      resourceType: "organization",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/platform/organizations" });
  }
}
