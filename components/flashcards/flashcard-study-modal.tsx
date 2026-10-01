"use client";

import React, { useState, useEffect } from "react";
import { X, RotateCcw, Check, Sparkles, Trophy } from "lucide-react";
import clsx from "clsx";
import { Flashcard, Rating } from "@/lib/types";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { ContextualAIDrawer } from "@/components/ai/contextual-ai-drawer";

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  title: string;
  subjectId?: string;
}

export function FlashcardStudyModal({
  isOpen,
  onClose,
  cards,
  title,
  subjectId,
}: FlashcardStudyModalProps) {
  const { reviewCard } = useStudyStore();
  const { logSession } = useAcademicStore();
  const { user } = useAuthStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Game state
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [showXPFloat, setShowXPFloat] = useState(false);
  const [lastRating, setLastRating] = useState<Rating | null>(null);
  const [flashClass, setFlashClass] = useState("");

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !isOpen) return;

      if (!isFlipped && e.code === "Space") {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped) {
        if (e.key === "1") handleRate("again");
        if (e.key === "2") handleRate("hard");
        if (e.key === "3") handleRate("good");
        if (e.key === "4") handleRate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const triggerFloat = () => {
    setShowXPFloat(false);
    setTimeout(() => setShowXPFloat(true), 10);
  };

  const handleRate = (rating: Rating) => {
    if (!currentCard) return;

    setLastRating(rating);

    let xp = 0;
    let newStreak = streak;

    if (rating === "good" || rating === "easy") {
      xp = rating === "easy" ? 15 : 10;
      newStreak += 1;
      setSessionXP((prev) => prev + xp);
      triggerFloat();
      setFlashClass("correct-flash");
    } else {
      xp = rating === "hard" ? 5 : 0;
      newStreak = 0;
      if (rating === "hard") {
        setSessionXP((prev) => prev + xp);
        triggerFloat();
      }
      setFlashClass(rating === "again" ? "wrong-flash" : "");
    }

    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    setTimeout(() => setFlashClass(""), 300);

    reviewCard(currentCard.id, rating);
    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);
    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsCompleted(true);
      if (user) {
        logSession({
          userId: user.id,
          subjectId,
          type: "flashcards",
          durationMinutes: Math.max(1, Math.round(nextReviewed * 0.8)),
          itemsReviewed: nextReviewed,
          notes: `Studied ${title}`,
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setIsCompleted(false);
    setStreak(0);
    setBestStreak(0);
    setSessionXP(0);
  };

  if (!isOpen || cards.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#332821]/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-[#F7F3EA] dark:bg-[#221B17] border border-[#D6CCBF] dark:border-[#3D322B] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="w-full bg-[#EAE3D8] dark:bg-[#2E2520] h-1 shrink-0">
          <div
            className="bg-[#D79A45] h-1 transition-all duration-300"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>

        {/* HUD Header */}
        <div className="px-3 sm:px-5 py-3 border-b border-[#D6CCBF] dark:border-[#3D322B] flex items-center justify-between bg-[#FFFCF6] dark:bg-[#2B231E] shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-[11px] sm:text-xs font-bold text-[#756C64] dark:text-[#9E9186] uppercase tracking-wider">
              Card {isCompleted ? cards.length : currentIndex + 1} / {cards.length}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-bold">Streak ×{streak}</span>
            </div>
            <div className="relative">
              <span className="text-xs font-black text-[#D79A45]">+{sessionXP} XP</span>
              {showXPFloat && (
                <span className="absolute -top-4 left-0 text-sm font-black text-[#B77A45] animate-fade-out-up pointer-events-none">
                  +{lastRating === "easy" ? 15 : lastRating === "good" ? 10 : 5}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="px-2.5 py-1 bg-[#6B4E71]/15 text-[#6B4E71] dark:text-[#D8B4E2] border border-[#6B4E71]/30 text-xs font-bold rounded-lg hover:bg-[#6B4E71]/25 transition-colors touch-target"
            >
              Ask Lumi
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] rounded-lg transition-colors touch-target"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isCompleted ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full border-2 border-double border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-serif font-black text-[#332821] dark:text-[#F2EEE6] mb-1">Session Complete!</h2>
            <p className="text-xs text-[#756C64] dark:text-[#9E9186] mb-6">Flashcard review recorded into your spaced repetition schedule.</p>
            
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-sm w-full mb-8">
              <div className="bg-[#FFFCF6] dark:bg-[#2B231E] p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] flex flex-col">
                <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase">Reviewed</span>
                <span className="text-lg sm:text-xl font-black text-[#332821] dark:text-[#F2EEE6]">{reviewedCount}</span>
              </div>
              <div className="bg-[#FFFBEB] dark:bg-[#382A1E] p-3 rounded-lg border border-[#D79A45]/30 flex flex-col">
                <span className="text-[10px] font-bold text-[#B77A45] dark:text-[#D79A45] uppercase">Session XP</span>
                <span className="text-lg sm:text-xl font-black text-[#D79A45]">+{sessionXP}</span>
              </div>
              <div className="bg-[#FFFCF6] dark:bg-[#2B231E] p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] flex flex-col">
                <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase">Best Streak</span>
                <span className="text-lg sm:text-xl font-black text-[#3D6B4F]">×{bestStreak}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={handleRestart}
                className="btn-secondary w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 touch-target"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Study Again</span>
              </button>
              <button
                onClick={onClose}
                className="btn-primary w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider touch-target"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            {/* Flashcard surface */}
            <div 
              onClick={() => !isFlipped && setIsFlipped(true)}
              className={clsx(
                "flex-1 min-h-[220px] sm:min-h-[260px] flex flex-col justify-center items-center p-6 sm:p-8 rounded-xl border-2 transition-all cursor-pointer relative shadow-xs",
                isFlipped
                  ? "border-[#B77A45] bg-[#FFFCF6] dark:bg-[#2B231E]"
                  : "border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] hover:border-[#B77A45]/60",
                flashClass
              )}
            >
              <div className="absolute top-3 left-4">
                <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase tracking-widest">
                  {isFlipped ? "Definition / Answer" : "Term / Question"}
                </span>
              </div>

              {!isFlipped ? (
                <h3 className="text-lg sm:text-2xl font-serif font-black text-[#332821] dark:text-[#F2EEE6] text-center leading-snug max-w-xl">
                  {currentCard?.front}
                </h3>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-center py-2">
                  <p className="text-base sm:text-xl text-[#332821] dark:text-[#F2EEE6] font-medium leading-relaxed mb-4">
                    {currentCard?.back}
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#D6CCBF] dark:border-[#3D322B] w-full max-w-md">
                    <p className="text-xs text-[#756C64] dark:text-[#9E9186] font-medium truncate">{currentCard?.front}</p>
                  </div>
                </div>
              )}

              {!isFlipped && (
                <div className="absolute bottom-3 text-[11px] font-bold text-[#756C64] dark:text-[#9E9186]">
                  Press Space or Tap to Flip
                </div>
              )}
            </div>

            {/* Bottom rating action bar */}
            <div className="mt-4 shrink-0">
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
                  <button
                    onClick={() => handleRate("again")}
                    className="flex flex-col items-center justify-center py-2.5 sm:py-3 bg-[#FEF2F2] dark:bg-[#450A0A] hover:bg-[#FEE2E2] border border-[#B84A39]/30 rounded-lg text-[#B84A39] transition-colors relative touch-target"
                  >
                    <span className="font-bold text-xs sm:text-sm">Again</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">&lt; 1m</span>
                    <span className="hidden sm:flex absolute top-1 right-1 w-4 h-4 rounded bg-[#B84A39]/20 text-[#B84A39] text-[9px] font-bold items-center justify-center">1</span>
                  </button>
                  <button
                    onClick={() => handleRate("hard")}
                    className="flex flex-col items-center justify-center py-2.5 sm:py-3 bg-[#FFFBEB] dark:bg-[#382A1E] hover:bg-[#FEF3C7] border border-[#D79A45]/30 rounded-lg text-[#B77A45] dark:text-[#D79A45] transition-colors relative touch-target"
                  >
                    <span className="font-bold text-xs sm:text-sm">Hard</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">3d</span>
                    <span className="hidden sm:flex absolute top-1 right-1 w-4 h-4 rounded bg-[#D79A45]/20 text-[#B77A45] text-[9px] font-bold items-center justify-center">2</span>
                  </button>
                  <button
                    onClick={() => handleRate("good")}
                    className="flex flex-col items-center justify-center py-2.5 sm:py-3 bg-[#F0FDF4] dark:bg-[#052E16] hover:bg-[#DCFCE7] border border-[#3D6B4F]/30 rounded-lg text-[#3D6B4F] dark:text-[#86EFAC] transition-colors relative touch-target"
                  >
                    <span className="font-bold text-xs sm:text-sm">Good</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">6d</span>
                    <span className="hidden sm:flex absolute top-1 right-1 w-4 h-4 rounded bg-[#3D6B4F]/20 text-[#3D6B4F] text-[9px] font-bold items-center justify-center">3</span>
                  </button>
                  <button
                    onClick={() => handleRate("easy")}
                    className="flex flex-col items-center justify-center py-2.5 sm:py-3 bg-[#F0FDF4] dark:bg-[#052E16] hover:bg-[#DCFCE7] border border-[#3D6B4F] rounded-lg text-[#3D6B4F] dark:text-[#86EFAC] transition-colors relative touch-target"
                  >
                    <span className="font-bold text-xs sm:text-sm">Easy</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">14d</span>
                    <span className="hidden sm:flex absolute top-1 right-1 w-4 h-4 rounded bg-[#3D6B4F]/20 text-[#3D6B4F] text-[9px] font-bold items-center justify-center">4</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="btn-primary w-full py-3 text-xs sm:text-sm font-bold uppercase tracking-wider touch-target"
                >
                  Reveal Answer
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ContextualAIDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        contextTitle={title}
        materialTitle={title}
        materialContent={`${currentCard?.front}: ${currentCard?.back}`}
        initialQuery={`Explain "${currentCard?.front}" in simpler words.`}
      />
    </div>
  );
}
