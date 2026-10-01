"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Clock, Zap, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
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

interface QuizRushGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface RushItem {
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizRushGame({ cards, questions, onClose, onComplete }: QuizRushGameProps) {
  const QUESTION_TIME = 15;
  const [items, setItems] = useState<RushItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  useEffect(() => {
    let pool: RushItem[] = [];

    if (questions.length >= 4) {
      pool = questions.map((q) => {
        let opts = q.options && q.options.length >= 2 ? [...q.options] : [];
        if (opts.length < 4) {
          const others = questions
            .filter((o) => o.id !== q.id)
            .map((o) => o.correctAnswer)
            .slice(0, 4 - opts.length);
          opts = [...opts, ...others];
        }
        return {
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: shuffle(Array.from(new Set(opts))),
          explanation: q.explanation || "",
        };
      });
    } else {
      pool = cards.map((c, i) => {
        const distractors = cards
          .filter((_, idx) => idx !== i)
          .map((d) => d.back)
          .slice(0, 3);
        return {
          question: `Identify the definition for "${c.front}":`,
          correctAnswer: c.back,
          options: shuffle([c.back, ...distractors]),
          explanation: `"${c.front}" is defined as: ${c.back}`,
        };
      });
    }

    setItems(shuffle(pool).slice(0, 10));
  }, [cards, questions]);

  // Per-question timer
  useEffect(() => {
    if (done || feedback !== null || items.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, done, feedback, items.length]);

  const handleTimeout = () => {
    setFeedback("timeout");
    setCombo(0);
    const curr = items[currentIndex];
    setMistakes((prev) => [
      ...prev,
      {
        questionText: curr.question,
        correctAnswer: curr.correctAnswer,
        userAnswer: "Timed out",
      },
    ]);

    setTimeout(() => {
      advanceNext(false);
    }, 1100);
  };

  const handleAnswer = (option: string) => {
    if (feedback !== null || done || items.length === 0) return;

    setSelectedOption(option);
    const curr = items[currentIndex];
    const isCorrect = option === curr.correctAnswer;

    if (isCorrect) {
      setFeedback("correct");
      const comboBonus = combo * 25;
      const pts = 100 + comboBonus;
      setScore((s) => s + pts);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      setCombo(0);
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
      advanceNext(isCorrect);
    }, 900);
  };

  const advanceNext = (wasCorrect: boolean) => {
    setFeedback(null);
    setSelectedOption(null);
    setTimeLeft(QUESTION_TIME);

    if (currentIndex + 1 >= items.length) {
      setDone(true);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const totalCorrect = wasCorrect ? correctCount + 1 : correctCount;
      const finalAccuracy = Math.round((totalCorrect / items.length) * 100);
      onComplete({
        accuracy: finalAccuracy,
        score,
        streak: bestCombo,
        durationSeconds,
        mistakes,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setTimeLeft(QUESTION_TIME);
    setCombo(0);
    setBestCombo(0);
    setScore(0);
    setCorrectCount(0);
    setFeedback(null);
    setSelectedOption(null);
    setDone(false);
    setMistakes([]);
    setItems((prev) => shuffle(prev));
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border">
        <p className="text-sm text-muted-text">Need at least 3 flashcards or questions to play Quiz Rush.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-xs rounded-lg border border-border">
          Close
        </button>
      </div>
    );
  }

  const current = items[currentIndex];

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-surface rounded-3xl border border-border shadow-lift animate-fade-in relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-foreground">Quiz Rush</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-text">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {done ? (
        /* Results screen */
        <div className="py-8 text-center space-y-6">
          <div className="flex justify-center">
            <Character expression={correctCount >= items.length * 0.7 ? "celebrating" : "encouraging"} size="lg" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Rush Completed!</h3>
            <p className="text-xs text-muted-text mt-1">Speed and accuracy evaluation</p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Score</span>
              <span className="text-xl font-black text-accent">{score}</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Accuracy</span>
              <span className="text-xl font-black text-foreground">
                {Math.round((correctCount / items.length) * 100)}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Best Combo</span>
              <span className="text-xl font-black text-amber-500">×{bestCombo}</span>
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
        /* Active game */
        <div className="pt-5 space-y-5">
          {/* Progress Bar + 15s Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className={clsx("text-sm font-black", timeLeft <= 4 ? "text-rose-500 animate-pulse" : "text-foreground")}>
                {timeLeft}s
              </span>
            </div>

            {combo >= 2 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-600 dark:text-amber-400 font-black text-xs animate-bounce-in">
                COMBO ×{combo}!
              </div>
            )}

            <span className="text-xs font-bold text-foreground">Score: {score}</span>
          </div>

          {/* Question Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-muted border border-border min-h-[90px] flex items-center justify-center text-center">
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {current.question}
            </h3>
          </div>

          {/* Feedback badge for timeout */}
          {feedback === "timeout" && (
            <div className="p-2 text-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold text-xs flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Time ran out!
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {current.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === current.correctAnswer;

              let btnClass = "bg-surface border-border hover:border-accent/40 text-foreground";
              if (feedback && isSelected) {
                btnClass = feedback === "correct"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500 shake";
              } else if (feedback && isCorrectOpt) {
                btnClass = "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300";
              }

              return (
                <button
                  key={idx}
                  disabled={feedback !== null}
                  onClick={() => handleAnswer(opt)}
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
