"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import clsx from "clsx";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAuthStore } from "@/lib/store/use-auth-store";

interface ExamPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export function ExamPlannerModal({
  isOpen,
  onClose,
  defaultSubjectId,
}: ExamPlannerModalProps) {
  const { examPlans, createExamPlan, updateDailyMilestone, rescheduleMilestones } =
    useAcademicStore();
  const { subjects, modules } = useStudyStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<"form" | "view">("form");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Form states
  const [examName, setExamName] = useState("ITST 306 Midterm Examination");
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || (subjects[0]?.id ?? "")
  );

  // 3 weeks out default
  const defaultExamDate = new Date(Date.now() + 21 * 86400000)
    .toISOString()
    .split("T")[0];
  const [examDate, setExamDate] = useState(defaultExamDate);

  if (!isOpen) return null;

  const currentPlan =
    examPlans.find((p) => p.id === selectedPlanId) || examPlans[examPlans.length - 1];

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examDate || !user) return;

    const subjectModules = modules.filter((m) => m.subjectId === selectedSubjectId);
    const moduleTitles =
      subjectModules.length > 0
        ? subjectModules.map((m) => m.title)
        : [
            "Module 1: UX Fundamentals",
            "Module 2: Prototyping & Cross-Platform",
            "Module 3: Usability & Heuristic Evaluation",
          ];

    const plan = createExamPlan(
      {
        userId: user.id,
        subjectId: selectedSubjectId,
        examName,
        examDate,
        coverageModuleIds: subjectModules.map((m) => m.id),
      },
      moduleTitles
    );

    setSelectedPlanId(plan.id);
    setStep("view");
  };

  const handleReschedule = () => {
    if (!currentPlan) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    rescheduleMilestones(currentPlan.id, tomorrow);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[460px] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Exam Study Roadmap Planner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {step === "form" ? (
          <form onSubmit={handleGeneratePlan} className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Target Exam Setup
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  StudyDeck will calculate an optimal spaced revision schedule from today until exam day.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. ITST 306 Midterm Examination"
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-xs focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-xs focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}
                      </option>
                    ))}
                    {subjects.length === 0 && <option value="itst306">ITST 306</option>}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Adaptive Algorithm Features:
                </span>
                <p>• Allocates study sessions per module with spaced review days</p>
                <p>• Automatically schedules dedicated weak-topic remediation 2 days before exam</p>
                <p>• Syncs milestones directly to your calendar &amp; daily agenda</p>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-2.5 px-4 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Generate Adaptive Study Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* ================= VIEW GENERATED PLAN ================= */
          <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {currentPlan?.examName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target Date: {currentPlan?.examDate} • {currentPlan?.dailySchedule.length} Study
                    Milestones
                  </p>
                </div>

                <button
                  onClick={handleReschedule}
                  className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reschedule</span>
                </button>
              </div>

              <div className="space-y-2">
                {currentPlan?.dailySchedule.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateDailyMilestone(currentPlan.id, idx, !milestone.completed)
                        }
                        className="text-slate-400 hover:text-brand-700"
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <span
                          className={clsx(
                            "font-semibold block",
                            milestone.completed
                              ? "line-through text-slate-400"
                              : "text-slate-800 dark:text-slate-200"
                          )}
                        >
                          {milestone.moduleOrTopicTitle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {milestone.date} • Goal: {milestone.targetCards} items
                        </span>
                      </div>
                    </div>

                    <span
                      className={clsx(
                        "text-[10px] px-2 py-0.5 rounded font-medium",
                        milestone.completed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {milestone.completed ? "Done" : "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2 mt-4">
              <button
                onClick={() => setStep("form")}
                className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500"
              >
                Plan Another Exam
              </button>
              <button
                onClick={onClose}
                className="py-2 px-5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-medium"
              >
                Close Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
