"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { Flashcard, MistakeItem, QuizQuestion, Rating } from "@/lib/types";

interface FocusReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDurationMinutes?: number;
}

export function FocusReviewModal({
  isOpen,
  onClose,
  targetDurationMinutes = 25,
}: FocusReviewModalProps) {
  const { flashcards, mistakes, quizzes, reviewCard, reviewMistakeAttempt } =
    useStudyStore();
  const { logSession } = useAcademicStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<"briefing" | "running" | "summary">("briefing");
  const [stage, setStage] = useState<"flashcards" | "mistakes" | "questions">("flashcards");
  const [itemIndex, setItemIndex] = useState(0);

  // Review tracking metrics
  const [cardsImproved, setCardsImproved] = useState(0);
  const [mistakesResolved, setMistakesResolved] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalQuestionsTested, setTotalQuestionsTested] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userSelectedOption, setUserSelectedOption] = useState<string>("");
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);

  // Assemble curated focus queue
  const queue = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Due flashcards
    const dueCards = flashcards.filter(
      (c) => c.state === "new" || c.nextReviewDate <= todayStr
    ).slice(0, 10);

    // 2. Active unresolved mistakes
    const activeMistakes = mistakes.filter((m) => m.state !== "mastered").slice(0, 6);

    // 3. Questions from available quizzes
    const practiceQuestions = quizzes.flatMap((q) => q.questions).slice(0, 8);

    return {
      dueCards,
      activeMistakes,
      practiceQuestions,
      totalCount: dueCards.length + activeMistakes.length + practiceQuestions.length,
    };
  }, [flashcards, mistakes, quizzes]);

  if (!isOpen) return null;

  const handleStartReview = () => {
    setStep("running");
    setItemIndex(0);
    if (queue.dueCards.length > 0) {
      setStage("flashcards");
    } else if (queue.activeMistakes.length > 0) {
      setStage("mistakes");
    } else {
      setStage("questions");
    }
  };

  const handleRateFlashcard = (rating: Rating) => {
    const currentCard = queue.dueCards[itemIndex];
    if (currentCard) {
      reviewCard(currentCard.id, rating);
      if (rating === "good" || rating === "easy") {
        setCardsImproved((c) => c + 1);
      }
    }

    setIsFlipped(false);
    if (itemIndex + 1 < queue.dueCards.length) {
      setItemIndex((prev) => prev + 1);
    } else {
      // Move to stage 2: mistakes
      setItemIndex(0);
      if (queue.activeMistakes.length > 0) {
        setStage("mistakes");
      } else if (queue.practiceQuestions.length > 0) {
        setStage("questions");
      } else {
        finishSession();
      }
    }
  };

  const handleCheckMistake = (isCorrect: boolean) => {
    const currentMistake = queue.activeMistakes[itemIndex];
    if (currentMistake) {
      reviewMistakeAttempt(currentMistake.id, isCorrect);
      if (isCorrect) {
        setMistakesResolved((m) => m + 1);
        setCorrectAnswersCount((c) => c + 1);
      }
    }
    setTotalQuestionsTested((t) => t + 1);

    if (itemIndex + 1 < queue.activeMistakes.length) {
      setItemIndex((prev) => prev + 1);
      setUserSelectedOption("");
      setHasCheckedAnswer(false);
    } else {
      // Move to stage 3: questions
      setItemIndex(0);
      setUserSelectedOption("");
      setHasCheckedAnswer(false);
      if (queue.practiceQuestions.length > 0) {
        setStage("questions");
      } else {
        finishSession();
      }
    }
  };

  const handleCheckQuestion = () => {
    const currentQ = queue.practiceQuestions[itemIndex];
    if (!currentQ || !userSelectedOption) return;

    setHasCheckedAnswer(true);
    const isCorrect =
      userSelectedOption.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setCorrectAnswersCount((c) => c + 1);
    }
    setTotalQuestionsTested((t) => t + 1);
  };

  const handleNextQuestion = () => {
    if (itemIndex + 1 < queue.practiceQuestions.length) {
      setItemIndex((prev) => prev + 1);
      setUserSelectedOption("");
      setHasCheckedAnswer(false);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setStep("summary");
    const accuracy =
      totalQuestionsTested > 0
        ? Math.round((correctAnswersCount / totalQuestionsTested) * 100)
        : 100;

    if (user) {
      logSession({
        userId: user.id,
        type: "focus_review",
        durationMinutes: targetDurationMinutes,
        accuracy,
        cardsImproved,
        mistakesResolved,
        notes: "Completed signature 25-minute Focus Review",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[460px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-blue-400">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Focus Review Session
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Briefing */}
        {step === "briefing" && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-blue-400">
                  Calibrated Study Queue
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  You have {targetDurationMinutes} minutes?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  StudyDeck synthesized your review agenda based on due intervals, mistake history, and core curriculum coverage:
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-subtle space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Due Spaced Flashcards</span>
                  <span className="font-semibold text-brand-700 dark:text-blue-400">
                    {queue.dueCards.length} cards
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Previous Mistakes to Re-test</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {queue.activeMistakes.length} mistakes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Curriculum Practice Questions</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {queue.practiceQuestions.length} questions
                  </span>
                </div>
              </div>

              {queue.totalCount === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs">
                  Your review queue is currently clear! Load sample curriculum or create cards to populate Focus Review.
                </div>
              )}
            </div>

            <button
              onClick={handleStartReview}
              disabled={queue.totalCount === 0}
              className="mt-4 w-full py-2.5 px-4 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>Start Focus Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Running the Focus Session */}
        {step === "running" && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            {/* Stage: Flashcards */}
            {stage === "flashcards" && queue.dueCards[itemIndex] && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span className="uppercase font-semibold text-brand-700 dark:text-blue-400">
                      Phase 1: Due Flashcards
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.dueCards.length}
                    </span>
                  </div>

                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface-subtle min-h-[180px] flex flex-col justify-between cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {isFlipped ? "Definition" : "Term"}
                    </span>
                    <p className="text-base font-medium text-center my-auto text-slate-900 dark:text-slate-100">
                      {isFlipped
                        ? queue.dueCards[itemIndex].back
                        : queue.dueCards[itemIndex].front}
                    </p>
                    <span className="text-[10px] text-slate-400 text-center">
                      Tap to {isFlipped ? "view front" : "reveal answer"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {isFlipped ? (
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handleRateFlashcard("again")}
                        className="py-2 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold"
                      >
                        Again
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("hard")}
                        className="py-2 rounded border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold"
                      >
                        Hard
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("good")}
                        className="py-2 rounded border border-blue-200 bg-blue-50 text-brand-700 text-xs font-bold"
                      >
                        Good
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("easy")}
                        className="py-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold"
                      >
                        Easy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full py-2.5 rounded-lg bg-brand-700 text-white text-xs font-medium"
                    >
                      Reveal Answer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stage: Mistakes */}
            {stage === "mistakes" && queue.activeMistakes[itemIndex] && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span className="uppercase font-semibold text-rose-600 dark:text-rose-400">
                      Phase 2: Past Mistake Re-test
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.activeMistakes.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {queue.activeMistakes[itemIndex].questionText}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Your prior incorrect answer:{" "}
                      <span className="text-rose-600 font-medium">
                        {queue.activeMistakes[itemIndex].lastUserAnswer}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-slate-500 font-medium block mb-1">
                      Correct Answer:
                    </label>
                    <input
                      type="text"
                      value={userSelectedOption}
                      onChange={(e) => setUserSelectedOption(e.target.value)}
                      placeholder="Type correct concept..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleCheckMistake(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500"
                  >
                    Still Struggling
                  </button>
                  <button
                    onClick={() => {
                      const isCorrect =
                        userSelectedOption.trim().toLowerCase() ===
                        queue.activeMistakes[itemIndex].correctAnswer.trim().toLowerCase();
                      handleCheckMistake(isCorrect);
                    }}
                    disabled={!userSelectedOption.trim()}
                    className="flex-1 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-medium"
                  >
                    Check &amp; Resolve
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Questions */}
            {stage === "questions" && queue.practiceQuestions[itemIndex] && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span className="uppercase font-semibold text-slate-700 dark:text-slate-300">
                      Phase 3: Core Curriculum Questions
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.practiceQuestions.length}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {queue.practiceQuestions[itemIndex].question}
                  </h4>

                  {queue.practiceQuestions[itemIndex].options ? (
                    <div className="space-y-2">
                      {queue.practiceQuestions[itemIndex].options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setUserSelectedOption(opt)}
                          disabled={hasCheckedAnswer}
                          className={clsx(
                            "w-full p-2.5 rounded-lg border text-left text-xs transition-colors",
                            userSelectedOption === opt
                              ? "border-brand-700 bg-brand-50 dark:bg-brand-950/40 text-brand-900 font-semibold"
                              : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={userSelectedOption}
                      onChange={(e) => setUserSelectedOption(e.target.value)}
                      placeholder="Type answer..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface text-xs focus:outline-none"
                    />
                  )}
                </div>

                <div className="mt-4">
                  {!hasCheckedAnswer ? (
                    <button
                      onClick={handleCheckQuestion}
                      disabled={!userSelectedOption.trim()}
                      className="w-full py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-medium"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <span>Next Item</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Summary */}
        {step === "summary" && (
          <div className="p-6 flex-1 flex flex-col justify-between animate-fade-in text-center">
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Focus Review Complete
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You completed your daily curated study sprint.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <div className="p-3 rounded-lg bg-surface-subtle border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Duration
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {targetDurationMinutes} min
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Accuracy
                  </span>
                  <span className="text-base font-bold text-brand-700 dark:text-blue-400">
                    {totalQuestionsTested > 0
                      ? Math.round((correctAnswersCount / totalQuestionsTested) * 100)
                      : 100}
                    %
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Mistakes Resolved
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {mistakesResolved}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-subtle border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Cards Improved
                  </span>
                  <span className="text-base font-bold text-brand-600">
                    {cardsImproved}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
