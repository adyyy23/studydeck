"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { ProgressView } from "@/components/progress/progress-view";

export default function ProgressPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Computing academic retention stats...</div>}>
        <ProgressView />
      </Suspense>
    </AppShell>
  );
}
