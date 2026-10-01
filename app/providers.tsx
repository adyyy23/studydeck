"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { useAuthStore } from "@/lib/store/use-auth-store";

function ThemeInjector() {
  const { appTheme, lightDarkMode } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const toRemove = Array.from(root.classList).filter((c) => c.startsWith("theme-"));
    toRemove.forEach((c) => root.classList.remove(c));
    if (appTheme !== "studydeck") root.classList.add(`theme-${appTheme}`);
    if (lightDarkMode === "dark") {
      root.classList.add("dark");
    } else if (lightDarkMode === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [appTheme, lightDarkMode]);

  useEffect(() => {
    if (lightDarkMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [lightDarkMode]);

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
