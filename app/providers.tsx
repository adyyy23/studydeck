"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useSettingsStore } from "@/lib/store/use-settings-store";

/**
 * ThemeInjector — reads appTheme and lightDarkMode from the settings store
 * and imperatively applies the correct class names to <html>.
 *
 * Rules:
 *  - Removes all `theme-*` classes from documentElement first.
 *  - Adds `theme-{appTheme}` only when appTheme !== 'studydeck' (default).
 *  - Handles lightDarkMode:
 *      'dark'   → adds 'dark' class
 *      'light'  → removes 'dark' class
 *      'system' → mirrors window.matchMedia('(prefers-color-scheme: dark)')
 */
function ThemeInjector() {
  const { appTheme, lightDarkMode } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // 1. Strip all existing theme-* classes
    const toRemove = Array.from(root.classList).filter((c) =>
      c.startsWith("theme-")
    );
    toRemove.forEach((c) => root.classList.remove(c));

    // 2. Apply colour-palette theme class (skip for the built-in default)
    if (appTheme !== "studydeck") {
      root.classList.add(`theme-${appTheme}`);
    }

    // 3. Apply light / dark mode
    if (lightDarkMode === "dark") {
      root.classList.add("dark");
    } else if (lightDarkMode === "light") {
      root.classList.remove("dark");
    } else {
      // 'system' — respect OS preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [appTheme, lightDarkMode]);

  // Also listen for OS-level changes when in 'system' mode
  useEffect(() => {
    if (lightDarkMode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [lightDarkMode]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Unregister any legacy service workers and clear caches
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister();
        }
      });
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={true}>
      {/* ThemeInjector drives app-specific theme/palette on top of next-themes */}
      <ThemeInjector />
      {children}
    </ThemeProvider>
  );
}
