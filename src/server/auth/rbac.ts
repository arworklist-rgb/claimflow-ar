import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError } from "@/server/api/response";

export type RoleKey = "super_admin" | "org_admin" | "manager" | "ar_1" | "ar_2" | "viewer";

export interface AuthContext {
  userId: string;
  email: string;
  organizationId: string;
  roleKey: RoleKey;
  permissions: Set<string>;
  practiceIds: string[];
}

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select(`
      id,
      organization_id,
      email,
      status,
      roles!inner (
        key,
        role_permissions (
          permissions ( key )
        )
      ),
      user_practices ( practice_id )
    `)
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (profileError || !profile) {
    throw new ApiError(403, "PROFILE_NOT_FOUND", "User profile not found or inactive.");
  }

  if (profile.status !== "Active") {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "Your account is inactive or suspended.");
  }

  const roleObj = profile.roles as unknown as {
    key: RoleKey;
    role_permissions: Array<{ permissions: { key: string } | null }>;
  };

  const permissions = new Set<string>(
    (roleObj.role_permissions ?? [])
      .map((rp) => rp.permissions?.key)
      .filter((k): k is string => Boolean(k)),
  );

  const practiceIds = ((profile.user_practices ?? []) as Array<{ practice_id: string }>).map(
    (up) => up.practice_id,
  );

  return {
    userId: user.id,
    email: profile.email,
    organizationId: profile.organization_id,
    roleKey: roleObj.key,
    permissions,
    practiceIds,
  };
}

export function requirePermission(ctx: AuthContext, permissionKey: string) {
  if (ctx.roleKey === "super_admin" || ctx.roleKey === "org_admin") return;
  if (!ctx.permissions.has(permissionKey)) {
    throw new ApiError(403, "FORBIDDEN", `Missing required permission: ${permissionKey}`);
  }
}

export function requirePracticeAccess(ctx: AuthContext, practiceId: string) {
  if (ctx.roleKey === "super_admin" || ctx.roleKey === "org_admin" || ctx.roleKey === "manager") {
    return;
  }
  if (!ctx.practiceIds.includes(practiceId)) {
    throw new ApiError(403, "PRACTICE_FORBIDDEN", "You do not have access to this practice.");
  }
}

export async function writeAuditLog(params: {
  organizationId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from("audit_logs").insert({
    organization_id: params.organizationId,
    actor_user_id: params.actorUserId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    metadata: params.metadata ?? {},
  });
}
