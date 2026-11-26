"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";

/**
 * The store is created with `skipHydration`, so the server render and the first client
 * render both use the seed data. Persisted state is loaded right after mount.
 */
function StoreHydrator() {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={150}>
        <StoreHydrator />
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" closeButton />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
