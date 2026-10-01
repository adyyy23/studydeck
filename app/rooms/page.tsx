"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { RoomsView } from "@/components/rooms/rooms-view";

export default function RoomsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Connecting to study room...</div>}>
        <RoomsView />
      </Suspense>
    </AppShell>
  );
}
