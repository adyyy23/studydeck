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
  bgClass: string;
  estimatedMins: string;
  skillLevel: number;
}

const GAMES: GameInfo[] = [
  {
    id: "match_up",
    name: "Match Up",
    badge: "Matching",
    description: "Tap terms and matching definitions. Clean pairs as fast and accurately as possible.",
    icon: Shuffle,
    accentClass: "text-[#3b82f6]",
    bgClass: "bg-[#3b82f6]",
    estimatedMins: "2-3 min",
    skillLevel: 1,
  },
  {
    id: "memory_match",
    name: "Memory Match",
    badge: "Memory",
    description: "Flip face-down cards to discover matching term-definition pairs.",
    icon: Eye,
    accentClass: "text-[#8b5cf6]",
    bgClass: "bg-[#8b5cf6]",
    estimatedMins: "2-4 min",
    skillLevel: 2,
  },
  {
    id: "speed_round",
    name: "Speed Round",
    badge: "Fast Pace",
    description: "60 seconds on the clock. Answer questions fast to build streak multipliers.",
    icon: Zap,
    accentClass: "text-[#f97316]",
    bgClass: "bg-[#f97316]",
    estimatedMins: "1 min",
    skillLevel: 3,
  },
  {
    id: "true_or_trap",
    name: "True or Trap",
    badge: "Detection",
    description: "Read statements carefully. Identify valid academic facts versus sneaky traps.",
    icon: AlertCircle,
    accentClass: "text-[#B77A45]",
    bgClass: "bg-[#B77A45]",
    estimatedMins: "2 min",
    skillLevel: 2,
  },
  {
    id: "word_reveal",
    name: "Word Reveal",
    badge: "Spelling",
    description: "Decode hidden academic terms. Use hints when stuck, but keep your score high.",
    icon: HelpCircle,
    accentClass: "text-[#10b981]",
    bgClass: "bg-[#10b981]",
    estimatedMins: "3 min",
    skillLevel: 2,
  },
  {
    id: "quiz_rush",
    name: "Quiz Rush",
    badge: "Timed Rush",
    description: "15 seconds per question. Build consecutive combos to maximize mastery points.",
    icon: Clock,
    accentClass: "text-[#eab308]",
    bgClass: "bg-[#eab308]",
    estimatedMins: "2-3 min",
    skillLevel: 3,
  },
  {
    id: "study_adventure",
    name: "Study Adventure",
    badge: "Journey",
    description: "Guide your mascot along the study path. Conquer checkpoints and reach the goal.",
    icon: Footprints,
    accentClass: "text-[#49372D]",
    bgClass: "bg-[#49372D]",
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
    const isNewBest = gameResult.score > 1500;
    return (
      <div className="py-8 max-w-3xl mx-auto flex flex-col items-center animate-fade-in select-none">
        <div className="w-full bg-[#FFFCF6] border-2 border-[#D6CCBF] shadow-[4px_4px_0_#D6CCBF] rounded-lg p-10 flex flex-col items-center relative overflow-hidden">
          {/* Stamp pattern overlay */}
          <div className="absolute top-8 right-8 w-24 h-24 border-[4px] border-[#D79A45]/30 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
            <span className="text-[#D79A45]/30 font-bold uppercase tracking-widest text-xs text-center leading-tight">Official<br/>Report</span>
          </div>

          <h2 className="text-4xl font-serif font-black uppercase text-[#332821] mb-2 text-center">
            Level Complete 🏆
          </h2>
          <p className="text-[#756C64] font-bold tracking-widest uppercase text-xs mb-10">Academic Field Report</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full mb-10">
            <div className="flex flex-col items-center p-5 bg-[#F7F3EA] border border-[#D6CCBF] rounded-lg">
              <span className="text-3xl font-bold font-mono text-[#332821] mb-2">{gameResult.score}</span>
              <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Score</span>
            </div>
            <div className="flex flex-col items-center p-5 bg-[#F7F3EA] border border-[#D6CCBF] rounded-lg">
              <span className="text-3xl font-bold font-mono text-[#332821] mb-2">{gameResult.accuracy}%</span>
              <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Accuracy</span>
            </div>
            <div className="flex flex-col items-center p-5 bg-[#F7F3EA] border border-[#D6CCBF] rounded-lg">
              <span className="text-3xl font-bold font-mono text-[#B77A45] mb-2">×{gameResult.streak}</span>
              <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Best Streak</span>
            </div>
            <div className="flex flex-col items-center p-5 bg-[#F7F3EA] border border-[#D6CCBF] rounded-lg">
              <span className="text-3xl font-bold font-mono text-[#D79A45] mb-2">+{Math.round(gameResult.score / 30)}</span>
              <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">XP Earned</span>
            </div>
          </div>

          {isNewBest && (
            <div className="mb-10 bg-[#D79A45] text-[#FFFCF6] px-6 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2 animate-bounce border border-[#B77A45]">
              <Trophy className="w-4 h-4" /> Personal Best Achieved!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <button
              onClick={() => {
                setGameResult(null);
              }}
              className="flex-1 py-3 bg-[#49372D] text-[#F7F3EA] rounded font-bold hover:bg-[#332821] transition-colors shadow-sm"
            >
              Play Again
            </button>
            <button
              onClick={() => setGameResult(null)}
              className="flex-1 py-3 bg-[#F7F3EA] text-[#49372D] border border-[#D6CCBF] rounded font-bold hover:bg-[#F2EEE6] transition-colors"
            >
              Try Another Game
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#F7F3EA] text-[#49372D] border border-[#D6CCBF] rounded font-bold hover:bg-[#F2EEE6] transition-colors"
            >
              Return to Study
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
    
    let activeGameInfo = GAMES.find(g => g.id === activeGame);
    if (activeGame === "study_race") {
      activeGameInfo = {
        id: "study_race",
        name: "Study Race Track",
        badge: "Animal Sprint",
        description: "",
        icon: Trophy,
        accentClass: "text-[#D79A45]",
        bgClass: "bg-[#D79A45]",
        estimatedMins: "2 min",
        skillLevel: 2,
      };
    }

    return (
      <div className="py-4 animate-fade-in font-sans">
        <div className="mb-6 bg-[#FFFCF6] rounded-lg border border-[#D6CCBF] p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-lg font-serif font-black text-[#332821] uppercase tracking-widest">{activeGameInfo?.name}</span>
              <span className="text-[10px] text-[#756C64] font-bold uppercase tracking-wider">{activeGameInfo?.badge}</span>
            </div>
            <div className="h-8 w-px bg-[#D6CCBF] hidden sm:block" />
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-[#332821]">0</span>
                <span className="text-[10px] text-[#756C64] uppercase font-bold tracking-wider">Score</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-[#B77A45]">×0</span>
                <span className="text-[10px] text-[#756C64] uppercase font-bold tracking-wider">Combo</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveGame(null)} className="px-4 py-2 text-xs font-bold text-[#49372D] border border-[#D6CCBF] hover:bg-[#F2EEE6] transition-colors flex items-center gap-2 bg-[#F7F3EA] rounded shadow-sm">
            <X className="w-3.5 h-3.5" /> End Session
          </button>
        </div>

        <div className="bg-[#FFFCF6] rounded-lg border border-[#D6CCBF] overflow-hidden shadow-sm">
          {activeGame === "study_race" && <StudyRace {...gameProps} />}
          {activeGame === "match_up" && <MatchUpGame {...gameProps} />}
          {activeGame === "memory_match" && <MemoryMatchGame {...gameProps} />}
          {activeGame === "speed_round" && <SpeedRoundGame {...gameProps} />}
          {activeGame === "true_or_trap" && <TrueOrTrapGame {...gameProps} />}
          {activeGame === "word_reveal" && <WordRevealGame {...gameProps} />}
          {activeGame === "quiz_rush" && <QuizRushGame {...gameProps} />}
          {activeGame === "study_adventure" && <StudyAdventureGame {...gameProps} />}
        </div>
      </div>
    );
  }

  const subjectModules = modules.filter((m) => m.subjectId === selectedSubjectId);

  return (
    <div className="space-y-8 animate-fade-in w-full mx-auto select-none py-2 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-6 border-b border-[#D6CCBF] gap-6">
        <div className="flex items-start gap-6">
          <div className="hidden sm:block">
            <Character
              character="zara"
              expression="celebrating"
              size="sm"
              speechBubble="Earn combo bonuses by maintaining speed and accuracy!"
              bubblePosition="right"
            />
          </div>
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Gamepad2 className="w-5 h-5 text-[#B77A45]" />
              <span className="text-xs font-bold text-[#B77A45] uppercase tracking-widest">Study Arcade</span>
            </div>
            <h1 className="text-3xl font-serif font-black text-[#332821] tracking-tight mb-2">GAME LIBRARY</h1>
            <p className="text-sm text-[#756C64] font-medium max-w-md">Train active recall and speed through short academic challenges.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#F7F3EA] p-3 rounded-lg border border-[#D6CCBF]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Course:</span>
            {subjects.length > 0 ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedModuleId("all");
                }}
                className="px-3 py-1.5 text-sm font-bold rounded border border-[#D6CCBF] bg-[#FFFCF6] text-[#49372D] focus:outline-none focus:border-[#B77A45]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-[#756C64]">Sample Curriculum</span>
            )}
          </div>
          
          {subjectModules.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Topic:</span>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="px-3 py-1.5 text-sm font-bold rounded border border-[#D6CCBF] bg-[#FFFCF6] text-[#49372D] focus:outline-none focus:border-[#B77A45]"
              >
                <option value="all">All Modules</option>
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
              className="p-1.5 text-[#756C64] hover:text-[#332821] transition-colors bg-[#F2EEE6] rounded border border-transparent hover:border-[#D6CCBF]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!hasEnoughCards && (
        <div className="p-4 bg-[#fef2f2] border border-[#fca5a5] rounded flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#b91c1c]">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold">You need at least 3 flashcards in this module to play games.</span>
          </div>
        </div>
      )}

      {/* Featured Challenge Banner */}
      <div className="relative bg-[#FFFCF6] border-2 border-[#D79A45] rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row group hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D79A45]/10 rounded-bl-full pointer-events-none" />
        <div className="p-8 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#D79A45]/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D79A45]/10 text-[#D79A45] rounded-sm w-fit mb-4 border border-[#D79A45]/30">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Featured Challenge</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-[#332821] mb-2 uppercase">STUDY RACE TRACK — Animal Sprint</h2>
          <p className="text-[#49372D] text-sm font-medium mb-6 max-w-lg">
            Multiplayer animal track race! Answer flashcards to sprint ahead and trigger turbo bursts. Beat your personal best.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-[#756C64]">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 2 MIN</span>
            <span>•</span>
            <span className="text-[#D79A45]">+40 XP</span>
            <span>•</span>
            <span>BEST: 1:42</span>
          </div>
        </div>
        <div className="p-8 md:w-64 bg-[#F7F3EA] flex items-center justify-center">
          <button
            onClick={() => setActiveGame("study_race")}
            disabled={!hasEnoughCards}
            className={clsx(
              "w-full py-4 px-6 text-sm font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-all",
              hasEnoughCards 
                ? "bg-[#49372D] text-[#F7F3EA] hover:bg-[#332821] hover:scale-[1.02]" 
                : "bg-[#D6CCBF] text-[#756C64] cursor-not-allowed"
            )}
          >
            START RACE <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Game Library (Asymmetrical Editorial Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {GAMES.map((game, i) => {
          const Icon = game.icon;
          
          // Create some asymmetry by making certain items span 2 columns on larger screens
          const isWide = i === 1 || i === 4;

          return (
            <div
              key={game.id}
              className={clsx(
                "relative bg-[#FFFCF6] rounded border border-[#D6CCBF] flex flex-col hover:border-[#B77A45] hover:shadow-sm transition-all group overflow-hidden",
                isWide ? "md:col-span-2 flex-row" : "col-span-1"
              )}
            >
              {/* Left accent bar */}
              <div className={clsx("absolute left-0 top-0 bottom-0 w-1.5", game.bgClass)} />
              
              <div className={clsx("p-5 flex-grow flex", isWide ? "flex-row items-center gap-6" : "flex-col")}>
                <div className={clsx("flex-shrink-0 flex items-center justify-center rounded mb-4", isWide ? "w-16 h-16 mb-0" : "w-12 h-12", game.bgClass, "text-white shadow-sm")}>
                  <Icon className={clsx(isWide ? "w-8 h-8" : "w-6 h-6")} />
                </div>
                
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className={clsx("text-[10px] font-bold uppercase tracking-widest", game.accentClass)}>
                      {game.badge}
                    </span>
                    {!isWide && (
                      <span className="text-[10px] font-bold text-[#756C64] uppercase bg-[#F2EEE6] px-1.5 py-0.5 rounded">
                        {game.estimatedMins}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif font-black text-[#332821] uppercase tracking-tight mb-2 truncate">
                    {game.name}
                  </h3>
                  <p className="text-xs text-[#756C64] font-medium leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className={clsx("p-4 bg-[#F7F3EA] border-t border-[#D6CCBF] flex items-center justify-between", isWide && "border-t-0 border-l")}>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#756C64] uppercase tracking-widest">Skill Level</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((dot) => (
                      <div
                        key={dot}
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          dot <= game.skillLevel ? game.bgClass : "bg-[#D6CCBF]"
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveGame(game.id)}
                  disabled={!hasEnoughCards}
                  className={clsx(
                    "px-4 py-2 rounded text-xs font-bold transition-colors border",
                    hasEnoughCards
                      ? "bg-[#FFFCF6] border-[#D6CCBF] text-[#49372D] hover:bg-[#F2EEE6] hover:border-[#B77A45]"
                      : "bg-[#F2EEE6] border-transparent text-[#756C64] opacity-50 cursor-not-allowed"
                  )}
                >
                  Play
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
