import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role_id: z.string().uuid(),
  practice_ids: z.array(z.string().uuid()).optional().default([]),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "users.manage");

    const supabase = await createSupabaseServerClient();
    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, full_name, email, status, color_index, last_login_at, role_id, roles(key, name), user_practices(practice_id)")
        .eq("organization_id", ctx.organizationId)
        .is("deleted_at", null)
        .order("full_name"),
      supabase.from("roles").select("id, key, name, description").order("name"),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (rolesRes.error) throw rolesRes.error;

    return ok({ users: usersRes.data ?? [], roles: rolesRes.data ?? [] });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/users" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "users.manage");

    const body = await parseJsonBody(req, inviteUserSchema);
    const token = randomBytes(24).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_invitations")
      .insert({
        organization_id: ctx.organizationId,
        email: body.email.toLowerCase(),
        role_id: body.role_id,
        practice_ids: body.practice_ids,
        invited_by: ctx.userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "user.invite",
      resourceType: "user_invitation",
      resourceId: data.id,
      metadata: { email: body.email },
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/users" });
  }
}
