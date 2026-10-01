"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Trophy,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Flag,
  Flame,
  Award,
} from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";
import { Character } from "@/components/ui/character";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { useSettingsStore } from "@/lib/store/use-settings-store";

interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface StudyRaceProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface Racer {
  id: string;
  name: string;
  avatarId: "pip" | "milo" | "lumi" | "barnaby" | "toby" | "zara";
  distance: number; // 0 to 100
  isPlayer: boolean;
  laneColor: string;
}

export function StudyRace({
  cards,
  questions = [],
  subjectId,
  onClose,
  onComplete,
}: StudyRaceProps) {
  const { selectedAvatarId, avatarAccessory, addStudyPoints } = useSettingsStore();

  const isAnimal =
    selectedAvatarId === "pip" ||
    selectedAvatarId === "milo" ||
    selectedAvatarId === "lumi" ||
    selectedAvatarId === "barnaby" ||
    selectedAvatarId === "toby" ||
    selectedAvatarId === "zara";

  const playerAvatar = (isAnimal ? selectedAvatarId : "pip") as any;

  // Prepare race items
  const raceItems = React.useMemo(() => {
    const list: Array<{ prompt: string; answer: string; options: string[] }> = [];

    // Add cards
    cards.forEach((c) => {
      const wrongOptions = cards
        .filter((other) => other.id !== c.id)
        .map((other) => other.back)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const allOptions = [c.back, ...wrongOptions].sort(() => 0.5 - Math.random());

      list.push({
        prompt: c.front,
        answer: c.back,
        options: allOptions.length >= 2 ? allOptions : [c.back, "Incorrect alternative"],
      });
    });

    // Add questions if available
    questions.forEach((q) => {
      list.push({
        prompt: q.question,
        answer: q.correctAnswer,
        options: q.options || [q.correctAnswer, "Option B", "Option C"],
      });
    });

    return list.sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [cards, questions]);

  // Racers state
  const [racers, setRacers] = useState<Racer[]>([
    {
      id: "player",
      name: "You",
      avatarId: playerAvatar,
      distance: 0,
      isPlayer: true,
      laneColor: "border-blue-500 bg-blue-500/10",
    },
    {
      id: "zara",
      name: "Zara the Quokka",
      avatarId: "zara",
      distance: 0,
      isPlayer: false,
      laneColor: "border-pink-500 bg-pink-500/10",
    },
    {
      id: "milo",
      name: "Milo the Capybara",
      avatarId: "milo",
      distance: 0,
      isPlayer: false,
      laneColor: "border-amber-500 bg-amber-500/10",
    },
    {
      id: "barnaby",
      name: "Barnaby the Otter",
      avatarId: "barnaby",
      distance: 0,
      isPlayer: false,
      laneColor: "border-emerald-500 bg-emerald-500/10",
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<
    Array<{ questionText: string; correctAnswer: string; userAnswer: string }>
  >([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [turboActive, setTurboActive] = useState(false);

  const currentItem = raceItems[currentIndex] || raceItems[0];

  // AI rival progression interval
  useEffect(() => {
    if (raceFinished) return;

    const interval = setInterval(() => {
      setRacers((prev) => {
        let finished = false;
        const updated = prev.map((r) => {
          if (r.isPlayer) return r;
          // Random rival advancement: 20% chance of +8m to +15m
          const advanceChance = Math.random();
          let newDist = r.distance;
          if (advanceChance > 0.45) {
            newDist = Math.min(100, r.distance + Math.floor(Math.random() * 8) + 6);
          }
          if (newDist >= 100) finished = true;
          return { ...r, distance: newDist };
        });

        if (finished) {
          setRaceFinished(true);
        }
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [raceFinished]);

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked || raceFinished) return;
    setSelectedOption(opt);
    setIsAnswerChecked(true);

    const isCorrect = opt === currentItem.answer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const newStreak = playerStreak + 1;
      setPlayerStreak(newStreak);

      const boost = newStreak >= 2 ? 26 : 20;
      if (newStreak >= 2) setTurboActive(true);

      // Advance player racer
      setRacers((prev) => {
        const updated = prev.map((r) => {
          if (!r.isPlayer) return r;
          const nextDist = Math.min(100, r.distance + boost);
          if (nextDist >= 100) {
            setTimeout(() => setRaceFinished(true), 300);
          }
          return { ...r, distance: nextDist };
        });
        return updated;
      });
    } else {
      setPlayerStreak(0);
      setTurboActive(false);
      setMistakesList((prev) => [
        ...prev,
        {
          questionText: currentItem.prompt,
          correctAnswer: currentItem.answer,
          userAnswer: opt,
        },
      ]);
    }

    // Auto next question after 800ms
    setTimeout(() => {
      setTurboActive(false);
      if (currentIndex + 1 < raceItems.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setRaceFinished(true);
      }
    }, 900);
  };

  // Rank calculation
  const sortedRacers = [...racers].sort((a, b) => b.distance - a.distance);
  const playerRank = sortedRacers.findIndex((r) => r.isPlayer) + 1;

  const handleFinish = () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const accuracy = raceItems.length > 0 ? Math.round((correctCount / raceItems.length) * 100) : 100;
    const score = correctCount * 120 + (playerRank === 1 ? 250 : playerRank === 2 ? 150 : 50);

    addStudyPoints(playerRank === 1 ? 50 : 25);

    onComplete({
      accuracy,
      score,
      streak: playerStreak,
      durationSeconds: duration,
      mistakes: mistakesList,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-surface rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-border bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-black tracking-tight">Study Race Track</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-widest">
              100M Sprint
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content Body */}
        {!raceFinished ? (
          <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Visual Race Track */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-inner flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1 border-b border-slate-800 pb-1">
                <span>START</span>
                <span>25M</span>
                <span>50M</span>
                <span>75M</span>
                <span className="flex items-center gap-1 text-amber-400 font-black">
                  <Flag className="w-3 h-3" /> FINISH
                </span>
              </div>

              {/* 4 Lanes */}
              <div className="space-y-2.5">
                {racers.map((racer) => (
                  <div key={racer.id} className="relative flex items-center">
                    {/* Lane track line */}
                    <div className="w-full h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 relative overflow-hidden flex items-center px-2">
                      {/* Distance progress fill */}
                      <div
                        className={clsx(
                          "absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-20",
                          racer.isPlayer ? "bg-blue-500" : "bg-slate-400"
                        )}
                        style={{ width: `${racer.distance}%` }}
                      />

                      {/* Moving Animal Avatar */}
                      <div
                        className="absolute transition-all duration-500 ease-out flex items-center gap-1.5"
                        style={{ left: `calc(${racer.distance}% * 0.85)` }}
                      >
                        <AnimalAvatar
                          avatarId={racer.avatarId}
                          accessory={racer.isPlayer ? avatarAccessory : "none"}
                          size="xs"
                          showBorder={true}
                        />
                        <span
                          className={clsx(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap",
                            racer.isPlayer
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-200"
                          )}
                        >
                          {racer.name} {racer.distance}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Player Status / Turbo indicator */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 font-semibold">
                  Current Rank: <strong className="text-white">#{playerRank}</strong>
                </span>
                {turboActive && (
                  <div className="flex items-center gap-1 text-amber-400 font-black animate-bounce text-xs">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    <span>TURBO SPRINT BOOST!</span>
                  </div>
                )}
                {playerStreak > 1 && (
                  <div className="flex items-center gap-1 text-orange-400 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{playerStreak}x Combo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Question / Flashcard prompt */}
            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Question {currentIndex + 1} of {raceItems.length} — Answer to Sprint!
              </span>
              <p className="text-sm font-bold text-foreground leading-snug">
                {currentItem.prompt}
              </p>
            </div>

            {/* Multiple Choice Options (Tactile Buttons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentItem.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentItem.answer;

                let btnStyle = "bg-surface hover:bg-surface-muted text-foreground border-slate-300 dark:border-slate-700 border-b-slate-400";

                if (isAnswerChecked) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-600 text-white border-emerald-800";
                  } else if (isSelected) {
                    btnStyle = "bg-rose-600 text-white border-rose-800";
                  } else {
                    btnStyle = "opacity-40 bg-surface text-foreground border-slate-300";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => handleSelectOption(opt)}
                    className={clsx(
                      "btn-tactile p-3 rounded-2xl border text-left text-xs font-bold transition-all shadow-xs flex items-center justify-between",
                      btnStyle
                    )}
                  >
                    <span>{opt}</span>
                    {isAnswerChecked && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {isAnswerChecked && isSelected && !isCorrect && (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= FINISH PODIUM SCREEN ================= */
          <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-4 animate-fade-in overflow-y-auto">
            <Character
              character={playerAvatar}
              expression={playerRank === 1 ? "celebrating" : "happy"}
              size="lg"
              speechBubble={
                playerRank === 1
                  ? "VICTORY! First place on the track!"
                  : `Great race! You finished in rank #${playerRank}!`
              }
              bubblePosition="top"
            />

            <div>
              <h2 className="text-2xl font-black text-foreground">
                {playerRank === 1 ? "1st Place Winner! 🏆" : `Race Completed — #${playerRank}`}
              </h2>
              <p className="text-xs text-muted-text mt-1">
                You sprinted with deliberate recall! Study Points added to your balance.
              </p>
            </div>

            {/* Score & Accuracy Card */}
            <div className="w-full max-w-sm grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-surface-muted border border-border">
              <div>
                <span className="text-[10px] text-muted-text font-bold uppercase">Accuracy</span>
                <div className="text-lg font-black text-blue-600">
                  {Math.round((correctCount / Math.max(1, raceItems.length)) * 100)}%
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-text font-bold uppercase">Rank</span>
                <div className="text-lg font-black text-amber-500">#{playerRank}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-text font-bold uppercase">Points</span>
                <div className="text-lg font-black text-emerald-600">
                  +{playerRank === 1 ? 50 : 25} SP
                </div>
              </div>
            </div>

            {/* Podium Placement List */}
            <div className="w-full max-w-sm space-y-1.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
                Final Leaderboard:
              </span>
              {sortedRacers.map((racer, idx) => (
                <div
                  key={racer.id}
                  className={clsx(
                    "flex items-center justify-between p-2 rounded-xl border text-xs font-bold",
                    racer.isPlayer
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                      : "bg-surface border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-black">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "4th"}
                    </span>
                    <AnimalAvatar avatarId={racer.avatarId} size="xs" />
                    <span>{racer.name}</span>
                  </div>
                  <span>{racer.distance}m</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="btn-tactile w-full max-w-sm py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm border-blue-800 shadow-md mt-2"
            >
              Collect Rewards & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyRace;
