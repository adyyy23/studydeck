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
      setTotalQuestionsTested((t) => t + 1);
    }

    setIsFlipped(false);
    if (itemIndex + 1 < queue.activeMistakes.length) {
      setItemIndex((prev) => prev + 1);
    } else {
      // Move to stage 3: curriculum questions
      setItemIndex(0);
      if (queue.practiceQuestions.length > 0) {
        setStage("questions");
      } else {
        finishSession();
      }
    }
  };

  const handleCheckQuestion = () => {
    if (!userSelectedOption) return;
    setHasCheckedAnswer(true);
    const curr = queue.practiceQuestions[itemIndex];
    const isCorrect =
      userSelectedOption.trim().toLowerCase() === curr.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setCorrectAnswersCount((c) => c + 1);
    }
    setTotalQuestionsTested((t) => t + 1);
  };

  const handleNextQuestion = () => {
    setHasCheckedAnswer(false);
    setUserSelectedOption("");

    if (itemIndex + 1 < queue.practiceQuestions.length) {
      setItemIndex((prev) => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setStep("summary");
    if (user) {
      logSession({
        userId: user.id,
        type: "pomodoro",
        durationMinutes: targetDurationMinutes,
        accuracy:
          totalQuestionsTested > 0
            ? Math.round((correctAnswersCount / totalQuestionsTested) * 100)
            : 100,
        itemsReviewed: cardsImproved + mistakesResolved + totalQuestionsTested,
        notes: "Completed signature 25-minute Focus Review",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#332821]/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#F7F3EA] dark:bg-[#221B17] rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-serif font-black text-[#332821] dark:text-[#F2EEE6] tracking-tight">
              Focus Review Session
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] rounded-lg transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Briefing */}
        {step === "briefing" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77A45] dark:text-[#D79A45]">
                  Calibrated Study Queue
                </span>
                <h3 className="text-base sm:text-lg font-serif font-black text-[#332821] dark:text-[#F2EEE6] mt-0.5">
                  Have {targetDurationMinutes} minutes to review?
                </h3>
                <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1">
                  StudyDeck synthesized your review agenda based on due intervals, mistake history, and core curriculum coverage:
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] space-y-2.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#756C64] dark:text-[#9E9186]">Due Spaced Flashcards</span>
                  <span className="font-bold text-[#D79A45]">
                    {queue.dueCards.length} cards
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#756C64] dark:text-[#9E9186]">Previous Mistakes to Re-test</span>
                  <span className="font-bold text-[#B84A39]">
                    {queue.activeMistakes.length} mistakes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#756C64] dark:text-[#9E9186]">Curriculum Practice Questions</span>
                  <span className="font-bold text-[#332821] dark:text-[#F2EEE6]">
                    {queue.practiceQuestions.length} questions
                  </span>
                </div>
              </div>

              {queue.totalCount === 0 && (
                <div className="p-3 rounded-lg bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30 text-xs">
                  Your review queue is currently clear! Load sample curriculum or create cards to populate Focus Review.
                </div>
              )}
            </div>

            <button
              onClick={handleStartReview}
              disabled={queue.totalCount === 0}
              className="mt-6 btn-primary w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 touch-target"
            >
              <span>Start Focus Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Running the Focus Session */}
        {step === "running" && (
          <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between overflow-y-auto">
            {/* Stage: Flashcards */}
            {stage === "flashcards" && queue.dueCards[itemIndex] && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-[#756C64] dark:text-[#9E9186] mb-2 font-bold">
                    <span className="uppercase text-[#B77A45] dark:text-[#D79A45]">
                      Phase 1: Due Flashcards
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.dueCards.length}
                    </span>
                  </div>

                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-5 sm:p-6 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] min-h-[160px] sm:min-h-[180px] flex flex-col justify-between cursor-pointer shadow-xs"
                  >
                    <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold tracking-wider">
                      {isFlipped ? "Definition" : "Term"}
                    </span>
                    <p className="text-sm sm:text-base font-medium text-center my-auto text-[#332821] dark:text-[#F2EEE6] leading-relaxed">
                      {isFlipped
                        ? queue.dueCards[itemIndex].back
                        : queue.dueCards[itemIndex].front}
                    </p>
                    <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] text-center font-bold">
                      Tap to {isFlipped ? "view front" : "reveal answer"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {isFlipped ? (
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handleRateFlashcard("again")}
                        className="py-2.5 rounded-lg border border-[#B84A39]/30 bg-[#FEF2F2] dark:bg-[#450A0A] text-[#B84A39] text-xs font-bold touch-target"
                      >
                        Again
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("hard")}
                        className="py-2.5 rounded-lg border border-[#D79A45]/30 bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] text-xs font-bold touch-target"
                      >
                        Hard
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("good")}
                        className="py-2.5 rounded-lg border border-[#3D6B4F]/30 bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] text-xs font-bold touch-target"
                      >
                        Good
                      </button>
                      <button
                        onClick={() => handleRateFlashcard("easy")}
                        className="py-2.5 rounded-lg border border-[#3D6B4F] bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] text-xs font-bold touch-target"
                      >
                        Easy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider touch-target"
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
                  <div className="flex justify-between items-center text-xs text-[#756C64] dark:text-[#9E9186] mb-2 font-bold">
                    <span className="uppercase text-[#B84A39]">
                      Phase 2: Error Resolution
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.activeMistakes.length}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] mb-3 shadow-xs">
                    <span className="text-[10px] text-[#B84A39] uppercase font-bold tracking-wider block mb-1">
                      Previously Missed Question
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[#332821] dark:text-[#F2EEE6] leading-snug">
                      {queue.activeMistakes[itemIndex].questionText}
                    </p>
                  </div>

                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-4 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] min-h-[90px] flex flex-col justify-center items-center text-center cursor-pointer shadow-xs"
                  >
                    {!isFlipped ? (
                      <span className="text-xs font-bold text-[#756C64] dark:text-[#9E9186]">
                        Tap to reveal solution and check recall
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#3D6B4F] uppercase font-bold">
                          Solution:
                        </span>
                        <p className="text-sm font-bold text-[#332821] dark:text-[#F2EEE6]">
                          {queue.activeMistakes[itemIndex].correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {isFlipped ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCheckMistake(false)}
                        className="py-2.5 rounded-lg border border-[#B84A39]/30 bg-[#FEF2F2] dark:bg-[#450A0A] text-[#B84A39] text-xs font-bold touch-target"
                      >
                        Still Unclear
                      </button>
                      <button
                        onClick={() => handleCheckMistake(true)}
                        className="py-2.5 rounded-lg border border-[#3D6B4F] bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] text-xs font-bold touch-target"
                      >
                        Resolved!
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider touch-target"
                    >
                      Check Understanding
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stage: Questions */}
            {stage === "questions" && queue.practiceQuestions[itemIndex] && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-[#756C64] dark:text-[#9E9186] mb-2 font-bold">
                    <span className="uppercase text-[#332821] dark:text-[#F2EEE6]">
                      Phase 3: Curriculum Check
                    </span>
                    <span>
                      {itemIndex + 1} of {queue.practiceQuestions.length}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-serif font-black text-[#332821] dark:text-[#F2EEE6] mb-3 leading-snug">
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
                            "w-full p-2.5 sm:p-3 rounded-lg border text-left text-xs transition-colors touch-target",
                            userSelectedOption === opt
                              ? "border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#332821] dark:text-[#F2EEE6] font-bold"
                              : "border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6]"
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
                      className="w-full p-2.5 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] text-xs focus:outline-none focus:border-[#B77A45]"
                    />
                  )}
                </div>

                <div className="mt-4">
                  {!hasCheckedAnswer ? (
                    <button
                      onClick={handleCheckQuestion}
                      disabled={!userSelectedOption.trim()}
                      className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider touch-target"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 touch-target"
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
          <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between overflow-y-auto animate-fade-in text-center">
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-double border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-serif font-black text-[#332821] dark:text-[#F2EEE6]">
                  Focus Review Complete
                </h3>
                <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1">
                  You completed your daily curated study sprint.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <div className="p-3 rounded-lg bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                    Duration
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#332821] dark:text-[#F2EEE6]">
                    {targetDurationMinutes} min
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                    Accuracy
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#3D6B4F]">
                    {totalQuestionsTested > 0
                      ? Math.round((correctAnswersCount / totalQuestionsTested) * 100)
                      : 100}
                    %
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                    Resolved
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#B77A45]">
                    {mistakesResolved}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] text-[#756C64] dark:text-[#9E9186] uppercase font-bold block">
                    Improved
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#D79A45]">
                    {cardsImproved}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider touch-target"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
