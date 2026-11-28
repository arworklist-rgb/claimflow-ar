"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";
import { hydrateAllFromSupabase } from "@/lib/supabase/store-sync";

/**
 * The store is created with `skipHydration`, so the server render and the first client
 * render both use the seed data. Persisted state is loaded right after mount, and when
 * authenticated, live Supabase data replaces demo state.
 */
function StoreHydrator() {
  const { authenticated } = useAuth();
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (authenticated) {
      void hydrateAllFromSupabase();
    }
  }, [authenticated]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={150}>
        <AuthProvider>
          <StoreHydrator />
          {children}
          <Toaster position="bottom-right" closeButton />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
