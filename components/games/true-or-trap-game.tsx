"use client";

import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, RotateCcw, Flame } from "lucide-react";
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

interface TrueOrTrapGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface StatementItem {
  statement: string;
  isTrue: boolean;
  correctExplanation: string;
  originalTerm: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TrueOrTrapGame({ cards, questions, onClose, onComplete }: TrueOrTrapGameProps) {
  const [items, setItems] = useState<StatementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  useEffect(() => {
    const generated: StatementItem[] = [];

    // Prioritize existing true_false quiz questions if available
    const tfQuestions = questions.filter((q) => q.type === "true_false");
    for (const q of tfQuestions) {
      const isTrue = q.correctAnswer.toLowerCase() === "true";
      generated.push({
        statement: q.question,
        isTrue,
        correctExplanation: q.explanation || (isTrue ? "This statement is correct." : "This is a trap."),
        originalTerm: q.question,
      });
    }

    // Generate remaining from flashcards
    const cardPool = shuffle(cards);
    for (let i = 0; i < cardPool.length; i++) {
      const card = cardPool[i];
      const makeTrap = i % 2 === 1 && cardPool.length > 1;

      if (makeTrap) {
        // Swap definition with another card to create a TRAP
        const otherCard = cardPool[(i + 1) % cardPool.length];
        generated.push({
          statement: `"${card.front}" means: ${otherCard.back}`,
          isTrue: false,
          correctExplanation: `Trap! "${card.front}" actually means: "${card.back}"`,
          originalTerm: card.front,
        });
      } else {
        // TRUE statement
        generated.push({
          statement: `"${card.front}" refers to: ${card.back}`,
          isTrue: true,
          correctExplanation: `Correct! "${card.front}" matches this definition.`,
          originalTerm: card.front,
        });
      }
    }

    setItems(shuffle(generated).slice(0, 12));
  }, [cards, questions]);

  const handleAnswer = (choice: boolean) => {
    if (feedback !== null || items.length === 0) return;

    const curr = items[currentIndex];
    const isCorrect = choice === curr.isTrue;

    if (isCorrect) {
      setFeedback("correct");
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
          questionText: curr.statement,
          correctAnswer: curr.isTrue ? "TRUE" : "TRAP",
          userAnswer: choice ? "TRUE" : "TRAP",
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 >= items.length) {
        setDone(true);
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        const finalAccuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / items.length) * 100);
        onComplete({
          accuracy: finalAccuracy,
          score: (isCorrect ? correctCount + 1 : correctCount) * 10,
          streak: Math.max(bestStreak, isCorrect ? streak + 1 : bestStreak),
          durationSeconds,
          mistakes: isCorrect
            ? mistakes
            : [
                ...mistakes,
                {
                  questionText: curr.statement,
                  correctAnswer: curr.isTrue ? "TRUE" : "TRAP",
                  userAnswer: choice ? "TRUE" : "TRAP",
                },
              ],
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setFeedback(null);
    setDone(false);
    setMistakes([]);
    setItems((prev) => shuffle(prev));
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border">
        <p className="text-sm text-muted-text">Need at least 3 flashcards or questions to play True or Trap.</p>
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
          <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-surface-muted text-foreground">
            True or Trap
          </span>
          <span className="text-xs text-muted-text">
            {currentIndex + 1} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {done ? (
        /* Completion screen */
        <div className="py-8 text-center space-y-6">
          <div className="flex justify-center">
            <Character expression={correctCount >= items.length * 0.7 ? "celebrating" : "encouraging"} size="lg" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Round Complete!</h3>
            <p className="text-xs text-muted-text mt-1">Accuracy evaluated on academic claims</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Accuracy</span>
              <span className="text-2xl font-black text-foreground">
                {Math.round((correctCount / items.length) * 100)}%
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Best Streak</span>
              <span className="text-2xl font-black text-amber-500">{bestStreak}</span>
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
        /* Active round */
        <div className="pt-6 space-y-6">
          {/* Mascot reaction indicator */}
          <div className="flex items-center justify-center h-16">
            {feedback === "correct" ? (
              <div className="flex items-center gap-2 text-emerald-600 animate-bounce-in">
                <Character expression="happy" size="sm" />
                <span className="text-xs font-bold">Spot on!</span>
              </div>
            ) : feedback === "wrong" ? (
              <div className="flex items-center gap-2 text-rose-600 animate-shake">
                <Character expression="confused" size="sm" />
                <span className="text-xs font-bold">Not quite.</span>
              </div>
            ) : (
              <Character expression="focused" size="sm" />
            )}
          </div>

          {/* Statement card */}
          <div
            className={clsx(
              "p-6 sm:p-8 rounded-2xl border transition-all text-center min-h-[140px] flex flex-col items-center justify-center",
              feedback === "correct"
                ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500"
                : feedback === "wrong"
                ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-500"
                : "bg-surface-muted border-border"
            )}
          >
            <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {current.statement}
            </p>

            {feedback && (
              <p className="text-xs font-medium mt-3 text-muted-text animate-fade-up">
                {current.correctExplanation}
              </p>
            )}
          </div>

          {/* TRUE / TRAP Actions */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <button
              disabled={feedback !== null}
              onClick={() => handleAnswer(true)}
              className="py-4 px-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 font-black text-sm sm:text-base tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-5 h-5" />
              TRUE
            </button>
            <button
              disabled={feedback !== null}
              onClick={() => handleAnswer(false)}
              className="py-4 px-4 rounded-2xl border-2 border-rose-500/40 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-black text-sm sm:text-base tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <AlertCircle className="w-5 h-5" />
              TRAP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
