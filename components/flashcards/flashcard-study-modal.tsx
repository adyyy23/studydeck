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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-surface rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-brand-500 h-1 transition-all duration-300"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>

        {/* HUD Header */}
        <div className="game-hud px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Card {isCompleted ? cards.length : currentIndex + 1} / {cards.length}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-700">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-bold">Streak ×{streak}</span>
            </div>
            <div className="relative">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+{sessionXP} XP</span>
              {showXPFloat && (
                <span className="absolute -top-4 left-0 text-sm font-bold text-amber-500 animate-fade-out-up pointer-events-none">
                  +{lastRating === "easy" ? 15 : lastRating === "good" ? 10 : 5}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-200 transition-colors"
            >
              Ask AI
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isCompleted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <Trophy className="w-16 h-16 text-amber-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Session Complete!</h2>
            
            <div className="flex gap-6 mb-8 mt-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Cards Reviewed</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{reviewedCount}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30 flex flex-col">
                <span className="text-xs font-bold text-amber-600 uppercase">Session XP</span>
                <span className="text-xl font-bold text-amber-500">+{sessionXP}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 flex flex-col">
                <span className="text-xs font-bold text-blue-600 uppercase">Best Streak</span>
                <span className="text-xl font-bold text-blue-500">×{bestStreak}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRestart} className="px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors">
                Study Again
              </button>
              <button onClick={onClose} className="px-6 py-3 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold transition-colors">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div 
              onClick={() => !isFlipped && setIsFlipped(true)}
              className={clsx(
                "flex-1 flex flex-col justify-center items-center p-8 rounded-xl border-2 transition-all cursor-pointer relative",
                isFlipped ? "border-brand-500 bg-surface shadow-sm" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-brand-300",
                flashClass
              )}
            >
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isFlipped ? "Back" : "Front"}
                </span>
              </div>

              {!isFlipped ? (
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center leading-tight max-w-xl">
                  {currentCard?.front}
                </h3>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                  <p className="text-xl text-slate-900 dark:text-slate-100 font-medium mb-6">
                    {currentCard?.back}
                  </p>
                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50 w-full max-w-md">
                    <p className="text-xs text-slate-500 font-medium">{currentCard?.front}</p>
                  </div>
                </div>
              )}

              {!isFlipped && (
                <div className="absolute bottom-4 text-xs font-bold text-slate-400">
                  Press Space or Tap to flip
                </div>
              )}
            </div>

            <div className="mt-6 h-24 flex flex-col justify-end">
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-3 animate-fade-in">
                  <button onClick={() => handleRate("again")} className="flex flex-col items-center justify-center py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 transition-colors relative">
                    <span className="font-bold text-sm">Again</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">&lt; 1m</span>
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded bg-red-100 text-red-800 text-[10px] font-bold flex items-center justify-center">1</span>
                  </button>
                  <button onClick={() => handleRate("hard")} className="flex flex-col items-center justify-center py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 transition-colors relative">
                    <span className="font-bold text-sm">Hard</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">3d</span>
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">2</span>
                  </button>
                  <button onClick={() => handleRate("good")} className="flex flex-col items-center justify-center py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-brand-700 transition-colors relative">
                    <span className="font-bold text-sm">Good</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">6d</span>
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded bg-blue-100 text-brand-800 text-[10px] font-bold flex items-center justify-center">3</span>
                  </button>
                  <button onClick={() => handleRate("easy")} className="flex flex-col items-center justify-center py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-700 transition-colors relative">
                    <span className="font-bold text-sm">Easy</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">14d</span>
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded bg-green-100 text-green-800 text-[10px] font-bold flex items-center justify-center">4</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsFlipped(true)} className="w-full py-4 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2">
                  <span>Reveal Answer</span>
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
