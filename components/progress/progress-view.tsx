"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
  ArrowRight,
  TrendingUp,
  Trophy,
  Award,
  Zap,
  Lock
} from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { calculateSubjectMastery, calculateOverallMastery } from "@/lib/mastery";
import { Character, ACCESSORY_META } from "@/components/ui/character";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { AvatarAccessoryId } from "@/lib/types";
import { XPBar } from '@/components/ui/xp-bar';
import { LevelBadge, getLevelFromXP } from '@/components/ui/level-badge';
import { MasteryRing } from '@/components/ui/mastery-ring';
// import { AchievementBadge } from '@/components/ui/achievement-badge';
import { StreakTracker } from '@/components/ui/streak-tracker';

export function ProgressView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { subjects, flashcards, quizAttempts, mistakes, topics } = useStudyStore();
  const { sessions, calculateStreak } = useAcademicStore();
  const {
    homeCompanionId,
    avatarAccessory,
    studyPoints,
    unlockedAccessories,
    selectedAvatarId,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "history">("overview");

  const streak = calculateStreak();
  const overall = calculateOverallMastery(flashcards, quizAttempts, mistakes, sessions);
  const overallMasteryPct = flashcards.length > 0 ? Math.round((overall.cardsMastered / flashcards.length) * 100) : 0;

  const getSubjectCode = (subId?: string) => {
    if (!subId) return "General";
    const s = subjects.find((sub) => sub.id === subId);
    return s ? s.code : "Subject";
  };

  const milestones: Array<{
    id: string;
    title: string;
    desc: string;
    reward: AvatarAccessoryId;
    unlocked: boolean;
    current: number;
    target: number;
  }> = [
    {
      id: "focus_master",
      title: "Focus Discipline",
      desc: "Complete 5 Pomodoro sessions",
      reward: "headphones",
      unlocked: sessions.filter((s) => s.type === "pomodoro").length >= 5 || unlockedAccessories.includes("headphones"),
      current: sessions.filter((s) => s.type === "pomodoro").length,
      target: 5,
    },
    {
      id: "card_scholar",
      title: "Active Recall",
      desc: "Review 100 flashcards",
      reward: "glasses",
      unlocked: overall.cardsMastered >= 10 || unlockedAccessories.includes("glasses"),
      current: overall.cardsMastered,
      target: 10,
    },
    {
      id: "streak_flame",
      title: "Consistency Flame",
      desc: "Maintain a 7-day study streak",
      reward: "beanie",
      unlocked: streak >= 7 || unlockedAccessories.includes("beanie"),
      current: streak,
      target: 7,
    },
    {
      id: "mistake_master",
      title: "Mistake Mastery",
      desc: "Resolve 10 notebook mistakes",
      reward: "headband",
      unlocked: overall.mistakesResolved >= 10 || unlockedAccessories.includes("headband"),
      current: overall.mistakesResolved,
      target: 10,
    },
    {
      id: "table_peer",
      title: "Study Club Ally",
      desc: "Join a group study room",
      reward: "cap",
      unlocked: unlockedAccessories.includes("cap"),
      current: unlockedAccessories.includes("cap") ? 1 : 0,
      target: 1,
    },
    {
      id: "exam_readiness",
      title: "Honor Roll",
      desc: "Complete an exam readiness sprint",
      reward: "badge_feather",
      unlocked: unlockedAccessories.includes("badge_feather"),
      current: unlockedAccessories.includes("badge_feather") ? 1 : 0,
      target: 1,
    },
  ];

  // XP & Levels
  const getLevelInfo = (xp: number) => {
    let level = 1; let total = 0;
    while (true) {
      const needed = level * 200;
      if (xp < total + needed) return { level, currentXP: xp - total, nextLevelXP: needed };
      total += needed; level++;
      if (level > 50) return { level: 50, currentXP: xp, nextLevelXP: 9999 };
    }
  };
  const levelInfo = getLevelInfo(studyPoints);

  const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* SECTION 1: STUDENT PROFILE BAR */}
      <div className="bg-surface border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-5 -mt-4 mb-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
            <AnimalAvatar avatarId={selectedAvatarId} accessory={avatarAccessory} className="w-12 h-12" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-foreground truncate">
              {user?.firstName || "Student"} {user?.lastName || ""}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold text-[10px] uppercase">
                Level {levelInfo.level}
              </span>
              <span className="text-sm font-semibold text-muted-text">Scholar Explorer</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-500 text-sm">{streak}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (levelInfo.currentXP / levelInfo.nextLevelXP) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted-text whitespace-nowrap">
            {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
          </span>
        </div>
      </div>

      {/* SECTION 2: STATS ROW */}
      <div className="bg-surface border border-border rounded-xl flex overflow-x-auto divide-x divide-border hide-scrollbar">
        
        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{flashcards.length > 0 ? Math.round((overall.cardsMastered / flashcards.length) * 100) : 0}%</div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Mastery</div>
        </div>

        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1 mb-1">
            {streak}d <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Streak</div>
        </div>

        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-black text-foreground mb-1">{totalHours}h {totalMins}m</div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Total Time</div>
        </div>

        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-blue-600 mb-1">{overall.quizAccuracy || 0}%</div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Accuracy</div>
        </div>

        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-indigo-600 mb-1">{studyPoints}</div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Study XP</div>
        </div>

        <div className="flex-none w-32 p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-foreground mb-1">{overall.cardsMastered}</div>
          <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Mastered</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 3: KNOWLEDGE PATH */}
        <div className="lg:col-span-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
            Knowledge Path
          </h2>
          <div className="bg-surface border border-border rounded-xl p-5 relative">
            <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
            <div className="space-y-6 relative z-10">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-surface">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Beginner</div>
                  <div className="text-xs text-muted-text">Completed</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-surface", (overallMasteryPct || 0) > 20 ? "bg-emerald-500" : "bg-blue-600")}>
                  {(overallMasteryPct || 0) > 20 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-white"></div>}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Explorer</div>
                  <div className="text-xs text-muted-text">{(overallMasteryPct || 0) > 20 ? "Completed" : "Current Phase"}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", (overallMasteryPct || 0) > 40 ? "bg-emerald-500 text-white border-surface" : "bg-surface border-slate-300 dark:border-slate-700")}>
                  {(overallMasteryPct || 0) > 40 ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Scholar</div>
                  <div className="text-xs text-muted-text">Requires 40% Mastery</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", (overallMasteryPct || 0) > 65 ? "bg-emerald-500 text-white border-surface" : "bg-surface border-slate-300 dark:border-slate-700")}>
                  {(overallMasteryPct || 0) > 65 ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Specialist</div>
                  <div className="text-xs text-muted-text">Requires 65% Mastery</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2", (overallMasteryPct || 0) > 85 ? "bg-emerald-500 text-white border-surface" : "bg-surface border-slate-300 dark:border-slate-700")}>
                  {(overallMasteryPct || 0) > 85 ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Master</div>
                  <div className="text-xs text-muted-text">Requires 85% Mastery</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 4: COURSE MASTERY BREAKDOWN */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Course Mastery
            </h2>
            
            {subjects.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm text-muted-text">
                No subjects added yet. Add a course to start tracking.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((sub) => {
                  const mStats = calculateSubjectMastery(
                    sub.id,
                    flashcards,
                    quizAttempts,
                    mistakes,
                    topics.filter((t) => t.subjectId === sub.id)
                  );
                  const masteryLevel = mStats.masteryPercentage > 85 ? "Master" : mStats.masteryPercentage > 65 ? "Specialist" : mStats.masteryPercentage > 40 ? "Scholar" : mStats.masteryPercentage > 20 ? "Explorer" : "Beginner";
                  
                  return (
                    <div key={sub.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 mb-0.5">{sub.code}</div>
                          <div className="text-sm font-bold text-foreground line-clamp-1">{sub.name}</div>
                        </div>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 ml-2">{mStats.masteryPercentage}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2 mt-auto">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${mStats.masteryPercentage}%` }}
                        />
                      </div>
                      
                      <div className="text-[10px] font-bold text-muted-text uppercase">
                        Next milestone: {mStats.masteryPercentage > 85 ? "Completed" : mStats.masteryPercentage > 65 ? "Master" : mStats.masteryPercentage > 40 ? "Specialist" : mStats.masteryPercentage > 20 ? "Scholar" : "Explorer"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 5: RECENT ACHIEVEMENTS */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {milestones.map((m) => {
                const meta = ACCESSORY_META[m.reward];
                return (
                  <div
                    key={m.id}
                    className={clsx(
                      "rounded-xl p-4 flex flex-col justify-between border transition-all",
                      m.unlocked
                        ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
                        : "bg-surface border-border opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", m.unlocked ? "bg-amber-100 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                        {m.unlocked ? <span className="text-lg">{meta?.icon || "✨"}</span> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground line-clamp-1">{m.title}</div>
                        <div className="text-[10px] font-medium text-muted-text line-clamp-1">{m.desc}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                        <span className={m.unlocked ? "text-amber-600" : "text-slate-500"}>{m.unlocked ? "Unlocked" : "Locked"}</span>
                        <span className="text-muted-text">{Math.min(m.target, m.current)} / {m.target}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={clsx("h-1 rounded-full", m.unlocked ? "bg-amber-500" : "bg-slate-400")}
                          style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>

      {/* SECTION 6: WEEKLY STREAK TRACKER */}
      <div className="pt-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
          Activity Tracker
        </h2>
        {/* Render StreakTracker here if available, fallback if not */}
        <StreakTracker streak={streak} sessions={sessions} />
      </div>

    </div>
  );
}

export default ProgressView;
