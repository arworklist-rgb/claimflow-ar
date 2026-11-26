"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ROLE_DEFAULT_PERMISSIONS, ROLE_LABELS } from "@/lib/auth/permissions";
import { useCurrentUser } from "@/lib/store/selectors";
import type { RoleKey } from "@/server/auth/rbac";

export interface ClientAuthState {
  loading: boolean;
  authenticated: boolean;
  userId: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roleKey: RoleKey;
  roleLabel: string;
  permissions: Set<string>;
  practiceIds: string[];
  can: (permissionKey: string) => boolean;
}

interface ServerUserPayload {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  roleKey: RoleKey;
  permissions: string[];
  practiceIds: string[];
}

function mapDemoRole(role: string): RoleKey {
  switch (role) {
    case "Admin":
      return "org_admin";
    case "Billing Manager":
      return "manager";
    case "AR Specialist":
      return "ar_1";
    case "Coder":
      return "ar_2";
    default:
      return "viewer";
  }
}

const AuthReactContext = createContext<ClientAuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const demoUser = useCurrentUser();
  const [serverUser, setServerUser] = useState<ServerUserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      return;
    }
    if (serverUser) {
      setLoading(false);
      return;
    }

    let active = true;
    fetch("/api/v1/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.ok && json.data) {
          setServerUser(json.data);
        }
      })
      .catch(() => {
        // Demo fallback when unauthenticated
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, serverUser]);

  const value = useMemo<ClientAuthState>(() => {
    const roleKey: RoleKey = serverUser?.roleKey ?? mapDemoRole(demoUser.role);
    const permList = serverUser?.permissions ?? ROLE_DEFAULT_PERMISSIONS[roleKey] ?? [];
    const permissions = new Set(permList);

    return {
      loading,
      authenticated: Boolean(serverUser),
      userId: serverUser?.userId ?? demoUser.id,
      fullName: serverUser?.fullName ?? demoUser.name,
      email: serverUser?.email ?? demoUser.email,
      organizationId: serverUser?.organizationId ?? "demo-org",
      organizationName: serverUser?.organizationName ?? "ClaimFlow Demo Org",
      roleKey,
      roleLabel: ROLE_LABELS[roleKey],
      permissions,
      practiceIds: serverUser?.practiceIds ?? [],
      can: (permissionKey: string) =>
        roleKey === "super_admin" || roleKey === "org_admin" || permissions.has(permissionKey),
    };
  }, [loading, serverUser, demoUser]);

  return createElement(AuthReactContext.Provider, { value }, children);
}

export function useAuth(): ClientAuthState {
  const ctx = useContext(AuthReactContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
