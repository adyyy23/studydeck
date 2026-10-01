'use client';
import React from 'react';
import { CheckCircle2, Circle, Lock, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface QuestItemProps {
  title: string;
  description?: string;
  xpReward: number;
  status: 'completed' | 'active' | 'locked';
  onClick?: () => void;
  className?: string;
}

export function QuestItem({ title, description, xpReward, status, onClick, className = '' }: QuestItemProps) {
  return (
    <button
      onClick={status !== 'locked' ? onClick : undefined}
      disabled={status === 'locked'}
      className={clsx(
        'quest-item w-full text-left',
        status === 'completed' && 'completed',
        status === 'active' && 'active',
        status === 'locked' && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="shrink-0">
        {status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : status === 'locked' ? (
          <Lock className="w-4 h-4 text-muted-text" />
        ) : (
          <Circle className="w-5 h-5 text-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
        {description && <div className="text-xs text-muted-text mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">+{xpReward} XP</span>
        {status === 'active' && <ChevronRight className="w-4 h-4 text-muted-text" />}
      </div>
    </button>
  );
}
