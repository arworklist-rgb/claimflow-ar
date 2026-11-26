import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "audit.read");

    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));

    if (ctx.roleKey === "super_admin") {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ok(data ?? []);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/audit-logs" });
  }
}
