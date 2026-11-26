import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

export async function GET() {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "users.manage");

    const supabase = await createSupabaseServerClient();
    const [rolesRes, permsRes] = await Promise.all([
      supabase.from("roles").select("*, role_permissions(permission_id)").order("name"),
      supabase.from("permissions").select("*").order("module, key"),
    ]);

    if (rolesRes.error) throw rolesRes.error;
    if (permsRes.error) throw permsRes.error;

    return ok({ roles: rolesRes.data ?? [], permissions: permsRes.data ?? [] });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/roles" });
  }
}
