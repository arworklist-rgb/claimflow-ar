import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("claim_events")
      .select("*, user_profiles(full_name)")
      .eq("claim_id", id)
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/claims/[id]/events" });
  }
}
