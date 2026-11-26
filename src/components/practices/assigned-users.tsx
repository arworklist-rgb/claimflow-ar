import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { User } from "@/lib/types";

const MAX_VISIBLE = 2;

/** Overlapping initials avatars (max 2) plus a "+N" chip; a tooltip lists everyone. */
export function AssignedUsers({ users }: { users: User[] }) {
  if (users.length === 0) return <span className="text-sm text-muted-foreground">No users</span>;

  const visible = users.slice(0, MAX_VISIBLE);
  const extra = users.length - visible.length;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`${users.length} assigned users: ${users.map((u) => u.name).join(", ")}`}
        >
          <span className="flex -space-x-2">
            {visible.map((u) => (
              <UserAvatar key={u.id} user={u} className="size-8 ring-2 ring-card" />
            ))}
          </span>
          {extra > 0 && (
            <span className="relative -ml-2 flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-soft-foreground ring-2 ring-card">
              +{extra}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex-col items-start gap-0.5">
        {users.map((u) => (
          <span key={u.id}>{u.name}</span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
