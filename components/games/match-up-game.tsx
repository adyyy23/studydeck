"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Clock, Shuffle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";

export interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface MatchUpGameProps {
  cards: Flashcard[];
  questions: QuizQuestion[];
  subjectId: string;
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
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (pairs.length < MIN_PAIRS) return;
    const t: MatchCard[] = shuffle(
      pairs.map((c) => ({ id: `t_${c.id}`, pairId: c.id, text: c.front, side: "term" as const, matched: false, animating: null }))
    );
    const d: MatchCard[] = shuffle(
      pairs.map((c) => ({ id: `d_${c.id}`, pairId: c.id, text: c.back, side: "def" as const, matched: false, animating: null }))
    );
    setTerms(t);
    setDefs(d);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const accuracy = moves === 0 ? 100 : Math.round((correct / moves) * 100);

  const handleTermClick = (id: string) => {
    if (terms.find((t) => t.id === id)?.matched) return;
    setSelectedTerm(id);
  };

  const handleDefClick = useCallback((defId: string) => {
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
      setBestStreak((b) => Math.max(b, newStreak));

      // Animate correct then remove
      setTerms((prev) => prev.map((t) => t.id === selectedTerm ? { ...t, animating: "correct" } : t));
      setDefs((prev) => prev.map((d) => d.id === defId ? { ...d, animating: "correct" } : d));

      setTimeout(() => {
        setTerms((prev) => prev.map((t) => t.id === selectedTerm ? { ...t, matched: true, animating: null } : t));
        setDefs((prev) => prev.map((d) => d.id === defId ? { ...d, matched: true, animating: null } : d));
      }, 350);
    } else {
      setStreak(0);
      setMistakes((m) => [...m, { questionText: term.text, correctAnswer: def.text, userAnswer: def.text }]);
      setTerms((prev) => prev.map((t) => t.id === selectedTerm ? { ...t, animating: "wrong" } : t));
      setDefs((prev) => prev.map((d) => d.id === defId ? { ...d, animating: "wrong" } : d));
      setTimeout(() => {
        setTerms((prev) => prev.map((t) => t.id === selectedTerm ? { ...t, animating: null } : t));
        setDefs((prev) => prev.map((d) => d.id === defId ? { ...d, animating: null } : d));
      }, 450);
    }

    setSelectedTerm(null);
  }, [defs, terms, selectedTerm, streak]);

  // Check completion
  useEffect(() => {
    if (terms.length > 0 && terms.every((t) => t.matched) && !done) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
    }
  }, [terms, done]);

  if (pairs.length < MIN_PAIRS) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Need at least 3 flashcards</p>
        <p className="text-sm mt-2" style={{ color: "var(--muted-text)" }}>Add more flashcards to this subject to play Match Up.</p>
        <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Close</button>
      </div>
    );
  }

  if (done) {
    const result: GameResult = { accuracy, score: correct * 10, streak: bestStreak, durationSeconds: elapsed, mistakes };
    return <MatchUpResult accuracy={accuracy} moves={moves} elapsed={elapsed} bestStreak={bestStreak} onPlayAgain={() => window.location.reload()} onComplete={() => onComplete(result)} onClose={onClose} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
          <X size={18} style={{ color: "var(--muted-text)" }} />
        </button>
        <div className="flex items-center gap-4 text-sm font-medium" style={{ color: "var(--muted-text)" }}>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {formatTime(elapsed)}
          </span>
          <span>Moves: <strong style={{ color: "var(--foreground)" }}>{moves}</strong></span>
          <span>Accuracy: <strong style={{ color: "var(--foreground)" }}>{accuracy}%</strong></span>
        </div>
        <div className="w-8" />
      </div>

      {/* Game area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {/* Terms column */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: "var(--muted-text)" }}>Terms</p>
            {terms.map((card) => (
              <button
                key={card.id}
                onClick={() => handleTermClick(card.id)}
                disabled={card.matched}
                className={clsx(
                  "p-3 rounded-xl border-2 text-sm font-medium text-center transition-all duration-200 min-h-[64px] flex items-center justify-center",
                  card.animating === "wrong" && "shake",
                  card.matched && "opacity-0 pointer-events-none",
                  selectedTerm === card.id && "ring-2"
                )}
                style={{
                  borderColor: selectedTerm === card.id ? "var(--accent)" : card.animating === "correct" ? "#16a34a" : "var(--border)",
                  background: selectedTerm === card.id ? "var(--accent-light)" : card.animating === "correct" ? "#dcfce7" : "var(--surface)",
                  color: "var(--foreground)",
                  boxShadow: selectedTerm === card.id ? "0 0 0 3px var(--accent-light)" : "none",
                  transition: card.matched ? "opacity 0.3s ease" : "all 0.2s ease",
                }}
              >
                {card.text}
              </button>
            ))}
          </div>

          {/* Definitions column */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: "var(--muted-text)" }}>Definitions</p>
            {defs.map((card) => (
              <button
                key={card.id}
                onClick={() => handleDefClick(card.id)}
                disabled={card.matched || !selectedTerm}
                className={clsx(
                  "p-3 rounded-xl border-2 text-sm text-center transition-all duration-200 min-h-[64px] flex items-center justify-center",
                  card.animating === "wrong" && "shake",
                  card.matched && "opacity-0 pointer-events-none",
                  !selectedTerm && "cursor-default"
                )}
                style={{
                  borderColor: card.animating === "correct" ? "#16a34a" : "var(--border)",
                  background: card.animating === "correct" ? "#dcfce7" : card.matched ? "transparent" : "var(--surface)",
                  color: "var(--foreground)",
                  transition: card.matched ? "opacity 0.3s ease" : "all 0.15s ease",
                }}
              >
                {card.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchUpResult({ accuracy, moves, elapsed, bestStreak, onPlayAgain, onComplete, onClose }: {
  accuracy: number; moves: number; elapsed: number; bestStreak: number;
  onPlayAgain: () => void; onComplete: () => void; onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ background: "var(--background)" }}>
      {/* Star burst SVG */}
      <div className="bounce-in mb-4">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="28" fill="var(--accent-light)" />
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <line key={i} x1="40" y1="40"
              x2={40 + 38 * Math.cos((deg * Math.PI) / 180)}
              y2={40 + 38 * Math.sin((deg * Math.PI) / 180)}
              stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
            />
          ))}
          <text x="40" y="46" textAnchor="middle" fontSize="24" fill="var(--accent)">✓</text>
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>MATCH UP COMPLETE</h2>
      <p className="text-sm mb-6" style={{ color: "var(--muted-text)" }}>All pairs matched!</p>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        {[
          { label: "Time", value: formatTime(elapsed) },
          { label: "Accuracy", value: `${accuracy}%` },
          { label: "Best Streak", value: `×${bestStreak}` },
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
