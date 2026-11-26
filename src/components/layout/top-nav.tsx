"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/use-auth";
import { SIDEBAR_SECTIONS, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { PracticeSelect } from "./practice-select";
import { UserMenu } from "./user-menu";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-nav-foreground hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}

function NotificationsMenu() {
  const { authenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    fetch("/api/v1/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok && Array.isArray(j.data?.notifications)) {
          setItems(j.data.notifications);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authenticated]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await fetch("/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-nav-foreground hover:bg-white/10 hover:text-white dark:hover:bg-white/10 aria-expanded:bg-white/10"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 size-2 rounded-full bg-red-500 ring-2 ring-nav" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Link href="/settings/notifications" className="text-primary text-xs font-medium hover:underline">
            View all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-4 text-center text-xs">
            No notifications yet.
          </div>
        ) : (
          items.slice(0, 6).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5 py-2"
              onSelect={() => void markRead(n.id)}
            >
              <span className={cn("text-sm", !n.read_at ? "font-semibold" : "font-normal")}>{n.title}</span>
              <span className="text-muted-foreground line-clamp-1 text-xs">{n.body}</span>
              <span className="text-muted-foreground text-[11px]">{new Date(n.created_at).toLocaleString()}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { roleKey, can } = useAuth();

  if (pathname === "/login") {
    return (
      <header className="sticky top-0 z-40 border-b border-nav-border bg-nav/95 text-nav-foreground backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
    );
  }

  const visibleSections = SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.roles && !item.roles.includes(roleKey)) return false;
      if (item.permission && !can(item.permission)) return false;
      return true;
    }),
  })).filter((s) => s.items.length > 0);

  return (
    <header className="sticky top-0 z-40 border-b border-nav-border bg-nav/95 text-nav-foreground shadow-[0_4px_18px_rgba(7,14,27,0.16)] backdrop-blur supports-[backdrop-filter]:bg-nav/90">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-nav-foreground hover:bg-white/10 hover:text-white lg:hidden dark:hover:bg-white/10"
          aria-label="Open navigation sidebar"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>

        <Logo />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden md:block">
            <PracticeSelect className="w-40 sm:w-48" />
          </div>
          <ThemeToggle />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 overflow-y-auto border-nav-border bg-nav p-0 text-nav-foreground [&>button]:text-white">
          <SheetHeader className="border-b border-nav-border p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Role-based navigation sidebar</SheetDescription>
            <Logo />
          </SheetHeader>
          <nav aria-label="Mobile Role Navigation" className="flex flex-col gap-4 p-3">
            {visibleSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold tracking-wider text-nav-foreground/50 uppercase">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const active = isNavActive(item, pathname, search);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                        active ? "bg-[#1d4ed8] text-white" : "text-nav-foreground/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="mt-auto border-t border-nav-border p-4 md:hidden">
            <p className="mb-2 text-xs font-medium tracking-wide text-nav-foreground/60 uppercase">Practice</p>
            <PracticeSelect className="w-full" />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function TopNav() {
  return (
    <Suspense fallback={null}>
      <TopNavInner />
    </Suspense>
  );
}
