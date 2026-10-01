'use client';
import React from 'react';

interface XPBarProps {
  current: number;
  max: number;
  variant?: 'amber' | 'blue' | 'green';
  showLabel?: boolean;
  height?: 'sm' | 'md';
  className?: string;
}

export function XPBar({ current, max, variant = 'amber', showLabel = false, height = 'sm', className = '' }: XPBarProps) {
  const pct = Math.min(100, max > 0 ? Math.round((current / max) * 100) : 0);
  const fillClass = variant === 'amber' ? 'xp-bar-fill' : variant === 'blue' ? 'xp-bar-fill blue' : 'xp-bar-fill green';
  const h = height === 'sm' ? 6 : 10;
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{current.toLocaleString()} XP</span>
          <span className="text-xs text-muted-text">{max.toLocaleString()}</span>
        </div>
      )}
      <div className="xp-bar-track" style={{ height: h }}>
        <div className={fillClass} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
