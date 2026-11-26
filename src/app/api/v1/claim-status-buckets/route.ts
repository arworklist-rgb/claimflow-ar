import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

const bucketSchema = z.object({
  kind: z.enum(["status", "aging_bucket"]),
  label: z.string().min(1).max(80),
  min_days: z.number().int().nonnegative().nullable().optional(),
  max_days: z.number().int().nonnegative().nullable().optional(),
  sort_order: z.number().int().nonnegative().default(0),
  is_closing: z.boolean().default(false),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("claim_status_buckets")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .order("sort_order");

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/claim-status-buckets" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "templates.manage");

    const body = await parseJsonBody(req, bucketSchema);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("claim_status_buckets")
      .insert({ ...body, organization_id: ctx.organizationId })
      .select()
      .single();

    if (error) throw error;
    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/claim-status-buckets" });
  }
}
