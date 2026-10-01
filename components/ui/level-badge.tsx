'use client';
import React from 'react';

const LEVEL_TITLES = [
  'Novice', 'Apprentice', 'Scholar', 'Explorer', 'Adept',
  'Seeker', 'Analyst', 'Expert', 'Master', 'Sage', 'Luminary'
];

export function getLevelFromXP(xp: number): { level: number; title: string; currentXP: number; nextLevelXP: number; prevLevelXP: number } {
  // Each level requires level * 200 XP
  let level = 1;
  let totalRequired = 0;
  while (true) {
    const needed = level * 200;
    if (xp < totalRequired + needed) {
      return {
        level,
        title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
        currentXP: xp - totalRequired,
        nextLevelXP: needed,
        prevLevelXP: totalRequired,
      };
    }
    totalRequired += needed;
    level++;
    if (level > 50) return { level: 50, title: 'Luminary', currentXP: xp, nextLevelXP: 9999, prevLevelXP: 0 };
  }
}

interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, title, size = 'md', className = '' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };
  return (
    <div className={`level-badge bg-brand-50 dark:bg-blue-950/50 text-brand-700 dark:text-blue-300 border-brand-300 dark:border-blue-700 ${sizeClasses[size]} ${className}`}>
      <span className="font-black">Lv.{level}</span>
      {title && <span className="font-semibold opacity-80">{title}</span>}
    </div>
  );
}
