'use client';
import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';
import clsx from 'clsx';

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  unlocked: boolean;
  xpReward?: number;
  progress?: { current: number; target: number };
  iconColor?: string;
  className?: string;
}

export function AchievementBadge({ icon: Icon, title, description, unlocked, xpReward, progress, iconColor = '#F59E0B', className = '' }: AchievementBadgeProps) {
  return (
    <div className={clsx('achievement-badge', unlocked && 'unlocked', className)}>
      <div className={clsx(
        'w-10 h-10 rounded-lg flex items-center justify-center mb-1',
        unlocked ? 'bg-amber-100 dark:bg-amber-950' : 'bg-surface-muted'
      )} >
        {unlocked ? (
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        ) : (
          <Lock className="w-4 h-4 text-muted-text" />
        )}
      </div>
      <span className={clsx('text-[11px] font-bold text-center leading-tight', unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-muted-text')}>
        {title}
      </span>
      {progress && !unlocked && (
        <div className="w-full mt-1">
          <div className="xp-bar-track" style={{ height: 3 }}>
            <div className="xp-bar-fill" style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }} />
          </div>
          <span className="text-[9px] text-muted-text">{progress.current}/{progress.target}</span>
        </div>
      )}
    </div>
  );
}
