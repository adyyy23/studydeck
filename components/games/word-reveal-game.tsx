"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
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

interface WordRevealGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
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

  useEffect(() => {
    // Pick suitable terms (3 to 20 letters)
    const valid = cards
      .filter((c) => c.front.trim().length >= 3 && c.front.trim().length <= 25)
      .map((c) => ({
        term: c.front.trim().toUpperCase(),
        definition: c.back,
      }));

    if (valid.length > 0) {
      setRounds(valid.slice(0, 6));
    }
  }, [cards]);

  const current = rounds[currentRoundIdx] || null;

  // Reveal a random hidden letter
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
      // Reveal all letters
      const all = new Set<number>();
      for (let i = 0; i < current.term.length; i++) all.add(i);
      setRevealedIndices(all);

      setTotalScore((t) => t + roundScore);
      setRoundsCompleted((r) => r + 1);
    } else {
      setFeedback("wrong");
      setRoundScore((s) => Math.max(10, s - 20));
      setMistakes((prev) => [
        ...prev,
        {
          questionText: `Term for: ${current.definition}`,
          correctAnswer: current.term,
          userAnswer: cleanGuess,
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      setGuessInput("");
      if (isCorrect) {
        if (currentRoundIdx + 1 >= rounds.length) {
          setDone(true);
          const durationSeconds = Math.round((Date.now() - startTime) / 1000);
          const finalAccuracy = Math.round(((roundsCompleted + 1) / rounds.length) * 100);
          onComplete({
            accuracy: finalAccuracy,
            score: totalScore + roundScore,
            streak: roundsCompleted + 1,
            durationSeconds,
            mistakes,
          });
        } else {
          setCurrentRoundIdx((prev) => prev + 1);
          setRevealedIndices(new Set());
          setHintsUsed(0);
          setRoundScore(100);
        }
      }
    }, 1100);
  };

  const restartGame = () => {
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
  };

  if (!current) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-border">
        <p className="text-sm text-muted-text">Need flashcards with concise terms to play Word Reveal.</p>
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
            Word Reveal
          </span>
          <span className="text-xs text-muted-text">
            Round {currentRoundIdx + 1} of {rounds.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-accent">
            <span>Score: {totalScore + (feedback === "correct" ? roundScore : 0)}</span>
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
        /* Results screen */
        <div className="py-8 text-center space-y-6">
          <div className="flex justify-center">
            <Character expression="celebrating" size="lg" />
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              All Terms Unlocked!
            </h3>
            <p className="text-xs text-muted-text mt-1">Vocabulary mastery session completed</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Total Score</span>
              <span className="text-2xl font-black text-accent">{totalScore}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-text block">Solved</span>
              <span className="text-2xl font-black text-foreground">
                {roundsCompleted}/{rounds.length}
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
        /* Active round */
        <div className="pt-6 space-y-6">
          {/* Definition Clue */}
          <div className="p-4 rounded-2xl bg-surface-muted border border-border text-center">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-text block mb-1">
              Definition Clue
            </span>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {current.definition}
            </p>
          </div>

          {/* Letter Boxes */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 py-4">
            {current.term.split("").map((char, idx) => {
              if (char === " ") {
                return <div key={idx} className="w-4 sm:w-6" />;
              }

              const isRevealed = revealedIndices.has(idx);

              return (
                <div
                  key={idx}
                  className={clsx(
                    "w-9 h-11 sm:w-11 sm:h-13 rounded-xl border-2 flex items-center justify-center font-mono text-base sm:text-lg font-black transition-all",
                    isRevealed
                      ? "border-accent bg-accent-light text-accent-text animate-bounce-in"
                      : "border-border bg-surface text-transparent"
                  )}
                >
                  {isRevealed ? char : "_"}
                </div>
              );
            })}
          </div>

          {/* Guess Form */}
          <form onSubmit={handleGuess} className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={guessInput}
                disabled={feedback !== null}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type your guess here..."
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border text-sm uppercase tracking-wider font-bold bg-surface focus:outline-none transition-all",
                  feedback === "correct"
                    ? "border-emerald-500 ring-2 ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : feedback === "wrong"
                    ? "border-rose-500 ring-2 ring-rose-500 text-rose-700 dark:text-rose-300 shake"
                    : "border-border focus:ring-1 focus:ring-accent text-foreground"
                )}
              />
              <button
                type="submit"
                disabled={feedback !== null || !guessInput.trim()}
                className="absolute right-2 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:opacity-95 transition disabled:opacity-50 flex items-center gap-1"
              >
                <span>Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-text">
                Round value: <strong className="text-foreground">{roundScore} pts</strong>
              </span>

              <button
                type="button"
                onClick={handleRevealHint}
                disabled={feedback !== null}
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Reveal Letter (−15 pts)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
