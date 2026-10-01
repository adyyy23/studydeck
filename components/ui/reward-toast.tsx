'use client';
import React, { useEffect, useState } from 'react';
import { Zap, Star, Trophy } from 'lucide-react';
import clsx from 'clsx';

interface RewardToastProps {
  type: 'xp' | 'badge' | 'level_up';
  message: string;
  amount?: number;
  isVisible: boolean;
  onDismiss: () => void;
}

export function RewardToast({ type, message, amount, isVisible, onDismiss }: RewardToastProps) {
  const [leaving, setLeaving] = useState(false);
  
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);
  
  if (!isVisible) return null;
  
  const icons = { xp: Zap, badge: Star, level_up: Trophy };
  const Icon = icons[type];
  const colors = {
    xp: 'bg-amber-500 border-amber-600',
    badge: 'bg-violet-600 border-violet-700',
    level_up: 'bg-blue-600 border-blue-700',
  };
  
  return (
    <div className={clsx(
      'fixed bottom-24 md:bottom-6 right-4 z-[200] flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-white text-sm font-bold shadow-lg reward-toast',
      colors[type],
      leaving && 'out'
    )}>
      <Icon className="w-4 h-4" />
      <span>{message}</span>
      {amount !== undefined && (
        <span className="ml-1 font-black">+{amount}</span>
      )}
    </div>
  );
}
