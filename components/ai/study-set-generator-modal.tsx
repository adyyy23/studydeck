"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Trash2, Edit3, ArrowRight, Layers, HelpCircle } from "lucide-react";
import clsx from "clsx";
import { generateStudySetDrafts, GeneratedStudyDraft } from "@/lib/ai-engine";
import { useStudyStore } from "@/lib/store/use-study-store";
import { StudyMaterial, QuestionType } from "@/lib/types";

interface StudySetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: StudyMaterial;
}

export function StudySetGeneratorModal({
  isOpen,
  onClose,
  material,
}: StudySetGeneratorModalProps) {
  const { addBatchFlashcards, addQuiz } = useStudyStore();

  const [step, setStep] = useState<"configure" | "review">("configure");
  const [targetType, setTargetType] = useState<
    "flashcards" | "multiple_choice" | "identification" | "true_false" | "fill_blank"
  >("flashcards");
  const [quantity, setQuantity] = useState<number>(5);
  const [drafts, setDrafts] = useState<GeneratedStudyDraft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateStudySetDrafts(
        material.title,
        material.content,
        targetType,
        quantity
      );
      setDrafts(generated);
      setIsGenerating(false);
      setStep("review");
    }, 450);
  };

  const handleToggleApprove = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, approved: !d.approved } : d))
    );
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDraft = (
    id: string,
    field: "frontOrQuestion" | "backOrAnswer",
    value: string
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleSaveToStudyDeck = () => {
    const approvedDrafts = drafts.filter((d) => d.approved);
    if (approvedDrafts.length === 0) return;

    if (targetType === "flashcards") {
      const cardsToCreate = approvedDrafts.map((d) => ({
        userId: material.userId,
        subjectId: material.subjectId,
        moduleId: material.moduleId,
        topicId: material.topicId,
        materialId: material.id,
        front: d.frontOrQuestion,
        back: d.backOrAnswer,
        type: "term_def" as const,
      }));
      addBatchFlashcards(cardsToCreate);
    } else {
      const questionsToCreate = approvedDrafts.map((d, idx) => ({
        id: `gen_q_${Date.now()}_${idx}`,
        subjectId: material.subjectId,
        moduleId: material.moduleId,
        topicId: material.topicId,
        materialId: material.id,
        type: d.type as QuestionType,
        question: d.frontOrQuestion,
        options: d.options || (d.type === "true_false" ? ["True", "False"] : undefined),
        correctAnswer: d.backOrAnswer,
        explanation: d.explanation,
      }));

      addQuiz({
        userId: material.userId,
        subjectId: material.subjectId,
        moduleId: material.moduleId,
        title: `${material.title} Practice Quiz`,
        isExamMode: false,
        timeLimitMinutes: 10,
        questions: questionsToCreate,
      });
    }

    onClose();
  };

  const approvedCount = drafts.filter((d) => d.approved).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-surface rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Generate Study Set
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Source: {material.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Configure options */}
        {step === "configure" && (
          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                Study Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "flashcards", label: "Flashcards", desc: "Terms & core definitions" },
                  { id: "multiple_choice", label: "Multiple Choice", desc: "4-option conceptual questions" },
                  { id: "true_false", label: "True or False", desc: "Rapid principle discrimination" },
                  { id: "identification", label: "Identification", desc: "Fill-in and term identification" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetType(item.id as any)}
                    className={clsx(
                      "p-3 rounded-lg border text-left transition-colors",
                      targetType === item.id
                        ? "border-brand-700 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-blue-200"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                Quantity
              </label>
              <div className="flex gap-2">
                {[3, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                      quantity === num
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {num} Items
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Student Review Control
              </span>
              Generated items are never saved automatically. You will be able to review, edit definitions, or discard individual drafts before saving.
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-2 w-full py-2.5 px-4 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isGenerating ? "Analyzing material..." : "Generate Drafts"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Review, Edit, Approve drafts */}
        {step === "review" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>
                Reviewing {drafts.length} drafts ({approvedCount} approved)
              </span>
              <button
                onClick={() => setStep("configure")}
                className="text-xs text-brand-700 dark:text-blue-400 hover:underline"
              >
                Change settings
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={clsx(
                    "p-3.5 rounded-lg border text-xs transition-colors flex flex-col gap-2",
                    draft.approved
                      ? "border-slate-300 dark:border-slate-700 bg-surface"
                      : "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleApprove(draft.id)}
                      className={clsx(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
                        draft.approved
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                      )}
                    >
                      <Check className="w-3 h-3" />
                      <span>{draft.approved ? "Approved" : "Excluded"}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      aria-label="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {targetType === "flashcards" ? "Front (Term)" : "Question"}
                      </span>
                      <textarea
                        value={draft.frontOrQuestion}
                        onChange={(e) =>
                          handleUpdateDraft(draft.id, "frontOrQuestion", e.target.value)
                        }
                        rows={2}
                        className="w-full mt-0.5 p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {targetType === "flashcards" ? "Back (Definition)" : "Answer"}
                      </span>
                      <textarea
                        value={draft.backOrAnswer}
                        onChange={(e) =>
                          handleUpdateDraft(draft.id, "backOrAnswer", e.target.value)
                        }
                        rows={2}
                        className="w-full mt-0.5 p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-surface flex items-center justify-between gap-3">
              <button
                onClick={() => setStep("configure")}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Back
              </button>

              <button
                onClick={handleSaveToStudyDeck}
                disabled={approvedCount === 0}
                className="py-2 px-4 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Save Approved Set ({approvedCount})</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
