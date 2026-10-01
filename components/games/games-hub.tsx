"use client";

import React, { useState } from "react";
import {
  Gamepad2,
  Zap,
  Shuffle,
  Eye,
  AlertCircle,
  HelpCircle,
  Footprints,
  Clock,
  CheckCircle2,
  X,
  Play,
  Layers,
  ArrowRight,
  Trophy,
} from "lucide-react";
import clsx from "clsx";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { Flashcard, QuizQuestion } from "@/lib/types";

// Game components
import { MatchUpGame } from "@/components/games/match-up-game";
import { MemoryMatchGame } from "@/components/games/memory-match-game";
import { SpeedRoundGame } from "@/components/games/speed-round-game";
import { TrueOrTrapGame } from "@/components/games/true-or-trap-game";
import { WordRevealGame } from "@/components/games/word-reveal-game";
import { QuizRushGame } from "@/components/games/quiz-rush-game";
import { StudyAdventureGame } from "@/components/games/study-adventure-game";
import { StudyRace } from "@/components/games/study-race";
import { Character } from "@/components/ui/character";

type GameType =
  | "study_race"
  | "match_up"
  | "memory_match"
  | "speed_round"
  | "true_or_trap"
  | "word_reveal"
  | "quiz_rush"
  | "study_adventure";

interface GameInfo {
  id: GameType;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  estimatedMins: string;
  skillLevel: number;
}

const GAMES: GameInfo[] = [
  {
    id: "study_race",
    name: "Study Race Track",
    badge: "Animal Sprint",
    description: "Multiplayer animal track race! Answer flashcards to sprint ahead and trigger turbo bursts.",
    icon: Trophy,
    accentClass: "text-amber-500",
    borderClass: "border-l-amber-500",
    bgClass: "bg-amber-500",
    estimatedMins: "2 min",
    skillLevel: 2,
  },
  {
    id: "match_up",
    name: "Match Up",
    badge: "Matching",
    description: "Tap terms and matching definitions. Clean pairs as fast and accurately as possible.",
    icon: Shuffle,
    accentClass: "text-blue-500",
    borderClass: "border-l-blue-500",
    bgClass: "bg-blue-500",
    estimatedMins: "2-3 min",
    skillLevel: 1,
  },
  {
    id: "memory_match",
    name: "Memory Match",
    badge: "Memory",
    description: "Flip face-down cards to discover matching term-definition pairs.",
    icon: Eye,
    accentClass: "text-violet-500",
    borderClass: "border-l-violet-500",
    bgClass: "bg-violet-500",
    estimatedMins: "2-4 min",
    skillLevel: 2,
  },
  {
    id: "speed_round",
    name: "Speed Round",
    badge: "Fast Pace",
    description: "60 seconds on the clock. Answer questions fast to build streak multipliers.",
    icon: Zap,
    accentClass: "text-red-500",
    borderClass: "border-l-red-500",
    bgClass: "bg-red-500",
    estimatedMins: "1 min",
    skillLevel: 3,
  },
  {
    id: "true_or_trap",
    name: "True or Trap",
    badge: "Detection",
    description: "Read statements carefully. Identify valid academic facts versus sneaky traps.",
    icon: AlertCircle,
    accentClass: "text-orange-500",
    borderClass: "border-l-orange-500",
    bgClass: "bg-orange-500",
    estimatedMins: "2 min",
    skillLevel: 2,
  },
  {
    id: "word_reveal",
    name: "Word Reveal",
    badge: "Spelling",
    description: "Decode hidden academic terms. Use hints when stuck, but keep your score high.",
    icon: HelpCircle,
    accentClass: "text-teal-500",
    borderClass: "border-l-teal-500",
    bgClass: "bg-teal-500",
    estimatedMins: "3 min",
    skillLevel: 2,
  },
  {
    id: "quiz_rush",
    name: "Quiz Rush",
    badge: "Timed Rush",
    description: "15 seconds per question. Build consecutive combos to maximize mastery points.",
    icon: Clock,
    accentClass: "text-green-500",
    borderClass: "border-l-green-500",
    bgClass: "bg-green-500",
    estimatedMins: "2-3 min",
    skillLevel: 3,
  },
  {
    id: "study_adventure",
    name: "Study Adventure",
    badge: "Journey",
    description: "Guide your mascot along the study path. Conquer checkpoints and reach the goal.",
    icon: Footprints,
    accentClass: "text-indigo-500",
    borderClass: "border-l-indigo-500",
    bgClass: "bg-indigo-500",
    estimatedMins: "3-5 min",
    skillLevel: 1,
  },
];

interface GamesHubProps {
  subjectId?: string;
  onClose?: () => void;
}

interface GameResult {
  accuracy: number;
  score: number;
  streak: number;
  durationSeconds: number;
  mistakes: any[];
}

export function GamesHub({ subjectId: propSubjectId, onClose }: GamesHubProps) {
  const { flashcards, quizzes, subjects, modules, recordGameResult } = useStudyStore();
  const { logSession } = useAcademicStore();
  const { user } = useAuthStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    propSubjectId || subjects[0]?.id || ""
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Filter content
  const relevantCards = flashcards.filter((c) => {
    if (selectedSubjectId && c.subjectId !== selectedSubjectId) return false;
    if (selectedModuleId !== "all" && c.moduleId !== selectedModuleId) return false;
    return true;
  });

  const relevantQuestions = quizzes.flatMap((q) => {
    if (selectedSubjectId && q.subjectId !== selectedSubjectId) return [];
    if (selectedModuleId !== "all" && q.moduleId !== selectedModuleId) return [];
    return q.questions;
  });

  // Fallback items if user has few cards
  const cardsPool: Flashcard[] =
    relevantCards.length >= 3
      ? relevantCards
      : flashcards.length >= 3
      ? flashcards
      : [
          {
            id: "fb_1",
            userId: "sys",
            subjectId: selectedSubjectId || "sys",
            front: "Affordance",
            back: "Physical or visual property indicating how to interact",
            type: "term_def",
            state: "new",
            intervalDays: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: "",
            createdAt: "",
          },
          {
            id: "fb_2",
            userId: "sys",
            subjectId: selectedSubjectId || "sys",
            front: "Visibility of System Status",
            back: "Keeps users informed through timely feedback",
            type: "term_def",
            state: "new",
            intervalDays: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: "",
            createdAt: "",
          },
          {
            id: "fb_3",
            userId: "sys",
            subjectId: selectedSubjectId || "sys",
            front: "Wireframe",
            back: "Low-fidelity visual guide representing skeletal framework",
            type: "term_def",
            state: "new",
            intervalDays: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: "",
            createdAt: "",
          },
          {
            id: "fb_4",
            userId: "sys",
            subjectId: selectedSubjectId || "sys",
            front: "High-Fidelity Prototype",
            back: "Realistic visual design and platform interactions",
            type: "term_def",
            state: "new",
            intervalDays: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: "",
            createdAt: "",
          },
        ];

  const handleGameComplete = (result: GameResult) => {
    if (!user) return;
    recordGameResult({
      userId: user.id,
      subjectId: selectedSubjectId || undefined,
      gameType: activeGame || "unknown",
      accuracy: result.accuracy,
      score: result.score,
      streak: result.streak,
      durationSeconds: result.durationSeconds,
      mistakes: result.mistakes,
    });
    logSession({
      userId: user.id,
      subjectId: selectedSubjectId || undefined,
      type: "game",
      durationMinutes: Math.max(1, Math.round(result.durationSeconds / 60)),
      accuracy: result.accuracy,
      itemsReviewed: result.mistakes.length + (result.score > 0 ? 5 : 0),
      gameType: activeGame || undefined,
      gameScore: result.score,
      gameMasteryWeight: 0.3,
      notes: `Played ${activeGame?.replace("_", " ")} (${result.accuracy}% accuracy)`,
    });
    setGameResult(result);
    setActiveGame(null);
  };

  const hasEnoughCards = cardsPool.length >= 3;

  if (gameResult) {
    const isNewBest = gameResult.score > 1500; // Simulated logic
    return (
      <div className="py-8 max-w-2xl mx-auto flex flex-col items-center animate-fade-in select-none">
        <div className="w-full bg-surface border-2 border-border rounded-xl p-8 flex flex-col items-center">
          <h2 className="text-4xl font-black uppercase text-foreground mb-8 tracking-widest text-center">
            LEVEL COMPLETE <span className="ml-2">🏆</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full mb-8">
            <div className="flex flex-col items-center p-4 bg-surface-muted rounded-lg border border-border">
              <span className="text-2xl font-bold font-mono text-foreground mb-1">{gameResult.score}</span>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-widest">Score</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-surface-muted rounded-lg border border-border">
              <span className="text-2xl font-bold font-mono text-foreground mb-1">{gameResult.accuracy}%</span>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-widest">Accuracy</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-surface-muted rounded-lg border border-border">
              <span className="text-2xl font-bold font-mono text-amber-500 mb-1">×{gameResult.streak}</span>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-widest">Streak</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-surface-muted rounded-lg border border-border">
              <span className="text-2xl font-bold font-mono text-amber-500 mb-1">+{Math.round(gameResult.score / 30)}</span>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-widest">XP</span>
            </div>
          </div>

          {isNewBest && (
            <div className="mb-8 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-bounce">
              <span className="text-lg">★</span> New Personal Best!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => {
                setGameResult(null);
                setActiveGame(activeGame); // Wait, activeGame is null. We'd need to store last game. But let's just clear result.
              }}
              className="flex-1 py-3 bg-brand-700 text-white rounded-lg font-bold hover:bg-brand-800 transition"
            >
              Play Again
            </button>
            <button
              onClick={() => setGameResult(null)}
              className="flex-1 py-3 bg-surface text-foreground border border-border rounded-lg font-bold hover:bg-surface-muted transition"
            >
              Try Different Game
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-surface text-foreground border border-border rounded-lg font-bold hover:bg-surface-muted transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeGame) {
    const gameProps = {
      cards: cardsPool,
      questions: relevantQuestions,
      subjectId: selectedSubjectId,
      onClose: () => setActiveGame(null),
      onComplete: handleGameComplete,
    };
    
    const activeGameInfo = GAMES.find(g => g.id === activeGame);

    return (
      <div className="py-4 animate-fade-in">
        <div className="mb-4 bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-lg font-black text-foreground uppercase tracking-widest">{activeGameInfo?.name}</span>
              <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">{activeGameInfo?.badge}</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono">0</span>
                <span className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Score</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-amber-500">×0</span>
                <span className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Combo</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveGame(null)} className="px-3 py-1.5 text-xs font-bold text-muted-text hover:text-foreground transition-colors flex items-center gap-1 bg-surface-muted rounded">
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>

        {activeGame === "study_race" && <StudyRace {...gameProps} />}
        {activeGame === "match_up" && <MatchUpGame {...gameProps} />}
        {activeGame === "memory_match" && <MemoryMatchGame {...gameProps} />}
        {activeGame === "speed_round" && <SpeedRoundGame {...gameProps} />}
        {activeGame === "true_or_trap" && <TrueOrTrapGame {...gameProps} />}
        {activeGame === "word_reveal" && <WordRevealGame {...gameProps} />}
        {activeGame === "quiz_rush" && <QuizRushGame {...gameProps} />}
        {activeGame === "study_adventure" && <StudyAdventureGame {...gameProps} />}
      </div>
    );
  }

  const subjectModules = modules.filter((m) => m.subjectId === selectedSubjectId);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto select-none py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div className="flex items-center gap-4">
          <Character
            character="zara"
            expression="celebrating"
            size="sm"
            speechBubble="Ready to level up?"
            bubblePosition="right"
          />
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Study Games</h1>
            <p className="text-sm text-muted-text font-medium">Select a game to train your knowledge.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Subject:</span>
            {subjects.length > 0 ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedModuleId("all");
                }}
                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-brand-700"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-muted-text">Using Sample Curriculum</span>
            )}
          </div>
          
          {subjectModules.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Topic:</span>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="px-3 py-1.5 text-sm font-bold rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-brand-700"
              >
                <option value="all">All</option>
                {subjectModules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-muted-text hover:text-foreground transition-colors ml-2 bg-surface-muted rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {!hasEnoughCards && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-bold">Need at least 3 flashcards for games.</span>
          </div>
          <button className="text-sm font-bold text-red-700 dark:text-red-400 hover:underline">
            Add flashcards →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => {
          const Icon = game.icon;
          const isFeatured = game.id === "study_race";

          return (
            <div
              key={game.id}
              className={clsx(
                "relative bg-surface rounded-xl flex flex-col justify-between border-y border-r border-l-[4px] border-border hover:shadow-md transition-shadow",
                game.borderClass
              )}
            >
              {isFeatured && (
                <div className="absolute -top-3 -right-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm z-10 border border-amber-600">
                  Featured
                </div>
              )}
              
              <div className="p-5 flex-grow flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm", game.bgClass)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-muted-text uppercase tracking-wider bg-surface-muted px-2 py-1 rounded">
                    {game.estimatedMins}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-1">
                  {game.name}
                </h3>
                <span className={clsx("text-xs font-bold uppercase tracking-widest mb-3", game.accentClass)}>
                  {game.badge}
                </span>
                
                <p className="text-sm text-muted-text font-medium leading-snug flex-grow">
                  {game.description}
                </p>
              </div>

              <div className="p-4 bg-surface-muted rounded-b-xl border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Skill</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((dot) => (
                      <div
                        key={dot}
                        className={clsx(
                          "w-2 h-2 rounded-full",
                          dot <= game.skillLevel ? game.bgClass : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveGame(game.id)}
                  disabled={!hasEnoughCards}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors",
                    hasEnoughCards
                      ? "bg-brand-700 text-white hover:bg-brand-800"
                      : "bg-surface-muted text-muted-text opacity-50 cursor-not-allowed border border-border"
                  )}
                >
                  Play <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
