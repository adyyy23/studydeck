"use client";

import React, { useState, useEffect } from "react";
import { X, Star, Flag, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
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

interface StudyAdventureGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface AdventureQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  isCheckpoint: boolean;
}

const TOTAL_STEPS = 7; // 0 (start) to 6 (finish) with step 3 as checkpoint ★

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function StudyAdventureGame({
  cards,
  questions,
  onClose,
  onComplete,
}: StudyAdventureGameProps) {
  const [qPool, setQPool] = useState<AdventureQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 to 6
  const [questionIdx, setQuestionIdx] = useState(0);
  const [attemptsOnQuestion, setAttemptsOnQuestion] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  useEffect(() => {
    let pool: AdventureQuestion[] = [];

    if (questions.length >= 4) {
      pool = questions.map((q, idx) => {
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
          isCheckpoint: idx === 2 || idx === 5,
        };
      });
    } else {
      pool = cards.map((c, idx) => {
        const distractors = cards
          .filter((_, i) => i !== idx)
          .map((d) => d.back)
          .slice(0, 3);
        return {
          question: `Recall: "${c.front}"`,
          correctAnswer: c.back,
          options: shuffle([c.back, ...distractors]),
          isCheckpoint: idx === 2,
        };
      });
    }

    setQPool(shuffle(pool));
  }, [cards, questions]);

  const currentQ = qPool[questionIdx % (qPool.length || 1)] || null;

  const handleSelect = (option: string) => {
    if (!currentQ || feedback !== null || done) return;

    setSelectedOption(option);
    setTotalAttempts((t) => t + 1);
    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      setFeedback("correct");
      const stepPoints = currentQ.isCheckpoint ? 150 : 100;
      setScore((s) => s + stepPoints);
      setCorrectCount((c) => c + 1);

      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
        setAttemptsOnQuestion(0);

        if (nextStep >= TOTAL_STEPS - 1) {
          // Finished the adventure!
          setDone(true);
          const durationSeconds = Math.round((Date.now() - startTime) / 1000);
          const accuracy = Math.round(((correctCount + 1) / (totalAttempts + 1)) * 100);
          onComplete({
            accuracy,
            score: score + stepPoints,
            streak: nextStep,
            durationSeconds,
            mistakes,
          });
        } else {
          setQuestionIdx((q) => q + 1);
        }
      }, 1000);
    } else {
      setFeedback("wrong");
      setMistakes((prev) => [
        ...prev,
        {
          questionText: currentQ.question,
          correctAnswer: currentQ.correctAnswer,
          userAnswer: option,
        },
      ]);

      const attempts = attemptsOnQuestion + 1;
      setAttemptsOnQuestion(attempts);

      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);

        if (attempts >= 2) {
          // Move to next question without moving character forward
          setAttemptsOnQuestion(0);
          setQuestionIdx((q) => q + 1);
        }
      }, 1000);
    }
  };

  const restartGame = () => {
    setCurrentStep(0);
    setQuestionIdx(0);
    setAttemptsOnQuestion(0);
    setFeedback(null);
    setSelectedOption(null);
    setScore(0);
    setTotalAttempts(0);
    setCorrectCount(0);
    setDone(false);
    setMistakes([]);
    setQPool((prev) => shuffle(prev));
  };

  if (!currentQ) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border">
        <p className="text-sm text-muted-text">Need flashcards or quiz items to play Study Adventure.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-xs rounded-lg border border-border">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-surface rounded-3xl border border-border shadow-lift animate-fade-in relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-surface-muted text-foreground">
            Study Adventure
          </span>
          <span className="text-xs text-muted-text">
            Step {currentStep} of {TOTAL_STEPS - 1}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-accent">Score: {score}</span>
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
            <Character expression="celebrating" size="lg" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              Adventure Completed!
            </h3>
            <p className="text-xs text-muted-text mt-1">
              You navigated the entire study path to the finish line!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Adventure Score</span>
              <span className="text-2xl font-black text-accent">{score}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Accuracy</span>
              <span className="text-2xl font-black text-foreground">
                {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100}%
              </span>
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
        <div className="pt-6 space-y-6">
          {/* Visual Adventure Path */}
          <div className="p-4 rounded-2xl bg-surface-muted border border-border">
            <div className="flex items-center justify-between relative px-2">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-border z-0" />

              {Array.from({ length: TOTAL_STEPS }).map((_, stepIdx) => {
                const isCurrent = currentStep === stepIdx;
                const isPassed = currentStep > stepIdx;
                const isCheckpoint = stepIdx === 3;
                const isFinish = stepIdx === TOTAL_STEPS - 1;

                return (
                  <div
                    key={stepIdx}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    {/* Floating Character above current position */}
                    {isCurrent && (
                      <div className="absolute -top-11 animate-bounce">
                        <Character expression="studying" size="sm" />
                      </div>
                    )}

                    <div
                      className={clsx(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all",
                        isCurrent
                          ? "border-accent bg-accent text-white ring-4 ring-accent/20 scale-110"
                          : isPassed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border bg-surface text-muted-text"
                      )}
                    >
                      {isFinish ? (
                        <Flag className="w-3.5 h-3.5" />
                      ) : isCheckpoint ? (
                        <Star className="w-3.5 h-3.5" />
                      ) : (
                        stepIdx
                      )}
                    </div>

                    <span className="text-[9px] font-bold text-muted-text">
                      {stepIdx === 0 ? "Start" : isFinish ? "Goal" : isCheckpoint ? "★" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-surface-muted border border-border min-h-[90px] flex flex-col items-center justify-center text-center">
            {currentQ.isCheckpoint && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Checkpoint Challenge (+150 pts)
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {currentQ.question}
            </h3>
            {attemptsOnQuestion === 1 && (
              <p className="text-xs text-rose-500 mt-2 font-medium">
                Try once more to advance!
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;

              let btnClass = "bg-surface border-border hover:border-accent/40 text-foreground";
              if (feedback && isSelected) {
                btnClass = feedback === "correct"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500 shake";
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
