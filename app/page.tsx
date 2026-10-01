"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { AuthView } from "@/components/auth/auth-view";
import { AppShell } from "@/components/navigation/app-shell";
import { HomeView } from "@/components/home/home-view";

export default function RootPage() {
  const { user, isAuthenticated, isOnboarded } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AuthView />;
  }

  // Pre-auth screens (Welcome / Login / Signup / Onboarding)
  if (!isAuthenticated || !isOnboarded || !user) {
    return <AuthView />;
  }

  // Main StudyDeck App
  return (
    <AppShell>
      <HomeView />
    </AppShell>
  );
}
