"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock } from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";

export interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface MemoryMatchGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
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

  useEffect(() => {
    const pairs = sourcePairs.length >= 3 ? sourcePairs : cards.slice(0, 6);
    const memCards: MemCard[] = shuffle([
      ...pairs.map((c) => ({ uid: `t_${c.id}`, pairId: c.id, label: c.front, side: "term" as const, flipped: false, matched: false })),
      ...pairs.map((c) => ({ uid: `d_${c.id}`, pairId: c.id, label: c.back, side: "def" as const, flipped: false, matched: false })),
    ]);
    setGrid(memCards);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleCardClick = useCallback((uid: string) => {
    if (locked) return;
    const card = grid.find((c) => c.uid === uid);
    if (!card || card.matched || card.flipped) return;
    if (flippedIds.length === 1 && flippedIds[0] === uid) return;

    const newFlipped = [...flippedIds, uid];
    setGrid((prev) => prev.map((c) => c.uid === uid ? { ...c, flipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      setAttempts((a) => a + 1);
      const [id1, id2] = newFlipped;
      const c1 = grid.find((c) => c.uid === id1)!;
      const c2 = { ...card, uid };

      if (c1.pairId === c2.pairId && c1.uid !== c2.uid) {
        // Match!
        setTimeout(() => {
          setGrid((prev) => prev.map((c) =>
            c.uid === id1 || c.uid === id2 ? { ...c, matched: true } : c
          ));
          setPairsFound((p) => p + 1);
          setFlippedIds([]);
          setLocked(false);
        }, 500);
      } else {
        // No match — flip back after 800ms
        setTimeout(() => {
          setGrid((prev) => prev.map((c) =>
            c.uid === id1 || c.uid === id2 ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [grid, flippedIds, locked]);

  useEffect(() => {
    if (grid.length > 0 && grid.every((c) => c.matched) && !done) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
    }
  }, [grid, done]);

  const totalPairs = sourcePairs.length >= 3 ? Math.min(sourcePairs.length, PAIR_COUNT) : Math.min(cards.length, PAIR_COUNT);
  const accuracy = attempts === 0 ? 100 : Math.round((pairsFound / attempts) * 100);

  if (done) {
    const result: GameResult = { accuracy, score: pairsFound * 20, streak: pairsFound, durationSeconds: elapsed, mistakes: [] };
    return <MemoryResult pairsFound={pairsFound} totalPairs={totalPairs} attempts={attempts} elapsed={elapsed} onComplete={() => onComplete(result)} onClose={onClose} />;
  }

  // 4 columns × 3 rows grid
  const cols = 4;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
          <X size={18} style={{ color: "var(--muted-text)" }} />
        </button>
        <div className="flex items-center gap-4 text-sm font-medium" style={{ color: "var(--muted-text)" }}>
          <span className="flex items-center gap-1.5"><Clock size={14} />{formatTime(elapsed)}</span>
          <span>Pairs: <strong style={{ color: "var(--foreground)" }}>{pairsFound}/{totalPairs}</strong></span>
          <span>Attempts: <strong style={{ color: "var(--foreground)" }}>{attempts}</strong></span>
        </div>
        <div className="w-8" />
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="grid gap-3 w-full max-w-lg"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {grid.map((card) => (
            <div
              key={card.uid}
              className="memory-card"
              style={{ height: "80px", cursor: card.matched ? "default" : "pointer" }}
              onClick={() => handleCardClick(card.uid)}
            >
              <div className={clsx("memory-card-inner", (card.flipped || card.matched) && "flipped")}>
                {/* Front face — question mark */}
                <div
                  className="memory-card-face"
                  style={{ background: "var(--surface-muted)", border: "2px solid var(--border)" }}
                >
                  <span className="text-2xl" style={{ color: "var(--muted-text)" }}>?</span>
                </div>
                {/* Back face — content */}
                <div
                  className="memory-card-face memory-card-back-face text-xs font-medium p-2 text-center leading-tight"
                  style={{
                    background: card.matched ? "#dcfce7" : card.side === "term" ? "var(--accent-light)" : "var(--surface)",
                    border: `2px solid ${card.matched ? "#16a34a" : card.side === "term" ? "var(--accent)" : "var(--border)"}`,
                    color: card.matched ? "#15803d" : "var(--foreground)",
                    overflow: "hidden",
                  }}
                >
                  <span className="block" style={{ fontSize: "10px", color: card.side === "term" ? "var(--accent)" : "var(--muted-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {card.side === "term" ? "Term" : "Def"}
                  </span>
                  <span className="line-clamp-3">{card.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryResult({ pairsFound, totalPairs, attempts, elapsed, onComplete, onClose }: {
  pairsFound: number; totalPairs: number; attempts: number; elapsed: number;
  onComplete: () => void; onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ background: "var(--background)" }}>
      <div className="bounce-in mb-4">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="28" fill="#dcfce7" />
          {[0,60,120,180,240,300].map((deg, i) => (
            <line key={i} x1="40" y1="40"
              x2={40 + 36 * Math.cos((deg * Math.PI) / 180)}
              y2={40 + 36 * Math.sin((deg * Math.PI) / 180)}
              stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
            />
          ))}
          <text x="40" y="47" textAnchor="middle" fontSize="22" fill="#16a34a">🃏</text>
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Memory Clear!</h2>
      <p className="text-sm mb-6" style={{ color: "var(--muted-text)" }}>All pairs matched</p>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        {[
          { label: "Pairs", value: `${pairsFound}/${totalPairs}` },
          { label: "Time", value: formatTime(elapsed) },
          { label: "Attempts", value: attempts },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--muted-text)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button onClick={onComplete} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: "var(--accent)" }}>
          Continue
        </button>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl font-medium text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted-text)" }}>
          Back to Games
        </button>
      </div>
    </div>
  );
}
