"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HelpCircle, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
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

interface WordRevealGameProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface WordRound {
  term: string;
  definition: string;
}

export function WordRevealGame({ cards, onClose, onComplete }: WordRevealGameProps) {
  const [rounds, setRounds] = useState<WordRound[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [guessInput, setGuessInput] = useState("");
  const [roundScore, setRoundScore] = useState(100);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  const initGame = useCallback(() => {
    const valid = cards
      .filter((c) => c.front.trim().length >= 3 && c.front.trim().length <= 25)
      .map((c) => ({
        term: c.front.trim().toUpperCase(),
        definition: c.back,
      }));

    if (valid.length > 0) {
      setRounds(valid.slice(0, 6));
    }
    setCurrentRoundIdx(0);
    setRevealedIndices(new Set());
    setGuessInput("");
    setRoundScore(100);
    setTotalScore(0);
    setRoundsCompleted(0);
    setFeedback(null);
    setHintsUsed(0);
    setDone(false);
    setMistakes([]);
  }, [cards]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const current = rounds[currentRoundIdx] || null;

  const handleRevealHint = () => {
    if (!current || feedback) return;

    const unrevealed: number[] = [];
    for (let i = 0; i < current.term.length; i++) {
      const char = current.term[i];
      if (char !== " " && !revealedIndices.has(i)) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length === 0) return;

    const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      next.add(randomIdx);
      return next;
    });
    setHintsUsed((h) => h + 1);
    setRoundScore((s) => Math.max(20, s - 15));
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || feedback || !guessInput.trim()) return;

    const cleanGuess = guessInput.trim().toUpperCase();
    const isCorrect = cleanGuess === current.term;

    if (isCorrect) {
      setFeedback("correct");
      const all = new Set<number>();
      for (let i = 0; i < current.term.length; i++) all.add(i);
      setRevealedIndices(all);

      setTotalScore((t) => t + roundScore);
      setRoundsCompleted((r) => r + 1);
    } else {
      setFeedback("wrong");
      setMistakes((m) => [
        ...m,
        {
          questionText: current.definition,
          correctAnswer: current.term,
          userAnswer: cleanGuess,
        },
      ]);
      setRoundScore((s) => Math.max(10, s - 20));
      setTimeout(() => setFeedback(null), 700);
    }
  };

  const handleNextRound = () => {
    setFeedback(null);
    setGuessInput("");
    setRevealedIndices(new Set());
    setRoundScore(100);

    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  if (!current) {
    return (
      <GameShell title="Word Reveal" onExit={onClose}>
        <div className="p-8 text-center max-w-md mx-auto">
          <p className="text-sm font-bold text-[#49372D] dark:text-[#F2EEE6]">
            Need flashcards with concise terms to play Word Reveal.
          </p>
          <button onClick={onClose} className="btn-primary mt-4 px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
            Back to Arcade
          </button>
        </div>
      </GameShell>
    );
  }

  const progressPercent = rounds.length > 0 ? ((currentRoundIdx + 1) / rounds.length) * 100 : 0;
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const accuracy = rounds.length > 0 ? Math.round((roundsCompleted / rounds.length) * 100) : 100;

  if (done) {
    const xp = Math.round(totalScore / 8) + 15;
    const result: GameResult = {
      accuracy,
      score: totalScore,
      streak: roundsCompleted,
      durationSeconds: elapsed,
      mistakes,
    };

    return (
      <GameShell title="Word Reveal" onExit={onClose}>
        <GameResultReport
          title="Word Reveal Certified"
          score={totalScore}
          accuracy={accuracy}
          streak={roundsCompleted}
          xp={xp}
          isPersonalBest={roundsCompleted >= rounds.length}
          onPlayAgain={initGame}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Word Reveal"
      badge="Spelling & Recall"
      onExit={onClose}
      progressPercent={progressPercent}
      metrics={[
        { label: "Round", value: `${currentRoundIdx + 1}/${rounds.length}` },
        { label: "Round Score", value: roundScore, highlight: true },
        { label: "Total Score", value: totalScore },
      ]}
    >
      <div className="max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* Definition Clue Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] text-center shadow-xs">
          <span className="text-[10px] uppercase tracking-wider font-black text-[#B77A45] block mb-1">
            Definition Clue
          </span>
          <p className="text-sm font-semibold text-[#29231F] dark:text-[#F2EEE6] leading-relaxed">
            {current.definition}
          </p>
        </div>

        {/* Revealed Letter Boxes */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-2 select-none">
          {current.term.split("").map((char, idx) => {
            if (char === " ") {
              return <div key={idx} className="w-4 h-10 sm:h-12" />;
            }

            const isRevealed = revealedIndices.has(idx);

            return (
              <div
                key={idx}
                className={clsx(
                  "w-8 h-10 sm:w-10 sm:h-12 rounded-lg border-2 flex items-center justify-center font-mono font-black text-sm sm:text-base transition-all",
                  isRevealed
                    ? "bg-[#FFFBEB] dark:bg-[#382A1E] border-[#D79A45] text-[#332821] dark:text-[#F2EEE6] scale-100"
                    : "bg-[#EAE3D8] dark:bg-[#2E2520] border-[#D6CCBF] dark:border-[#3D322B] text-transparent"
                )}
              >
                {isRevealed ? char : "?"}
              </div>
            );
          })}
        </div>

        {/* Action / Input Area */}
        {feedback === "correct" ? (
          <div className="p-4 rounded-xl border border-[#3D6B4F] bg-[#EBF3ED] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-[#3D6B4F] font-bold text-xs">
              <CheckCircle2 className="w-5 h-5" />
              <span>Correct term decoded! (+{roundScore} pts)</span>
            </div>
            <button
              onClick={handleNextRound}
              className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Next Term</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleGuess} className="flex gap-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type your guess here..."
                autoFocus
                className={clsx(
                  "flex-1 px-3.5 py-2.5 rounded-lg border bg-[#FFFCF6] dark:bg-[#2B231E] text-xs sm:text-sm font-semibold text-[#29231F] dark:text-[#F2EEE6] focus:outline-none focus:ring-1 focus:ring-[#B77A45] uppercase tracking-wider",
                  feedback === "wrong" && "animate-shake border-[#B84A39]"
                )}
              />
              <button
                type="submit"
                className="btn-primary px-5 py-2.5 text-xs font-bold tracking-wider uppercase whitespace-nowrap"
              >
                Guess
              </button>
            </form>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleRevealHint}
                className="flex items-center gap-1.5 text-xs font-bold text-[#756C64] hover:text-[#B77A45] transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Reveal Letter Hint (-15 pts)</span>
              </button>

              <span className="text-[11px] text-[#756C64]">
                Hints used: {hintsUsed}
              </span>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
