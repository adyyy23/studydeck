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
        <div className="flex gap-1.5 p-1 bg-[#EAE3D8] dark:bg-[#2E2520] rounded-lg text-xs font-medium border border-[#D6CCBF] dark:border-[#3D322B]">
          <button
            onClick={() => setActiveTab("unresolved")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors touch-target",
              activeTab === "unresolved"
                ? "bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] shadow-xs font-bold border border-[#D6CCBF] dark:border-[#3D322B]"
                : "text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6]"
            )}
          >
            Unresolved ({mistakes.filter((m) => m.state !== "mastered").length})
          </button>
          <button
            onClick={() => setActiveTab("mastered")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors touch-target",
              activeTab === "mastered"
                ? "bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] shadow-xs font-bold border border-[#D6CCBF] dark:border-[#3D322B]"
                : "text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6]"
            )}
          >
            Resolved ({mistakes.filter((m) => m.state === "mastered").length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-colors touch-target",
              activeTab === "all"
                ? "bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] shadow-xs font-bold border border-[#D6CCBF] dark:border-[#3D322B]"
                : "text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6]"
            )}
          >
            All History
          </button>
        </div>
      </div>

      {/* Mistake List */}
      {filteredMistakes.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-xl border border-dashed border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <AlertCircle className="w-8 h-8 text-[#D6CCBF] dark:text-[#756C64] mx-auto mb-2" />
          <h3 className="text-sm font-serif font-black text-[#332821] dark:text-[#F2EEE6]">
            {activeTab === "mastered" ? "No resolved mistakes yet" : "No active mistakes in notebook"}
          </h3>
          <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1 max-w-sm mx-auto">
            {activeTab === "mastered"
              ? "Practice unresolved mistakes twice consecutively to move them to mastered status."
              : "Incorrect quiz answers will automatically appear here for deliberate spaced re-testing."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMistakes.map((mistake) => {
            const isPracticing = practicingMistakeId === mistake.id;

            return (
              <div
                key={mistake.id}
                className="p-4 sm:p-5 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] shadow-xs flex flex-col gap-3"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#654A3A] dark:text-[#D79A45] bg-[#EAE3D8] dark:bg-[#2E2520] px-2 py-0.5 rounded border border-[#D6CCBF] dark:border-[#3D322B]">
                      {getSubjectName(mistake.subjectId)}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded capitalize",
                        mistake.state === "mastered"
                          ? "bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] border border-[#3D6B4F]/30"
                          : mistake.state === "improving"
                          ? "bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30"
                          : "bg-[#FEF2F2] dark:bg-[#450A0A] text-[#B84A39] border border-[#B84A39]/30"
                      )}
                    >
                      {mistake.state} ({mistake.consecutiveCorrect}/2 consecutive)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#756C64] dark:text-[#9E9186]">
                    <span>{mistake.attemptsCount} attempts</span>
                    <button
                      onClick={() => removeMistake(mistake.id)}
                      className="p-1 hover:text-[#B84A39] rounded transition-colors touch-target"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question & Previous answers */}
                <div>
                  <h4 className="text-sm sm:text-base font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
                    {mistake.questionText}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 p-3 rounded-lg bg-[#F7F3EA] dark:bg-[#221B17] text-xs border border-[#D6CCBF] dark:border-[#3D322B]">
                    <div>
                      <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                        Your Last Answer
                      </span>
                      <span className="text-[#B84A39] font-medium">
                        {mistake.lastUserAnswer}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                        Correct Solution
                      </span>
                      <span className="text-[#3D6B4F] font-bold">
                        {mistake.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {mistake.explanation && (
                    <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-2 italic leading-relaxed">
                      {mistake.explanation}
                    </p>
                  )}
                </div>

                {/* Inline Practice Area */}
                {isPracticing ? (
                  <div className="pt-3 border-t border-[#D6CCBF] dark:border-[#3D322B] flex flex-col gap-2 animate-fade-in">
                    <label className="text-[11px] font-bold text-[#756C64] dark:text-[#9E9186]">
                      Type the correct answer to resolve:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={practiceAnswer}
                        onChange={(e) => setPracticeAnswer(e.target.value)}
                        placeholder="Type answer..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#F7F3EA] dark:bg-[#221B17] text-[#332821] dark:text-[#F2EEE6] focus:outline-none focus:border-[#B77A45]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleTestAnswer(mistake)}
                        className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider touch-target"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => {
                          setPracticingMistakeId(null);
                          setPracticeAnswer("");
                        }}
                        className="btn-secondary px-3 py-2 text-xs font-bold touch-target"
                      >
                        Cancel
                      </button>
                    </div>

                    {feedback && feedback.id === mistake.id && (
                      <div
                        className={clsx(
                          "p-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-bounce-in",
                          feedback.correct
                            ? "bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] border border-[#3D6B4F]/30"
                            : "bg-[#FEF2F2] dark:bg-[#450A0A] text-[#B84A39] border border-[#B84A39]/30"
                        )}
                      >
                        {feedback.correct ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct! Recall progress updated.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span>Incorrect. Review the solution above and try again.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="pt-2 border-t border-[#D6CCBF] dark:border-[#3D322B] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedMistakeForAI(mistake);
                        setAiOpen(true);
                      }}
                      className="text-xs font-semibold text-[#6B4E71] dark:text-[#D8B4E2] hover:underline flex items-center gap-1 touch-target"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask Lumi Explanation</span>
                    </button>

                    <button
                      onClick={() => {
                        setPracticingMistakeId(mistake.id);
                        setPracticeAnswer("");
                      }}
                      className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 touch-target"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
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
