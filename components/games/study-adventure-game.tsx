"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Flag, CheckCircle2, RotateCcw, MapPin, Footprints } from "lucide-react";
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

  const initGame = useCallback(() => {
    let pool: AdventureQuestion[] = [];

    if (questions && questions.length >= 4) {
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
  }, [cards, questions]);

  useEffect(() => {
    initGame();
  }, [initGame]);

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
      }, 950);
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
          setAttemptsOnQuestion(0);
          setQuestionIdx((q) => q + 1);
        }
      }, 950);
    }
  };

  if (!currentQ) {
    return (
      <div className="p-8 text-center bg-[#F7F3EA] dark:bg-[#221B17] rounded-xl border border-[#D6CCBF] dark:border-[#3D322B]">
        <p className="text-sm text-[#756C64] dark:text-[#9E9186]">
          Need flashcards or quiz items to play Study Adventure.
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

  const finalAccuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;

  return (
    <GameShell
      title="Study Adventure"
      badge="Expedition Path"
      topic={`Expedition Step ${currentStep} of ${TOTAL_STEPS - 1}`}
      onExit={onClose}
      progressPercent={(currentStep / (TOTAL_STEPS - 1)) * 100}
      metrics={[
        {
          label: "Waypoint",
          value: `${currentStep} / ${TOTAL_STEPS - 1}`,
          icon: <MapPin className="w-3.5 h-3.5 text-[#B77A45]" />,
        },
        {
          label: "Streak",
          value: `×${currentStep}`,
          icon: <Footprints className="w-3.5 h-3.5 text-[#D79A45]" />,
          highlight: currentStep >= 3,
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
          title="Expedition Finished!"
          score={score}
          accuracy={finalAccuracy}
          streak={TOTAL_STEPS - 1}
          xp={Math.round(score * 0.15) + 30}
          isPersonalBest={true}
          onPlayAgain={initGame}
          onComplete={() => onComplete({
            accuracy: finalAccuracy,
            score,
            streak: currentStep,
            durationSeconds: Math.round((Date.now() - startTime) / 1000),
            mistakes,
          })}
          onClose={onClose}
        />
      ) : (
        <div className="max-w-xl mx-auto space-y-5 sm:space-y-6 pt-2">
          {/* Visual Adventure Path */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#756C64] dark:text-[#9E9186] mb-3 text-center">
              Field Expedition Map
            </div>
            <div className="flex items-center justify-between relative px-2 sm:px-4">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#D6CCBF] dark:bg-[#3D322B] z-0" />

              {Array.from({ length: TOTAL_STEPS }).map((_, stepIdx) => {
                const isCurrent = currentStep === stepIdx;
                const isPassed = currentStep > stepIdx;
                const isCheckpoint = stepIdx === 3;
                const isFinish = stepIdx === TOTAL_STEPS - 1;

                return (
                  <div
                    key={stepIdx}
                    className="relative z-10 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={clsx(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all",
                        isCurrent
                          ? "border-[#D79A45] bg-[#D79A45] text-white ring-4 ring-[#D79A45]/20 scale-110 shadow-xs"
                          : isPassed
                          ? "border-[#3D6B4F] bg-[#3D6B4F] text-white"
                          : "border-[#D6CCBF] dark:border-[#3D322B] bg-[#F7F3EA] dark:bg-[#221B17] text-[#756C64] dark:text-[#9E9186]"
                      )}
                    >
                      {isFinish ? (
                        <Flag className="w-3.5 h-3.5" />
                      ) : isCheckpoint ? (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        stepIdx
                      )}
                    </div>

                    <span className="text-[9px] font-bold text-[#756C64] dark:text-[#9E9186] hidden sm:block">
                      {stepIdx === 0 ? "Start" : isFinish ? "Goal" : isCheckpoint ? "Camp" : `W${stepIdx}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          <div className="p-5 sm:p-7 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] min-h-[90px] flex flex-col items-center justify-center text-center shadow-xs">
            {currentQ.isCheckpoint && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30 mb-2 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                <span>Camp Checkpoint Challenge (+150 pts)</span>
              </span>
            )}
            <h3 className="text-base sm:text-lg font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
              {currentQ.question}
            </h3>
            {attemptsOnQuestion === 1 && (
              <p className="text-xs text-[#B84A39] mt-2 font-medium">
                Try once more to unlock passage!
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === currentQ.correctAnswer;

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
                  onClick={() => handleSelect(opt)}
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
