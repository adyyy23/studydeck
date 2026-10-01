"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, Zap, CheckCircle2, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";
import { Character } from "@/components/ui/character";

export interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface SpeedRoundGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface RoundQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SpeedRoundGame({
  cards,
  questions,
  onClose,
  onComplete,
}: SpeedRoundGameProps) {
  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qPool, setQPool] = useState<RoundQuestion[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  // Build question pool from either questions or cards
  useEffect(() => {
    let pool: RoundQuestion[] = [];

    if (questions.length >= 4) {
      pool = questions.map((q) => {
        let opts = q.options && q.options.length >= 2 ? [...q.options] : [];
        if (opts.length < 4) {
          const distractors = questions
            .filter((o) => o.id !== q.id)
            .map((o) => o.correctAnswer)
            .slice(0, 4 - opts.length);
          opts = [...opts, ...distractors];
        }
        return {
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: shuffle(Array.from(new Set(opts))),
        };
      });
    } else {
      // Create from flashcards (Front as Question, Back as Answer)
      pool = cards.map((c, i) => {
        const distractors = cards
          .filter((_, idx) => idx !== i)
          .map((d) => d.back)
          .slice(0, 3);
        return {
          question: `What is: "${c.front}"?`,
          correctAnswer: c.back,
          options: shuffle([c.back, ...distractors]),
        };
      });
    }

    setQPool(shuffle(pool));
  }, [cards, questions]);

  // Countdown timer
  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [done]);

  // Handle game end
  useEffect(() => {
    if (done) {
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      onComplete({
        accuracy,
        score,
        streak: bestStreak,
        durationSeconds: TOTAL_TIME - timeLeft,
        mistakes,
      });
    }
  }, [done]);

  const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

  const handleSelect = (option: string) => {
    if (feedback || done || qPool.length === 0) return;

    setSelectedOption(option);
    const curr = qPool[currentIndex % qPool.length];
    const isCorrect = option === curr.correctAnswer;
    setTotalAnswered((prev) => prev + 1);

    if (isCorrect) {
      setFeedback("correct");
      const pts = 10 * multiplier;
      setScore((s) => s + pts);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setMistakes((prev) => [
        ...prev,
        {
          questionText: curr.question,
          correctAnswer: curr.correctAnswer,
          userAnswer: option,
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      setCurrentIndex((prev) => (prev + 1) % qPool.length);
    }, 450);
  };

  const restartGame = () => {
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedOption(null);
    setDone(false);
    setMistakes([]);
    setQPool((prev) => shuffle(prev));
  };

  // SVG Ring calculation: r=36, circumference = 2 * PI * 36 ≈ 226
  const RADIUS = 36;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressOffset = CIRCUMFERENCE * (1 - timeLeft / TOTAL_TIME);

  if (qPool.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border">
        <p className="text-sm text-muted-text">Need at least 3 flashcards or questions to play Speed Round.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-xs rounded-lg border border-border">
          Close
        </button>
      </div>
    );
  }

  const currentQ = qPool[currentIndex % qPool.length];

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-surface rounded-3xl border border-border shadow-lift animate-fade-in relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-foreground">Speed Round</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {done ? (
        /* Results Screen */
        <div className="py-8 text-center space-y-6">
          <div className="flex justify-center">
            <Character expression={correctCount > 5 ? "celebrating" : "encouraging"} size="lg" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Time’s Up!</h3>
            <p className="text-xs text-muted-text mt-1">High-tempo recall session complete</p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Score</span>
              <span className="text-xl font-black text-amber-500">{score}</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Accuracy</span>
              <span className="text-xl font-black text-foreground">
                {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Best Streak</span>
              <span className="text-xl font-black text-accent">{bestStreak}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={restartGame}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface-muted font-semibold text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Play Again
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:opacity-95 transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Screen */
        <div className="pt-6 space-y-6">
          {/* Stats Bar with Timer Ring */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              {/* Circular Timer */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={RADIUS}
                    className="stroke-surface-muted fill-none"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={RADIUS}
                    className="stroke-amber-500 fill-none transition-all duration-1000 ease-linear"
                    strokeWidth="6"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-black text-foreground">{timeLeft}s</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-text">
                  Score
                </span>
                <p className="text-xl font-black text-foreground">{score}</p>
              </div>
            </div>

            {/* Streak Multiplier Badge */}
            <div
              className={clsx(
                "px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all",
                multiplier > 1
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600 dark:text-amber-400 scale-105"
                  : "bg-surface-muted border-border text-muted-text"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{streak > 0 ? `Streak: ${streak} (×${multiplier})` : "Streak: 0"}</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-surface-muted border border-border min-h-[110px] flex items-center justify-center text-center">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === currentQ.correctAnswer;

              let btnClass = "bg-surface border-border hover:border-accent/40 text-foreground";
              if (feedback && isSelected) {
                btnClass = feedback === "correct"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500 shake";
              } else if (feedback === "wrong" && isCorrectOpt) {
                btnClass = "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300";
              }

              return (
                <button
                  key={idx}
                  disabled={feedback !== null}
                  onClick={() => handleSelect(opt)}
                  className={clsx(
                    "p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left flex items-center justify-between",
                    btnClass
                  )}
                >
                  <span>{opt}</span>
                  {feedback && isSelected && feedback === "correct" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
