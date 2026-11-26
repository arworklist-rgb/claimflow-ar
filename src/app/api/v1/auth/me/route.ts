import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { handleApiError, ok } from "@/server/api/response";
import { requireAuth } from "@/server/auth/rbac";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: profile } = await admin
      .from("user_profiles")
      .select("id, full_name, email, status, color_index, organization_id, organizations(name)")
      .eq("id", ctx.userId)
      .single();

    return ok({
      userId: ctx.userId,
      email: ctx.email,
      fullName: profile?.full_name ?? ctx.email,
      organizationId: ctx.organizationId,
      organizationName: (profile?.organizations as unknown as { name?: string } | null)?.name ?? "Organization",
      roleKey: ctx.roleKey,
      permissions: Array.from(ctx.permissions),
      practiceIds: ctx.practiceIds,
      colorIndex: profile?.color_index ?? 0,
    });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/auth/me" });
  }
}
