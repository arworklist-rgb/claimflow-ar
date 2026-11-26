import type { RoleKey } from "@/server/auth/rbac";

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  manager: "Manager / Supervisor",
  ar_1: "AR Agent 1",
  ar_2: "AR Agent 2",
  viewer: "Viewer",
};

export const ROLE_DEFAULT_PERMISSIONS: Record<RoleKey, string[]> = {
  super_admin: [
    "platform.manage",
    "claims.read",
    "claims.write",
    "claims.import",
    "claims.assign",
    "practices.manage",
    "denial_codes.manage",
    "templates.manage",
    "users.manage",
    "helpdesk.manage",
    "documents.read",
    "documents.manage",
    "reports.view",
    "audit.read",
  ],
  org_admin: [
    "claims.read",
    "claims.write",
    "claims.import",
    "claims.assign",
    "practices.manage",
    "denial_codes.manage",
    "templates.manage",
    "users.manage",
    "helpdesk.manage",
    "documents.read",
    "documents.manage",
    "reports.view",
    "audit.read",
  ],
  manager: [
    "claims.read",
    "claims.write",
    "claims.import",
    "claims.assign",
    "denial_codes.manage",
    "helpdesk.manage",
    "documents.read",
    "documents.manage",
    "reports.view",
    "audit.read",
  ],
  ar_1: ["claims.read", "claims.write", "claims.import", "documents.read", "documents.manage"],
  ar_2: ["claims.read", "claims.write", "claims.import", "documents.read", "documents.manage", "reports.view"],
  viewer: ["claims.read", "documents.read", "reports.view"],
};

export function hasPermission(permissions: Set<string> | string[], key: string): boolean {
  if (Array.isArray(permissions)) return permissions.includes(key);
  return permissions.has(key);
}
