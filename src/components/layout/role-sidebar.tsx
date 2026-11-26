"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { SIDEBAR_SECTIONS, isNavActive } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function RoleSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { loading, roleKey, roleLabel, can } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/" || pathname === "/login") return null;

  const visibleSections = SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.roles && !item.roles.includes(roleKey)) return false;
      if (item.permission && !can(item.permission)) return false;
      return true;
    }),
  })).filter((s) => s.items.length > 0);

  return (
    <aside
      className={cn(
        "bg-sidebar hidden shrink-0 border-r transition-[width] duration-200 lg:block",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="sticky top-16 flex max-h-[calc(100vh-4rem)] flex-col overflow-y-auto px-2.5 py-4">
        <div className={cn("mb-4 flex items-center gap-2", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && (
            <Badge variant="secondary" className="truncate text-xs font-semibold">
              {loading ? "Loading..." : roleLabel}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>

        <nav aria-label="Role Navigation" className="space-y-5">
          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="text-muted-foreground px-3 text-[11px] font-semibold tracking-wider uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item, pathname, search);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    prefetch={false}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2" : "px-3",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function RoleSidebar() {
  return (
    <Suspense fallback={null}>
      <RoleSidebarInner />
    </Suspense>
  );
}
