"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock } from "lucide-react";
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

interface MemoryMatchGameProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface MemCard {
  uid: string;
  pairId: string;
  label: string;
  side: "term" | "def";
  flipped: boolean;
  matched: boolean;
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

export function MemoryMatchGame({ cards, onClose, onComplete }: MemoryMatchGameProps) {
  const PAIR_COUNT = 6;
  const sourcePairs = cards.slice(0, PAIR_COUNT);

  const [grid, setGrid] = useState<MemCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = useCallback(() => {
    const pairs = sourcePairs.length >= 3 ? sourcePairs : cards.slice(0, 6);
    const memCards: MemCard[] = shuffle([
      ...pairs.map((c) => ({ uid: `t_${c.id}`, pairId: c.id, label: c.front, side: "term" as const, flipped: false, matched: false })),
      ...pairs.map((c) => ({ uid: `d_${c.id}`, pairId: c.id, label: c.back, side: "def" as const, flipped: false, matched: false })),
    ]);
    setGrid(memCards);
    setFlippedIds([]);
    setLocked(false);
    setAttempts(0);
    setPairsFound(0);
    setElapsed(0);
    setDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [sourcePairs, cards]);

  useEffect(() => {
    initGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [initGame]);

  const handleCardClick = (uid: string) => {
    if (locked) return;
    const card = grid.find((c) => c.uid === uid);
    if (!card || card.matched || card.flipped) return;
    if (flippedIds.length === 1 && flippedIds[0] === uid) return;

    const newFlipped = [...flippedIds, uid];
    setGrid((prev) => prev.map((c) => (c.uid === uid ? { ...c, flipped: true } : c)));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      setAttempts((a) => a + 1);
      const [id1, id2] = newFlipped;
      const c1 = grid.find((c) => c.uid === id1)!;
      const c2 = { ...card, uid };

      if (c1.pairId === c2.pairId && c1.uid !== c2.uid) {
        // Matched!
        setTimeout(() => {
          setGrid((prev) =>
            prev.map((c) => (c.uid === id1 || c.uid === id2 ? { ...c, matched: true, flipped: true } : c))
          );
          setFlippedIds([]);
          setLocked(false);
          const newPairsFound = pairsFound + 1;
          setPairsFound(newPairsFound);

          if (newPairsFound === sourcePairs.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => setDone(true), 600);
          }
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setGrid((prev) =>
            prev.map((c) => (c.uid === id1 || c.uid === id2 ? { ...c, flipped: false } : c))
          );
          setFlippedIds([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const totalPairs = sourcePairs.length;
  const progressPercent = totalPairs > 0 ? (pairsFound / totalPairs) * 100 : 0;
  const accuracy = attempts === 0 ? 100 : Math.round((pairsFound / attempts) * 100);

  if (done) {
    const score = Math.max(100, pairsFound * 150 - attempts * 10 - elapsed * 2);
    const xp = pairsFound * 10 + (attempts <= totalPairs * 1.5 ? 20 : 10);
    const result: GameResult = {
      accuracy,
      score,
      streak: pairsFound,
      durationSeconds: elapsed,
      mistakes: [],
    };

    return (
      <GameShell title="Memory Match" onExit={onClose}>
        <GameResultReport
          title="Memory Match Complete"
          score={score}
          accuracy={accuracy}
          streak={pairsFound}
          xp={xp}
          isPersonalBest={attempts <= totalPairs * 1.3}
          onPlayAgain={initGame}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Memory Match"
      badge="Memory Recall"
      onExit={onClose}
      progressPercent={progressPercent}
      metrics={[
        { label: "Time", value: formatTime(elapsed), icon: <Clock className="w-3.5 h-3.5 text-[#B77A45]" /> },
        { label: "Pairs", value: `${pairsFound}/${totalPairs}` },
        { label: "Attempts", value: attempts },
      ]}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
        {/* Memory Grid with Fluid Columns (Adapts from 3 cols on mobile to 4 on desktop) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full">
          {grid.map((card) => {
            const isRevealed = card.flipped || card.matched;

            return (
              <button
                key={card.uid}
                onClick={() => handleCardClick(card.uid)}
                disabled={card.matched || locked}
                className={clsx(
                  "h-24 sm:h-28 rounded-lg border-2 p-2 flex flex-col items-center justify-center text-center transition-all duration-200 select-none touch-target",
                  card.matched
                    ? "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F] opacity-75"
                    : isRevealed
                    ? "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#B77A45] text-[#332821] dark:text-[#F2EEE6] shadow-xs"
                    : "bg-[#EAE3D8] dark:bg-[#2E2520] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#805B43] hover:bg-[#F2EEE6]"
                )}
              >
                {!isRevealed ? (
                  <span className="text-xl font-serif font-black text-[#756C64] dark:text-[#9E9186]">
                    ?
                  </span>
                ) : (
                  <div className="flex flex-col justify-center h-full w-full">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#B77A45] mb-0.5">
                      {card.side === "term" ? "Term" : "Def"}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold line-clamp-3 leading-snug">
                      {card.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
