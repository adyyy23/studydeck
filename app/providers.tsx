"use client";

import React, { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { useAuthStore } from "@/lib/store/use-auth-store";

function ThemeInjector() {
  const { appTheme, lightDarkMode } = useSettingsStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (lightDarkMode) {
      setTheme(lightDarkMode);
    }
  }, [lightDarkMode, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const toRemove = Array.from(root.classList).filter((c) => c.startsWith("theme-"));
    toRemove.forEach((c) => root.classList.remove(c));
    if (appTheme && appTheme !== "studydeck") {
      root.classList.add(`theme-${appTheme}`);
    }
  }, [appTheme]);

  return null;
}

/** Initializes Supabase session on app load and listens for auth state changes */
function SupabaseAuthListener() {
  const { initializeFromSupabase, logout } = useAuthStore();

  useEffect(() => {
    initializeFromSupabase();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || url === "your_supabase_project_url" || !key) return;

    let cleanup: (() => void) | undefined;
    import("@/lib/supabase/client").then(({ getSupabaseClient }) => {
      const sb = getSupabaseClient();
      const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          logout();
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          initializeFromSupabase();
        }
      });
      cleanup = () => subscription.unsubscribe();
    });

    return () => cleanup?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      });
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={true}>
      <ThemeInjector />
      <SupabaseAuthListener />
      {children}
    </ThemeProvider>
  );
}
