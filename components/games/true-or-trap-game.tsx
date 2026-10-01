"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, AlertCircle, RotateCcw, Flame } from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";
import { Character } from "@/components/ui/character";
import { GameShell, GameResultReport } from "./game-shell";

export interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface TrueOrTrapGameProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
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

export function TrueOrTrapGame({ cards, questions = [], onClose, onComplete }: TrueOrTrapGameProps) {
  const [items, setItems] = useState<StatementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  const initGame = useCallback(() => {
    const generated: StatementItem[] = [];

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

    const cardPool = shuffle(cards);
    for (let i = 0; i < cardPool.length; i++) {
      const card = cardPool[i];
      const makeTrap = i % 2 === 1 && cardPool.length > 1;

      if (makeTrap) {
        const otherCard = cardPool[(i + 1) % cardPool.length];
        generated.push({
          statement: `"${card.front}" means: ${otherCard.back}`,
          isTrue: false,
          correctExplanation: `Trap! "${card.front}" actually means: "${card.back}"`,
          originalTerm: card.front,
        });
      } else {
        generated.push({
          statement: `"${card.front}" refers to: ${card.back}`,
          isTrue: true,
          correctExplanation: `Correct! "${card.front}" matches this definition.`,
          originalTerm: card.front,
        });
      }
    }

    setItems(shuffle(generated).slice(0, 12));
    setCurrentIndex(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setFeedback(null);
    setMistakes([]);
    setDone(false);
  }, [cards, questions]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleAnswer = (choice: boolean) => {
    if (feedback !== null || items.length === 0 || done) return;

    const curr = items[currentIndex];
    const isCorrect = choice === curr.isTrue;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
      setMistakes((m) => [
        ...m,
        {
          questionText: curr.statement,
          correctAnswer: curr.isTrue ? "TRUE" : "TRAP",
          userAnswer: choice ? "TRUE" : "TRAP",
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < items.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setDone(true);
      }
    }, 1100);
  };

  const current = items[currentIndex] || {
    statement: "Loading claim...",
    isTrue: true,
    correctExplanation: "",
  };

  const progressPercent = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;
  const accuracy = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 100;
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  if (done) {
    const score = correctCount * 120 + bestStreak * 30;
    const xp = correctCount * 8 + (accuracy >= 80 ? 25 : 10);
    const result: GameResult = {
      accuracy,
      score,
      streak: bestStreak,
      durationSeconds: elapsed,
      mistakes,
    };

    return (
      <GameShell title="True or Trap" onExit={onClose}>
        <GameResultReport
          title="Trap Detection Complete"
          score={score}
          accuracy={accuracy}
          streak={bestStreak}
          xp={xp}
          isPersonalBest={bestStreak >= 4}
          onPlayAgain={initGame}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="True or Trap"
      badge="Fact Checking"
      onExit={onClose}
      progressPercent={progressPercent}
      metrics={[
        { label: "Round", value: `${currentIndex + 1}/${items.length}` },
        { label: "Streak", value: `×${streak}`, highlight: streak > 1 },
        { label: "Accuracy", value: `${accuracy}%` },
      ]}
    >
      <div className="max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* Companion Reaction Indicator */}
        <div className="flex items-center justify-center h-12">
          {feedback === "correct" ? (
            <div className="flex items-center gap-2 text-[#3D6B4F] animate-fade-in font-bold text-xs">
              <Character character="pip" expression="happy" size="xs" />
              <span>Accurate evaluation!</span>
            </div>
          ) : feedback === "wrong" ? (
            <div className="flex items-center gap-2 text-[#B84A39] animate-fade-in font-bold text-xs">
              <Character character="pip" expression="confused" size="xs" />
              <span>Sneaky trap!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#756C64] text-xs font-semibold">
              <Character character="pip" expression="focused" size="xs" />
              <span>Is this statement fact or fallacy?</span>
            </div>
          )}
        </div>

        {/* Statement Card */}
        <div
          className={clsx(
            "p-6 sm:p-8 rounded-xl border text-center min-h-[140px] flex flex-col items-center justify-center transition-all shadow-xs",
            feedback === "correct" && "bg-[#EBF3ED] border-[#3D6B4F]",
            feedback === "wrong" && "bg-[#FBEBEB] border-[#B84A39]",
            !feedback && "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B]"
          )}
        >
          <p className="text-base sm:text-lg font-serif font-black text-[#29231F] dark:text-[#F2EEE6] leading-snug">
            {current.statement}
          </p>

          {feedback && (
            <p className="text-xs font-semibold mt-3 text-[#756C64] dark:text-[#9E9186] animate-fade-in">
              {current.correctExplanation}
            </p>
          )}
        </div>

        {/* Decision Controls: TRUE / TRAP */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            disabled={feedback !== null}
            onClick={() => handleAnswer(true)}
            className="py-4 px-4 rounded-lg border-2 border-[#3D6B4F]/40 bg-[#EBF3ED] text-[#3D6B4F] hover:bg-[#3D6B4F] hover:text-white font-black text-sm sm:text-base tracking-wider transition-all flex items-center justify-center gap-2 touch-target shadow-xs"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>TRUE</span>
          </button>
          <button
            disabled={feedback !== null}
            onClick={() => handleAnswer(false)}
            className="py-4 px-4 rounded-lg border-2 border-[#B84A39]/40 bg-[#FBEBEB] text-[#B84A39] hover:bg-[#B84A39] hover:text-white font-black text-sm sm:text-base tracking-wider transition-all flex items-center justify-center gap-2 touch-target shadow-xs"
          >
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            <span>TRAP</span>
          </button>
        </div>
      </div>
    </GameShell>
  );
}
