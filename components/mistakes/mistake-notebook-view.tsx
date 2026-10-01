"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { MistakeItem } from "@/lib/types";
import { useStudyStore } from "@/lib/store/use-study-store";
import { ContextualAIDrawer } from "@/components/ai/contextual-ai-drawer";

interface MistakeNotebookViewProps {
  subjectId?: string;
  topicId?: string;
}

export function MistakeNotebookView({ subjectId, topicId }: MistakeNotebookViewProps) {
  const { mistakes, reviewMistakeAttempt, removeMistake, subjects } = useStudyStore();

  const [activeTab, setActiveTab] = useState<"unresolved" | "mastered" | "all">("unresolved");
  const [practicingMistakeId, setPracticingMistakeId] = useState<string | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ id: string; correct: boolean } | null>(null);

  // Contextual AI state
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedMistakeForAI, setSelectedMistakeForAI] = useState<MistakeItem | null>(null);

  // Filter mistakes
  const filteredMistakes = mistakes.filter((m) => {
    if (subjectId && m.subjectId !== subjectId) return false;
    if (topicId && m.topicId !== topicId) return false;
    if (activeTab === "unresolved") return m.state !== "mastered";
    if (activeTab === "mastered") return m.state === "mastered";
    return true;
  });

  const getSubjectName = (subId: string) => {
    const s = subjects.find((sub) => sub.id === subId);
    return s ? s.code : "Subject";
  };

  const handleTestAnswer = (mistake: MistakeItem) => {
    const isCorrect =
      practiceAnswer.trim().toLowerCase() === mistake.correctAnswer.trim().toLowerCase();

    reviewMistakeAttempt(mistake.id, isCorrect);
    setFeedback({ id: mistake.id, correct: isCorrect });

    setTimeout(() => {
      if (isCorrect) {
        setPracticingMistakeId(null);
        setPracticeAnswer("");
      }
      setFeedback(null);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Tab controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab("unresolved")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "unresolved"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            Unresolved ({mistakes.filter((m) => m.state !== "mastered").length})
          </button>
          <button
            onClick={() => setActiveTab("mastered")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "mastered"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            Resolved ({mistakes.filter((m) => m.state === "mastered").length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            All History
          </button>
        </div>
      </div>

      {/* Mistake List */}
      {filteredMistakes.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-surface-subtle">
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {activeTab === "mastered" ? "No resolved mistakes yet" : "No active mistakes"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === "mastered"
              ? "Practice unresolved mistakes twice consecutively to move them to mastered."
              : "Incorrect quiz answers will automatically appear here for deliberate review."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMistakes.map((mistake) => {
            const isPracticing = practicingMistakeId === mistake.id;

            return (
              <div
                key={mistake.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface shadow-subtle flex flex-col gap-3"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-brand-700 dark:text-blue-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                      {getSubjectName(mistake.subjectId)}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] font-medium px-2 py-0.5 rounded capitalize",
                        mistake.state === "mastered"
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          : mistake.state === "improving"
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                      )}
                    >
                      {mistake.state} ({mistake.consecutiveCorrect}/2 consecutive)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{mistake.attemptsCount} attempts</span>
                    <button
                      onClick={() => removeMistake(mistake.id)}
                      className="p-1 hover:text-rose-500 rounded"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question & Previous answers */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {mistake.questionText}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded-lg bg-surface-subtle text-xs border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Your Last Answer
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        {mistake.lastUserAnswer}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Correct Solution
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {mistake.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {mistake.explanation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic leading-relaxed">
                      {mistake.explanation}
                    </p>
                  )}
                </div>

                {/* Inline Practice Area */}
                {isPracticing ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 animate-fade-in">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Type the correct answer to resolve:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={practiceAnswer}
                        onChange={(e) => setPracticeAnswer(e.target.value)}
                        placeholder="Type answer..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none focus:border-brand-600"
                        autoFocus
                      />
                      <button
                        onClick={() => handleTestAnswer(mistake)}
                        className="px-3 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-medium hover:bg-brand-800"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => {
                          setPracticingMistakeId(null);
                          setPracticeAnswer("");
                        }}
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                    </div>

                    {feedback && feedback.id === mistake.id && (
                      <div
                        className={clsx(
                          "p-2 rounded text-xs font-semibold flex items-center gap-1.5",
                          feedback.correct
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        )}
                      >
                        {feedback.correct ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct! Progress updated.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Incorrect. Try again.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedMistakeForAI(mistake);
                        setAiOpen(true);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>Ask AI Explanation</span>
                    </button>

                    <button
                      onClick={() => {
                        setPracticingMistakeId(mistake.id);
                        setPracticeAnswer("");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-brand-200 dark:border-blue-900 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-blue-300 text-xs font-medium hover:bg-brand-100 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Practice Again</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Drawer for Mistake Context */}
      {selectedMistakeForAI && (
        <ContextualAIDrawer
          isOpen={aiOpen}
          onClose={() => {
            setAiOpen(false);
            setSelectedMistakeForAI(null);
          }}
          contextTitle={`Mistake Analysis: ${getSubjectName(selectedMistakeForAI.subjectId)}`}
          initialQuery={`Why was my answer "${selectedMistakeForAI.lastUserAnswer}" incorrect for: "${selectedMistakeForAI.questionText}"?`}
        />
      )}
    </div>
  );
}
