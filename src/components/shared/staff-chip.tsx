import { UserAvatar } from "@/components/shared/user-avatar";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Avatar initials + name. A deactivated user stays readable but greyed out. */
export function StaffChip({ user, className }: { user: User; className?: string }) {
  const inactive = user.status !== "Active";
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2", inactive && "text-muted-foreground", className)}
      title={inactive ? `${user.name} (deactivated)` : user.name}
    >
      <UserAvatar user={user} size="sm" className={cn(inactive && "opacity-50 grayscale")} />
      <span className={cn("truncate", inactive && "line-through decoration-muted-foreground/40")}>{user.name}</span>
    </span>
  );
}
