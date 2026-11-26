"use client";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/shared/user-avatar";
import { pluralize } from "@/lib/format";
import type { Practice, User } from "@/lib/types";

interface ViewUsersSheetProps {
  practice: Practice | null;
  users: User[];
  onOpenChange: (open: boolean) => void;
}

export function ViewUsersSheet({ practice, users, onOpenChange }: ViewUsersSheetProps) {
  return (
    <Sheet open={!!practice} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{practice?.name}</SheetTitle>
          <SheetDescription>
            {users.length} assigned {pluralize(users.length, "user")} · {practice?.code}
          </SheetDescription>
        </SheetHeader>
        <ul className="flex-1 divide-y overflow-y-auto">
          {users.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No users are assigned to this practice yet.</li>
          )}
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-5 py-3.5">
              <UserAvatar user={u} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant="outline" className="shrink-0 rounded-full text-xs">
                {u.role}
              </Badge>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
