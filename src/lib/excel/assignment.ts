import type { Claim, User } from "@/lib/types";

const clean = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
/**
 * Match a spreadsheet cell to a user by full name, then by email. Case and extra spaces are
 * ignored, and an active user wins over a deactivated one with the same name.
 */
export function findStaff(value: string | undefined, users: User[]): User | undefined {
  const key = clean(value ?? "");
  if (!key) return undefined;
  const ranked = [...users].sort((a, b) => Number(b.status === "Active") - Number(a.status === "Active"));
  return ranked.find((u) => clean(u.name) === key) ?? ranked.find((u) => clean(u.email) === key);
}

/** Realistic default staffing, used to seed claims that predate AR 1 / AR 2 (stable for a given order). */
export function defaultStaffing(index: number, users: User[]): Pick<Claim, "ar1UserId" | "ar2UserId"> {
  const active = users.filter((u) => u.status === "Active");
  const specialists = active.filter((u) => u.role === "AR Specialist");
  const others = active.filter((u) => u.role !== "AR Specialist");
  const ar1 = specialists[index % Math.max(1, specialists.length)];
  // About two in three claims also have a second person (a manager or coder) on them.
  const ar2 = index % 3 === 2 ? undefined : others[(index * 5 + 1) % Math.max(1, others.length)];
  return { ar1UserId: ar1?.id, ar2UserId: ar2?.id };
}
