'use client';

import React from "react";
import { LucideIcon, ArrowRight, Clock } from "lucide-react";
import clsx from "clsx";

export interface GameCardProps {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  estimatedMins: string;
  skillLevel: number;
  hasEnoughCards: boolean;
  onPlay: () => void;
}

export function GameCard({
  name,
  badge,
  description,
  icon: Icon,
  accentClass,
  bgClass,
  estimatedMins,
  skillLevel,
  hasEnoughCards,
  onPlay,
}: GameCardProps) {
  return (
    <div className="relative bg-[#FFFCF6] dark:bg-[#211A16] rounded-xl border border-[#D6CCBF] dark:border-[#44372E] flex flex-col hover:border-[#B77A45] dark:hover:border-[#D09A68] hover:shadow-md transition-all group overflow-hidden">
      {/* Accent left strip */}
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1.5", bgClass)} />

      <div className="p-5 flex-grow flex flex-col pl-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={clsx("w-11 h-11 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white", bgClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F2EEE6] dark:bg-[#29211C] text-[#756C64] dark:text-[#B9ADA1] text-[10px] font-bold tracking-wider uppercase shrink-0">
            <Clock className="w-3 h-3" />
            <span>{estimatedMins}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span className={clsx("text-[10px] font-bold uppercase tracking-widest", accentClass)}>
            {badge}
          </span>
        </div>

        {/* Full title without truncate */}
        <h3 className="text-base sm:text-lg font-serif font-black text-[#332821] dark:text-[#F2EADF] uppercase tracking-tight mb-2 leading-snug">
          {name}
        </h3>

        <p className="text-xs text-[#756C64] dark:text-[#B9ADA1] font-medium leading-relaxed line-clamp-3 mb-2 flex-1">
          {description}
        </p>
      </div>

      <div className="px-5 py-3.5 bg-[#F7F3EA] dark:bg-[#29211C] border-t border-[#D6CCBF] dark:border-[#44372E] flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">
            Skill Level
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((lvl) => (
              <div
                key={lvl}
                className={clsx(
                  "w-2 h-2 rounded-full transition-colors",
                  lvl <= skillLevel
                    ? "bg-[#49372D] dark:bg-[#D09A68]"
                    : "bg-[#D6CCBF] dark:bg-[#44372E]"
                )}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onPlay}
          disabled={!hasEnoughCards}
          className={clsx(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
            hasEnoughCards
              ? "bg-[#49372D] dark:bg-[#C28A5C] text-[#F7F3EA] dark:text-[#171310] hover:bg-[#332821] dark:hover:bg-[#D39B6B] hover:translate-x-0.5"
              : "bg-[#D6CCBF] dark:bg-[#44372E] text-[#756C64] dark:text-[#B9ADA1] cursor-not-allowed"
          )}
        >
          <span>Play</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
