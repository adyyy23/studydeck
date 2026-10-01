"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading schedule...</div>}>
        <CalendarView />
      </Suspense>
    </AppShell>
  );
}
