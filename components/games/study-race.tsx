"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Trophy,
  Zap,
  Flag,
  Flame,
  Clock,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import { Flashcard, QuizQuestion } from "@/lib/types";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { GameShell, GameResultReport } from "./game-shell";

export interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: Array<{ questionText: string; correctAnswer: string; userAnswer: string }>;
}

interface StudyRaceProps {
  cards: Flashcard[];
  questions?: QuizQuestion[];
  subjectId?: string;
  onClose: () => void;
  onComplete: (result: GameResult) => void;
}

interface Racer {
  id: string;
  name: string;
  avatarId: "pip" | "milo" | "lumi" | "barnaby" | "toby" | "zara";
  distance: number; // 0 to 100
  isPlayer: boolean;
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
  const raceItems = useMemo(() => {
    const list: Array<{ prompt: string; answer: string; options: string[] }> = [];

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
        options: allOptions.length >= 2 ? allOptions : [c.back, "Alternative option"],
      });
    });

    questions.forEach((q) => {
      list.push({
        prompt: q.question,
        answer: q.correctAnswer,
        options: q.options || [q.correctAnswer, "Option B", "Option C"],
      });
    });

    return list.sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [cards, questions]);

  const [racers, setRacers] = useState<Racer[]>([
    { id: "player", name: "You", avatarId: playerAvatar, distance: 0, isPlayer: true },
    { id: "ai_1", name: "Pip", avatarId: "pip", distance: 0, isPlayer: false },
    { id: "ai_2", name: "Milo", avatarId: "milo", distance: 0, isPlayer: false },
    { id: "ai_3", name: "Lumi", avatarId: "lumi", distance: 0, isPlayer: false },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [turboActive, setTurboActive] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<GameResult["mistakes"]>([]);
  const [startTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Background CPU racer advance
  useEffect(() => {
    if (raceFinished) return;

    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);

      setRacers((prev) =>
        prev.map((r) => {
          if (r.isPlayer) return r;
          const cpuAdvance = Math.random() < 0.6 ? Math.floor(Math.random() * 4) + 1 : 0;
          const newDist = Math.min(100, r.distance + cpuAdvance);
          return { ...r, distance: newDist };
        })
      );
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [raceFinished]);

  const currentItem = raceItems[currentIndex] || {
    prompt: "Ready to race?",
    answer: "Yes",
    options: ["Yes", "Ready"],
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswerChecked || raceFinished) return;

    setSelectedOption(option);
    setIsAnswerChecked(true);

    const isCorrect = option === currentItem.answer;

    if (isCorrect) {
      const newStreak = playerStreak + 1;
      setPlayerStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setCorrectCount((c) => c + 1);

      const isTurbo = newStreak >= 3;
      setTurboActive(isTurbo);

      const boost = isTurbo ? 22 : 14;

      setRacers((prev) =>
        prev.map((r) => {
          if (!r.isPlayer) return r;
          const newDist = Math.min(100, r.distance + boost);
          if (newDist >= 100) setRaceFinished(true);
          return { ...r, distance: newDist };
        })
      );
    } else {
      setPlayerStreak(0);
      setTurboActive(false);

      setMistakesList((prev) => [
        ...prev,
        {
          questionText: currentItem.prompt,
          correctAnswer: currentItem.answer,
          userAnswer: option,
        },
      ]);
    }

    setTimeout(() => {
      if (currentIndex + 1 < raceItems.length && !raceFinished) {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setRaceFinished(true);
      }
    }, 800);
  };

  const sortedRacers = [...racers].sort((a, b) => b.distance - a.distance);
  const playerRank = sortedRacers.findIndex((r) => r.isPlayer) + 1;
  const playerDist = racers.find((r) => r.isPlayer)?.distance || 0;

  const restartRace = () => {
    setRacers([
      { id: "player", name: "You", avatarId: playerAvatar, distance: 0, isPlayer: true },
      { id: "ai_1", name: "Pip", avatarId: "pip", distance: 0, isPlayer: false },
      { id: "ai_2", name: "Milo", avatarId: "milo", distance: 0, isPlayer: false },
      { id: "ai_3", name: "Lumi", avatarId: "lumi", distance: 0, isPlayer: false },
    ]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setRaceFinished(false);
    setPlayerStreak(0);
    setCorrectCount(0);
    setMistakesList([]);
    setElapsed(0);
  };

  if (raceFinished) {
    const accuracy = raceItems.length > 0 ? Math.round((correctCount / raceItems.length) * 100) : 100;
    const score = correctCount * 120 + (playerRank === 1 ? 250 : playerRank === 2 ? 150 : 50);
    const xpReward = playerRank === 1 ? 50 : 25;
    addStudyPoints(xpReward);

    const result: GameResult = {
      accuracy,
      score,
      streak: bestStreak,
      durationSeconds: elapsed,
      mistakes: mistakesList,
    };

    return (
      <GameShell title="Study Race Track" onExit={onClose}>
        <GameResultReport
          title={playerRank === 1 ? "1st Place Winner! 🏆" : `Finished Rank #${playerRank}`}
          score={score}
          accuracy={accuracy}
          streak={bestStreak}
          xp={xpReward}
          isPersonalBest={playerRank === 1}
          onPlayAgain={restartRace}
          onComplete={() => onComplete(result)}
          onClose={onClose}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Study Race Track"
      badge="Sprint Challenge"
      onExit={onClose}
      progressPercent={playerDist}
      metrics={[
        { label: "Rank", value: `#${playerRank}`, highlight: playerRank === 1 },
        { label: "Streak", value: `×${playerStreak}`, highlight: playerStreak > 1 },
        { label: "Question", value: `${currentIndex + 1}/${raceItems.length}` },
      ]}
    >
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
        {/* Race Track Arena */}
        <div className="p-3 sm:p-5 rounded-xl bg-[#221B17] border border-[#3D322B] text-[#F2EEE6] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#9E9186] font-bold px-1 border-b border-[#3D322B] pb-1.5">
            <span>START</span>
            <span>25M</span>
            <span>50M</span>
            <span>75M</span>
            <span className="flex items-center gap-1 text-[#D79A45] font-black">
              <Flag className="w-3 h-3" /> FINISH
            </span>
          </div>

          {/* 4 Lanes */}
          <div className="space-y-2">
            {racers.map((racer) => (
              <div key={racer.id} className="relative flex items-center">
                <div className="w-full h-8 rounded-md bg-[#2B231E] border border-[#3D322B] relative overflow-hidden flex items-center px-1.5">
                  <div
                    className={clsx(
                      "absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-25",
                      racer.isPlayer ? "bg-[#B77A45]" : "bg-[#756C64]"
                    )}
                    style={{ width: `${racer.distance}%` }}
                  />

                  <div
                    className="absolute transition-all duration-500 ease-out flex items-center gap-1.5"
                    style={{ left: `calc(${Math.min(92, racer.distance)}% * 0.9)` }}
                  >
                    <AnimalAvatar
                      avatarId={racer.avatarId}
                      accessory={racer.isPlayer ? avatarAccessory : "none"}
                      size="xs"
                      showBorder={true}
                    />
                    <span
                      className={clsx(
                        "text-[9px] font-bold px-1 py-0.2 rounded shadow-xs whitespace-nowrap",
                        racer.isPlayer
                          ? "bg-[#B77A45] text-white"
                          : "bg-[#3D322B] text-[#9E9186]"
                      )}
                    >
                      {racer.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {turboActive && (
            <div className="flex items-center gap-1 text-[#D79A45] font-black text-xs self-end animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>TURBO BOOST ACTIVE!</span>
            </div>
          )}
        </div>

        {/* Current Question / Prompt */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#B77A45] block mb-1">
            Question {currentIndex + 1} of {raceItems.length} — Answer to Sprint!
          </span>
          <p className="text-sm sm:text-base font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
            {currentItem.prompt}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentItem.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = isAnswerChecked && opt === currentItem.answer;
            const isWrong = isAnswerChecked && isSelected && opt !== currentItem.answer;

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(opt)}
                disabled={isAnswerChecked}
                className={clsx(
                  "p-3 rounded-lg border text-xs sm:text-sm font-semibold text-left transition-all duration-150 min-h-[50px] flex items-center justify-between touch-target",
                  isCorrect && "bg-[#EBF3ED] border-[#3D6B4F] text-[#3D6B4F]",
                  isWrong && "bg-[#FBEBEB] border-[#B84A39] text-[#B84A39]",
                  !isAnswerChecked && isSelected && "border-[#B77A45] bg-[#EAE3D8]",
                  !isAnswerChecked && !isSelected && "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#B77A45] hover:bg-[#F2EEE6] text-[#29231F] dark:text-[#F2EEE6]"
                )}
              >
                <span>{opt}</span>
                {isCorrect && <span className="text-xs font-bold text-[#3D6B4F]">✓ Sprint!</span>}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
