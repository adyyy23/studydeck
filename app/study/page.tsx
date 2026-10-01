"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { StudyView } from "@/components/study/study-view";

export default function StudyPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading curriculum...</div>}>
        <StudyView />
      </Suspense>
    </AppShell>
  );
}
