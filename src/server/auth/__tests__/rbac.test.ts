import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/response";
import { requirePermission, requirePracticeAccess, type AuthContext } from "@/server/auth/rbac";

function makeCtx(overrides?: Partial<AuthContext>): AuthContext {
  return {
    userId: "user-1",
    email: "test@claimflow.test",
    organizationId: "org-1",
    roleKey: "ar_1",
    permissions: new Set(["claims.read", "claims.write"]),
    practiceIds: ["practice-1"],
    ...overrides,
  };
}

describe("RBAC enforcement", () => {
  it("allows super_admin and org_admin regardless of explicit permission set", () => {
    const adminCtx = makeCtx({ roleKey: "org_admin", permissions: new Set() });
    expect(() => requirePermission(adminCtx, "users.manage")).not.toThrow();
  });

  it("blocks viewer from write operations", () => {
    const viewerCtx = makeCtx({ roleKey: "viewer", permissions: new Set(["claims.read"]) });
    expect(() => requirePermission(viewerCtx, "claims.write")).toThrow(ApiError);
  });

  it("enforces practice-level isolation for AR 1 / AR 2", () => {
    const arCtx = makeCtx({ roleKey: "ar_1", practiceIds: ["practice-1"] });
    expect(() => requirePracticeAccess(arCtx, "practice-1")).not.toThrow();
    expect(() => requirePracticeAccess(arCtx, "practice-2")).toThrow(ApiError);
  });

  it("allows manager across organization practices", () => {
    const mgrCtx = makeCtx({ roleKey: "manager", practiceIds: [] });
    expect(() => requirePracticeAccess(mgrCtx, "practice-99")).not.toThrow();
  });
});
