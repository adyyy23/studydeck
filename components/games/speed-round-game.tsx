"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Zap, CheckCircle2, RotateCcw } from "lucide-react";
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

interface SpeedRoundGameProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
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
  questions = [],
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

  const initGame = useCallback(() => {
    let pool: RoundQuestion[] = [];

    if (questions && questions.length >= 4) {
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
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedOption(null);
    setMistakes([]);
    setDone(false);
  }, [cards, questions]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Countdown timer
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [done]);

  const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

  const handleSelect = (option: string) => {
    if (feedback !== null || done) return;

    setSelectedOption(option);
    setTotalAnswered((t) => t + 1);

    const cur = qPool[currentIndex];
    const isCorrect = option === cur.correctAnswer;

    if (isCorrect) {
      const addedPoints = 10 * multiplier;
      setScore((s) => s + addedPoints);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setCorrectCount((c) => c + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
      setMistakes((m) => [
        ...m,
        {
          questionText: cur.question,
          correctAnswer: cur.correctAnswer,
          userAnswer: option,
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      if (currentIndex + 1 < qPool.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setDone(true);
      }
    }, 550);
  };

  const currentQ = qPool[currentIndex] || {
    question: "Get ready...",
    correctAnswer: "",
    options: [],
  };

  const progressPercent = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;
  const accuracy = totalAnswered === 0 ? 100 : Math.round((correctCount / totalAnswered) * 100);

  if (done) {
    const xp = Math.round(score / 5) + (accuracy >= 80 ? 25 : 10);
    const result: GameResult = {
      accuracy,
      score,
      streak: bestStreak,
      durationSeconds: TOTAL_TIME - timeLeft,
      mistakes,
    };

    return (
      <GameShell title="Speed Round" onExit={onClose}>
        <GameResultReport
          title="Speed Assessment Complete"
          score={score}
          accuracy={accuracy}
          streak={bestStreak}
          xp={xp}
          isPersonalBest={bestStreak >= 5}
          onPlayAgain={initGame}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Speed Round"
      badge="Fast Pace"
      onExit={onClose}
      progressPercent={progressPercent}
      metrics={[
        { label: "Time Left", value: `${timeLeft}s`, icon: <Clock className="w-3.5 h-3.5 text-[#B77A45]" /> },
        { label: "Score", value: score },
        { label: "Multiplier", value: `×${multiplier}`, highlight: multiplier > 1 },
        { label: "Streak", value: `×${streak}` },
      ]}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Question Card */}
        <div className="p-5 sm:p-7 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] min-h-[110px] flex items-center justify-center text-center shadow-xs">
          <h3 className="text-base sm:text-lg font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = feedback === "correct" && isSelected;
            const isWrong = feedback === "wrong" && isSelected;

            return (
              <button
                key={idx}
                disabled={feedback !== null}
                onClick={() => handleSelect(opt)}
                className={clsx(
                  "p-3.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-between min-h-[50px] touch-target",
                  isCorrect && "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F]",
                  isWrong && "animate-shake bg-[#FBEBEB] border-[#B84A39] text-[#B84A39]",
                  !feedback && isSelected && "bg-[#EAE3D8] border-[#B77A45]",
                  !feedback && !isSelected && "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#B77A45] hover:bg-[#F2EEE6] text-[#29231F] dark:text-[#F2EEE6]"
                )}
              >
                <span>{opt}</span>
                {isCorrect && <CheckCircle2 className="w-4 h-4 text-[#3D6B4F] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
