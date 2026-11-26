"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Eye, LogOut, RotateCcw, Settings } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/use-auth";
import { clearKnowledgeFiles } from "@/lib/knowledge/file-store";
import { useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser } from "@/lib/store/selectors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

function UserOption({ user }: { user: User }) {
  return (
    <DropdownMenuRadioItem value={user.id} className="gap-2.5 py-1.5" aria-label={`View as ${user.name}, ${user.role}`}>
      <UserAvatar user={user} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{user.role}</span>
      </span>
    </DropdownMenuRadioItem>
  );
}

export function UserMenu() {
  const auth = useAuth();
  const demoUser = useCurrentUser();
  const users = useDemoStore((s) => s.users);
  const setViewAs = useDemoStore((s) => s.setViewAs);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const [confirmReset, setConfirmReset] = useState(false);

  const displayName = auth.authenticated ? auth.fullName : demoUser.name;
  const displayRole = auth.authenticated ? auth.roleLabel : demoUser.role;
  const displayEmail = auth.authenticated ? auth.email : demoUser.email;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const active = users.filter((u) => u.status === "Active");
  const admins = active.filter((u) => u.role === "Admin");
  const staff = active.filter((u) => u.role !== "Admin");

  async function handleSignOut() {
    if (auth.authenticated) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.assign("/login");
      return;
    }
    toast.info("Signed out of demo mode.");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm font-medium text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:bg-white/10"
            aria-label={`Account menu for ${displayName}, ${displayRole}`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {initials || "U"}
            </span>
            <span className="hidden text-left leading-tight min-[1440px]:block" data-testid="current-user">
              <span className="block max-w-36 truncate text-[13px] font-semibold">{displayName}</span>
              <span className="block text-[11px] font-normal text-white/65">{displayRole}</span>
            </span>
            <ChevronDown className="size-4 opacity-70" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[min(36rem,var(--radix-dropdown-menu-content-available-height))] w-72 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-3 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {initials || "U"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {displayRole} · {displayEmail}
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {!auth.authenticated && (
            <>
              <DropdownMenuLabel className="flex items-center gap-1.5 pb-0 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <Eye className="size-3.5" aria-hidden /> View as (Demo)
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={demoUser.id}
                onValueChange={(id) => {
                  setViewAs(id);
                  const next = users.find((u) => u.id === id);
                  if (next) toast.success(`Now viewing as ${next.name}`, { description: next.role });
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className={cn("pt-2 pb-0.5 text-xs font-semibold text-muted-foreground")}>Admins</DropdownMenuLabel>
                  {admins.map((u) => (
                    <UserOption key={u.id} user={u} />
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="pt-2 pb-0.5 text-xs font-semibold text-muted-foreground">Staff</DropdownMenuLabel>
                  {staff.map((u) => (
                    <UserOption key={u.id} user={u} />
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
                <RotateCcw /> Reset demo data
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem asChild>
            <Link href="/settings/notifications">
              <Settings /> Notification Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="This restores the original sample practices, denial codes, claims, documents and contacts."
        confirmLabel="Reset demo data"
        onConfirm={async () => {
          resetDemo();
          await clearKnowledgeFiles();
          toast.success("Demo data reset");
        }}
      />
    </>
  );
}
