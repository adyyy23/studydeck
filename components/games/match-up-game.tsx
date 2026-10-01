"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Shuffle, CheckCircle2, RotateCcw } from "lucide-react";
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

interface MatchUpGameProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface MatchCard {
  id: string;
  pairId: string;
  text: string;
  side: "term" | "def";
  matched: boolean;
  animating: "correct" | "wrong" | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MatchUpGame({ cards, onClose, onComplete }: MatchUpGameProps) {
  const MIN_PAIRS = 3;
  const pairs = cards.slice(0, 8); // cap at 8 pairs

  const [terms, setTerms] = useState<MatchCard[]>([]);
  const [defs, setDefs] = useState<MatchCard[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = useCallback(() => {
    if (pairs.length < MIN_PAIRS) return;
    const t: MatchCard[] = shuffle(
      pairs.map((c) => ({ id: `t_${c.id}`, pairId: c.id, text: c.front, side: "term" as const, matched: false, animating: null }))
    );
    const d: MatchCard[] = shuffle(
      pairs.map((c) => ({ id: `d_${c.id}`, pairId: c.id, text: c.back, side: "def" as const, matched: false, animating: null }))
    );
    setTerms(t);
    setDefs(d);
    setSelectedTerm(t[0]?.id || null);
    setMoves(0);
    setCorrect(0);
    setElapsed(0);
    setStreak(0);
    setDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [pairs]);

  useEffect(() => {
    initGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [initGame]);

  const accuracy = moves === 0 ? 100 : Math.round((correct / moves) * 100);
  const progressPercent = pairs.length > 0 ? (correct / pairs.length) * 100 : 0;

  const handleTermClick = (id: string) => {
    if (terms.find((t) => t.id === id)?.matched) return;
    setSelectedTerm(id);
  };

  const handleDefClick = (defId: string) => {
    const def = defs.find((d) => d.id === defId);
    if (!def || def.matched || !selectedTerm) return;

    const term = terms.find((t) => t.id === selectedTerm);
    if (!term) return;

    setMoves((m) => m + 1);
    const isMatch = term.pairId === def.pairId;

    if (isMatch) {
      setCorrect((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      setTerms((prev) => prev.map((t) => (t.id === selectedTerm ? { ...t, matched: true, animating: "correct" } : t)));
      setDefs((prev) => prev.map((d) => (d.id === defId ? { ...d, matched: true, animating: "correct" } : d)));

      // Auto-select next unmatched term
      const nextTerm = terms.find((t) => !t.matched && t.id !== selectedTerm);
      setSelectedTerm(nextTerm ? nextTerm.id : null);

      if (correct + 1 === pairs.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => setDone(true), 600);
      }
    } else {
      setStreak(0);
      setMistakes((prev) => [
        ...prev,
        { questionText: term.text, correctAnswer: defs.find((d) => d.pairId === term.pairId)?.text || "", userAnswer: def.text },
      ]);

      setTerms((prev) => prev.map((t) => (t.id === selectedTerm ? { ...t, animating: "wrong" } : t)));
      setDefs((prev) => prev.map((d) => (d.id === defId ? { ...d, animating: "wrong" } : d)));

      setTimeout(() => {
        setTerms((prev) => prev.map((t) => ({ ...t, animating: null })));
        setDefs((prev) => prev.map((d) => ({ ...d, animating: null })));
      }, 500);
    }
  };

  if (pairs.length < MIN_PAIRS) {
    return (
      <GameShell title="Match Up" onExit={onClose}>
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <p className="text-sm font-bold text-[#49372D] dark:text-[#F2EEE6] mb-4">
            Need at least 3 flashcards in this subject to play Match Up.
          </p>
          <button onClick={onClose} className="btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
            Back to Arcade
          </button>
        </div>
      </GameShell>
    );
  }

  if (done) {
    const xpEarned = correct * 5 + (accuracy >= 80 ? 25 : 10);
    const result: GameResult = {
      accuracy,
      score: correct * 100 + bestStreak * 20,
      streak: bestStreak,
      durationSeconds: elapsed,
      mistakes,
    };

    return (
      <GameShell title="Match Up" onExit={onClose}>
        <GameResultReport
          title="Match Up Certified"
          score={result.score}
          accuracy={accuracy}
          streak={bestStreak}
          xp={xpEarned}
          isPersonalBest={bestStreak >= 4}
          onPlayAgain={initGame}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  const activeTermObj = terms.find((t) => t.id === selectedTerm);

  return (
    <GameShell
      title="Match Up"
      badge="Matching"
      onExit={onClose}
      progressPercent={progressPercent}
      metrics={[
        { label: "Time", value: formatTime(elapsed), icon: <Clock className="w-3.5 h-3.5 text-[#B77A45]" /> },
        { label: "Moves", value: moves },
        { label: "Streak", value: `×${streak}`, highlight: streak > 1 },
        { label: "Accuracy", value: `${accuracy}%` },
      ]}
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* DESKTOP & TABLET: 2-column Match Layout (sm and up) */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4">
          {/* Terms Column */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#756C64] dark:text-[#9E9186]">
                Academic Terms ({terms.filter((t) => !t.matched).length} remaining)
              </span>
            </div>
            {terms.map((card) => {
              const isSelected = selectedTerm === card.id;
              if (card.matched) {
                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-lg border border-dashed border-[#D6CCBF] dark:border-[#3D322B] bg-[#EAE3D8]/30 dark:bg-[#2E2520]/30 min-h-[58px] flex items-center justify-center opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#3D6B4F]" />
                  </div>
                );
              }

              return (
                <button
                  key={card.id}
                  onClick={() => handleTermClick(card.id)}
                  className={clsx(
                    "p-3 rounded-lg border text-sm font-semibold text-left transition-all duration-150 min-h-[58px] flex items-center justify-between touch-target",
                    card.animating === "wrong" && "animate-shake bg-[#FBEBEB] border-[#B84A39] text-[#B84A39]",
                    card.animating === "correct" && "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F]",
                    isSelected
                      ? "bg-[#FFFCF6] dark:bg-[#2B231E] border-2 border-[#B77A45] shadow-xs text-[#332821] dark:text-[#F2EEE6]"
                      : "bg-[#F7F3EA] dark:bg-[#221B17] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#805B43] text-[#49372D] dark:text-[#F2EEE6]"
                  )}
                >
                  <span className="line-clamp-2">{card.text}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-[#B77A45]" />}
                </button>
              );
            })}
          </div>

          {/* Definitions Column */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#756C64] dark:text-[#9E9186]">
                Definitions & Explanations
              </span>
            </div>
            {defs.map((card) => {
              if (card.matched) {
                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-lg border border-dashed border-[#D6CCBF] dark:border-[#3D322B] bg-[#EAE3D8]/30 dark:bg-[#2E2520]/30 min-h-[58px] flex items-center justify-center opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#3D6B4F]" />
                  </div>
                );
              }

              return (
                <button
                  key={card.id}
                  onClick={() => handleDefClick(card.id)}
                  disabled={!selectedTerm}
                  className={clsx(
                    "p-3 rounded-lg border text-xs sm:text-sm font-medium text-left transition-all duration-150 min-h-[58px] flex items-center touch-target",
                    card.animating === "wrong" && "animate-shake bg-[#FBEBEB] border-[#B84A39] text-[#B84A39]",
                    card.animating === "correct" && "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F]",
                    !selectedTerm
                      ? "opacity-60 cursor-not-allowed bg-[#F7F3EA] dark:bg-[#221B17] border-[#D6CCBF] dark:border-[#3D322B]"
                      : "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#B77A45] hover:bg-[#F2EEE6] text-[#29231F] dark:text-[#F2EEE6]"
                  )}
                >
                  <span className="line-clamp-3">{card.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MOBILE LAYOUT (<640px): Dedicated Term Focus Card + Stacked Definition Options */}
        <div className="sm:hidden flex flex-col gap-4">
          {/* Active Term Focus Card */}
          <div className="p-4 rounded-xl border-2 border-[#B77A45] bg-[#FFFCF6] dark:bg-[#2B231E] shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#B77A45] block mb-1">
              Active Concept to Match
            </span>
            <h3 className="text-base font-serif font-black text-[#332821] dark:text-[#F2EEE6]">
              {activeTermObj ? activeTermObj.text : "Select a term below"}
            </h3>
          </div>

          {/* Quick Term Selector Tabs if user wants to switch which term they're solving */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {terms
              .filter((t) => !t.matched)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerm(t.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap border shrink-0 transition-colors",
                    selectedTerm === t.id
                      ? "bg-[#49372D] text-[#F7F3EA] border-[#49372D]"
                      : "bg-[#F7F3EA] text-[#756C64] border-[#D6CCBF]"
                  )}
                >
                  {t.text}
                </button>
              ))}
          </div>

          {/* Stacked Definition Choices */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#756C64] dark:text-[#9E9186] block">
              Choose the Matching Definition:
            </span>
            {defs
              .filter((d) => !d.matched)
              .map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleDefClick(card.id)}
                  className={clsx(
                    "w-full p-3 rounded-lg border text-left text-xs font-medium transition-all min-h-[50px] flex items-center touch-target",
                    card.animating === "wrong" && "animate-shake bg-[#FBEBEB] border-[#B84A39] text-[#B84A39]",
                    card.animating === "correct" && "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F]",
                    "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] active:bg-[#EAE3D8] text-[#29231F] dark:text-[#F2EEE6]"
                  )}
                >
                  {card.text}
                </button>
              ))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
