"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SETTINGS_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SettingsSidebar() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On mobile the nav is a horizontal strip; keep the active item in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <aside className="border-b bg-sidebar lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-4 lg:py-6">
        <div className="hidden px-3 pb-4 lg:block">
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Manage your workspace</p>
        </div>
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto px-4 py-2.5 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:p-0">
          {SETTINGS_NAV.map((item) => {
            const href = `/settings/${item.slug}`;
            const active = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                ref={active ? activeRef : undefined}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground lg:before:absolute lg:before:top-2 lg:before:bottom-2 lg:before:-left-4 lg:before:w-1 lg:before:rounded-r-full lg:before:bg-primary"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-[18px]", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
