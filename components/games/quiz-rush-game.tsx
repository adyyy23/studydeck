"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Zap, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";
import { GameShell, GameResultReport } from "./game-shell";

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

  const initGame = useCallback(() => {
    let pool: RushItem[] = [];

    if (questions && questions.length >= 4) {
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
  }, [cards, questions]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleTimeout = useCallback(() => {
    setFeedback("timeout");
    setCombo(0);
    if (items[currentIndex]) {
      const curr = items[currentIndex];
      setMistakes((prev) => [
        ...prev,
        {
          questionText: curr.question,
          correctAnswer: curr.correctAnswer,
          userAnswer: "Timed out",
        },
      ]);
    }

    setTimeout(() => {
      advanceNext(false);
    }, 1100);
  }, [currentIndex, items]);

  // Per-question countdown timer
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
  }, [currentIndex, done, feedback, items.length, handleTimeout]);

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

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-[#F7F3EA] dark:bg-[#221B17] rounded-xl border border-[#D6CCBF] dark:border-[#3D322B]">
        <p className="text-sm text-[#756C64] dark:text-[#9E9186]">
          Need at least 3 flashcards or questions to play Quiz Rush.
        </p>
        <button
          onClick={onClose}
          className="btn-secondary mt-4 px-4 py-2 text-xs"
        >
          Return to Arcade
        </button>
      </div>
    );
  }

  const current = items[currentIndex];
  const finalAccuracy = Math.round((correctCount / items.length) * 100);

  return (
    <GameShell
      title="Quiz Rush"
      badge="Sprint Recall"
      topic={`Item ${currentIndex + 1} of ${items.length}`}
      onExit={onClose}
      progressPercent={((currentIndex) / items.length) * 100}
      metrics={[
        {
          label: "Time",
          value: `${timeLeft}s`,
          icon: <Clock className="w-3.5 h-3.5 text-[#B77A45]" />,
          highlight: timeLeft <= 4,
        },
        {
          label: "Combo",
          value: `×${combo}`,
          icon: <Zap className="w-3.5 h-3.5 text-[#D79A45]" />,
          highlight: combo >= 2,
        },
        {
          label: "Score",
          value: score.toLocaleString(),
          highlight: true,
        },
      ]}
    >
      {done ? (
        <GameResultReport
          title="Rush Sprint Complete"
          score={score}
          accuracy={finalAccuracy}
          streak={bestCombo}
          xp={Math.round(score * 0.12) + 20}
          isPersonalBest={bestCombo >= 5}
          onPlayAgain={initGame}
          onComplete={() => onComplete({
            accuracy: finalAccuracy,
            score,
            streak: bestCombo,
            durationSeconds: Math.round((Date.now() - startTime) / 1000),
            mistakes,
          })}
          onClose={onClose}
        />
      ) : (
        <div className="max-w-xl mx-auto space-y-4 sm:space-y-6 pt-2">
          {/* Question Prompt Sheet */}
          <div className="p-5 sm:p-7 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] text-center shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756C64] dark:text-[#9E9186] block mb-2">
              Prompt • 15-Second Window
            </span>
            <h3 className="text-base sm:text-lg font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
              {current?.question}
            </h3>
          </div>

          {/* Feedback banner for timeout */}
          {feedback === "timeout" && (
            <div className="p-3 text-center rounded-lg bg-[#FEE2E2] dark:bg-[#450A0A] border border-[#B84A39]/30 text-[#B84A39] font-bold text-xs flex items-center justify-center gap-1.5 animate-bounce-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Time ran out for this question!</span>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {current?.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === current.correctAnswer;

              let btnClass = "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] text-[#332821] dark:text-[#F2EEE6] hover:border-[#654A3A]";
              if (feedback && isSelected) {
                btnClass = feedback === "correct"
                  ? "bg-[#F0FDF4] dark:bg-[#052E16] border-[#3D6B4F] text-[#3D6B4F] dark:text-[#86EFAC] ring-2 ring-[#3D6B4F]"
                  : "bg-[#FEF2F2] dark:bg-[#450A0A] border-[#B84A39] text-[#B84A39] dark:text-[#FCA5A5] ring-2 ring-[#B84A39] shake";
              } else if (feedback && isCorrectOpt) {
                btnClass = "bg-[#F0FDF4] dark:bg-[#052E16] border-[#3D6B4F] text-[#3D6B4F] dark:text-[#86EFAC]";
              }

              return (
                <button
                  key={idx}
                  disabled={feedback !== null}
                  onClick={() => handleAnswer(opt)}
                  className={clsx(
                    "p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left flex items-center justify-between touch-target",
                    btnClass
                  )}
                >
                  <span className="leading-snug">{opt}</span>
                  {feedback && isSelected && feedback === "correct" && (
                    <CheckCircle2 className="w-4 h-4 text-[#3D6B4F] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameShell>
  );
}
