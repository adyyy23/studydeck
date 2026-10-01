"use client";

import React from "react";
import { ArrowLeft, Clock, Zap, Flame, Trophy, RotateCcw } from "lucide-react";
import clsx from "clsx";

export interface GameMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: boolean;
}

interface GameShellProps {
  title: string;
  badge?: string;
  topic?: string;
  onExit: () => void;
  metrics?: GameMetric[];
  progressPercent?: number;
  children: React.ReactNode;
  className?: string;
}

export function GameShell({
  title,
  badge,
  topic,
  onExit,
  metrics = [],
  progressPercent,
  children,
  className = "",
}: GameShellProps) {
  return (
    <div className={clsx("min-h-[500px] flex flex-col bg-[#F7F3EA] dark:bg-[#221B17] border border-[#D6CCBF] dark:border-[#3D322B] rounded-xl overflow-hidden shadow-xs", className)}>
      {/* Top Header / Field Navigation Bar */}
      <div className="px-3 sm:px-5 py-3 border-b border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#F7F3EA] dark:bg-[#221B17] text-[#49372D] dark:text-[#F2EEE6] text-xs font-bold hover:bg-[#EAE3D8] transition-colors touch-target"
            aria-label="Exit Game"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-serif font-black tracking-tight text-[#332821] dark:text-[#F2EEE6] uppercase">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE3D8] dark:bg-[#3D322B] text-[#654A3A] dark:text-[#D79A45]">
                  {badge}
                </span>
              )}
            </div>
            {topic && (
              <p className="text-[11px] text-[#756C64] dark:text-[#9E9186] font-medium hidden sm:block">
                {topic}
              </p>
            )}
          </div>
        </div>

        {/* HUD Metrics Bar */}
        {metrics.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold",
                  m.highlight
                    ? "bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30"
                    : "bg-[#F7F3EA] dark:bg-[#221B17] text-[#49372D] dark:text-[#F2EEE6] border border-[#D6CCBF] dark:border-[#3D322B]"
                )}
              >
                {m.icon}
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-semibold text-[#756C64] dark:text-[#9E9186] uppercase tracking-wider leading-none">
                    {m.label}
                  </span>
                  <span className="text-xs sm:text-sm font-black leading-tight">
                    {m.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Track */}
      {progressPercent !== undefined && (
        <div className="w-full bg-[#EAE3D8] dark:bg-[#2E2520] h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#D79A45] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * Shared Academic Report Result Screen for all StudyDeck Games
 */
export function GameResultReport({
  title = "Level Complete",
  score,
  accuracy,
  streak,
  xp,
  timeSpent,
  isPersonalBest,
  onPlayAgain,
  onComplete,
  onClose,
}: {
  title?: string;
  score: number;
  accuracy: number;
  streak: number;
  xp: number;
  timeSpent?: string;
  isPersonalBest?: boolean;
  onPlayAgain: () => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto animate-fade-in">
      {/* Official Field Report Seal */}
      <div className="w-16 h-16 rounded-full border-2 border-double border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] flex items-center justify-center mb-4 shadow-xs">
        <Trophy className="w-8 h-8" />
      </div>

      <div className="text-[11px] font-black uppercase tracking-widest text-[#B77A45] dark:text-[#D79A45] mb-1">
        Academic Field Assessment
      </div>
      <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#332821] dark:text-[#F2EEE6] tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1 mb-6">
        Performance certified and logged to your Academic Journey record.
      </p>

      {isPersonalBest && (
        <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#382A1E] border border-[#D79A45] text-[#B77A45] dark:text-[#D79A45] text-xs font-black uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>★ New Personal Best!</span>
        </div>
      )}

      {/* 4-Stat Metric Sheet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-8">
        <div className="p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase block">Score</span>
          <span className="text-lg font-black text-[#332821] dark:text-[#F2EEE6]">{score.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase block">Accuracy</span>
          <span className="text-lg font-black text-[#3D6B4F]">{accuracy}%</span>
        </div>
        <div className="p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase block">Best Streak</span>
          <span className="text-lg font-black text-[#B77A45]">×{streak}</span>
        </div>
        <div className="p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E]">
          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase block">Reward</span>
          <span className="text-lg font-black text-[#D79A45]">+{xp} XP</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <button
          onClick={onComplete}
          className="btn-primary w-full py-3 px-5 text-xs font-bold tracking-wider uppercase"
        >
          Save & Continue
        </button>
        <button
          onClick={onPlayAgain}
          className="btn-secondary w-full py-3 px-5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Play Again</span>
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 px-5 text-xs font-bold text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] transition-colors"
        >
          Return to Arcade
        </button>
      </div>
    </div>
  );
}
