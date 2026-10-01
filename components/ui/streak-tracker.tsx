'use client';
import React from 'react';
import { Flame } from 'lucide-react';

interface StreakTrackerProps {
  streak: number;
  sessions: Array<{ createdAt: string }>; // study sessions
  compact?: boolean;
  className?: string;
}

export function StreakTracker({ streak, sessions, compact = false, className = '' }: StreakTrackerProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7; // Mon=0
  
  // Check which days this week had sessions
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayIdx);
  weekStart.setHours(0, 0, 0, 0);
  
  const studiedDays = new Set<number>();
  sessions.forEach(s => {
    const d = new Date(s.createdAt);
    const diff = Math.floor((d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 6) studiedDays.add(diff);
  });
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{streak}d</span>
        <div className="flex gap-1">
          {days.map((d, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm text-[9px] font-bold flex items-center justify-center border ${
                i === todayIdx
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  : studiedDays.has(i)
                  ? 'border-amber-400 bg-amber-400 text-white'
                  : 'border-border bg-surface-muted text-muted-text'
              }`}
            >{d}</div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
        <span className="text-lg font-black text-amber-600 dark:text-amber-400">{streak} DAY STREAK</span>
      </div>
      <div className="flex gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-text">{d}</span>
            <div className={`streak-dot ${
              studiedDays.has(i) ? 'active' : i === todayIdx ? 'today' : ''
            }`}>
              {studiedDays.has(i) && '✓'}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-text">
        {streak > 0 ? `Keep it up! Study today to continue your streak.` : 'Study today to start your streak.'}
      </p>
    </div>
  );
}
