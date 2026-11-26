import { useMemo } from "react";
import type { User } from "@/lib/types";
import { useDemoStore } from "./demo-store";

/** Practice id -> practice, for cheap lookups in tables. */
export function usePracticeLookup() {
  const practices = useDemoStore((s) => s.practices);
  return useMemo(() => new Map(practices.map((p) => [p.id, p])), [practices]);
}

export function useUserLookup() {
  const users = useDemoStore((s) => s.users);
  return useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
}

/** Denial code -> record, keyed by the code as stored. */
export function useDenialCodeLookup() {
  const codes = useDemoStore((s) => s.denialCodes);
  return useMemo(() => new Map(codes.map((c) => [c.code, c])), [codes]);
}

/** The user the demo is currently "viewing as" (falls back to the first admin, then anyone). */
export function useCurrentUser(): User {
  const users = useDemoStore((s) => s.users);
  const id = useDemoStore((s) => s.viewAsUserId);
  return users.find((u) => u.id === id) ?? users.find((u) => u.role === "Admin") ?? users[0];
}

export const useIsAdmin = () => useCurrentUser().role === "Admin";
