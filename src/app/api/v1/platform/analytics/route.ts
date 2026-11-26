import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ApiError, handleApiError, ok } from "@/server/api/response";
import { requireAuth } from "@/server/auth/rbac";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx.roleKey !== "super_admin") {
      throw new ApiError(403, "FORBIDDEN", "Super Admin access required.");
    }

    const admin = createSupabaseAdminClient();
    const [orgs, users, claims, imports] = await Promise.all([
      admin.from("organizations").select("id", { count: "exact", head: true }).is("deleted_at", null),
      admin.from("user_profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
      admin.from("claims").select("id", { count: "exact", head: true }).is("deleted_at", null),
      admin.from("import_jobs").select("id, status", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
    ]);

    return ok({
      totalOrganizations: orgs.count ?? 0,
      totalUsers: users.count ?? 0,
      totalClaims: claims.count ?? 0,
      recentImports: imports.data ?? [],
    });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/platform/analytics" });
  }
}
