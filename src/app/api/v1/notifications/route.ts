import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth } from "@/server/auth/rbac";

const prefsSchema = z.object({
  email_assignments: z.boolean(),
  email_followups: z.boolean(),
  email_imports: z.boolean(),
  in_app_enabled: z.boolean(),
});

const markReadSchema = z.object({
  id: z.string().uuid().optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const [itemsRes, prefsRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("organization_id", ctx.organizationId)
        .eq("user_id", ctx.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", ctx.userId)
        .maybeSingle(),
    ]);

    if (itemsRes.error) throw itemsRes.error;
    return ok({
      notifications: itemsRes.data ?? [],
      preferences: prefsRes.data ?? {
        email_assignments: true,
        email_followups: true,
        email_imports: true,
        in_app_enabled: true,
      },
    });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/notifications" });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireAuth();
    const body = await parseJsonBody(req, prefsSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: ctx.userId, ...body })
      .select()
      .single();

    if (error) throw error;
    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/notifications" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    const body = await parseJsonBody(req, markReadSchema);
    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();

    let query = supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .is("read_at", null);

    if (body.id) {
      query = query.eq("id", body.id);
    }

    const { error } = await query;
    if (error) throw error;

    return ok({ updated: true, read_at: now });
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/notifications" });
  }
}
