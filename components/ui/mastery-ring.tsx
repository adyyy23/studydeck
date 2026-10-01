'use client';
import React from 'react';

interface MasteryRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function MasteryRing({ percentage, size = 64, strokeWidth = 5, color = '#10B981', label, sublabel, className = '' }: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="mastery-ring-svg">
        <circle cx={cx} cy={cy} r={radius} className="mastery-ring-track" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius}
          className="mastery-ring-fill"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label !== undefined && (
          <span className="text-xs font-black leading-none" style={{ color }}>{label}</span>
        )}
        {sublabel && (
          <span className="text-[9px] font-semibold text-muted-text leading-none mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
