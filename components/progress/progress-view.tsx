"use client";

import React, { useState } from "react";
import {
  Flame, Clock, CheckCircle2, AlertTriangle, RotateCcw,
  Sparkles, Layers, Calendar, ArrowRight, TrendingUp, Trophy,
  Award, Zap, Lock
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
    <div className="space-y-6 animate-fade-in select-none bg-[#F2EEE6] min-h-screen p-4 sm:p-6 lg:p-8 font-serif text-[#332821]">
      {/* HEADER: Student Identity Banner */}
      <div className="bg-[#F7F3EA] border border-[#D6CCBF] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-[#FFFCF6] border-2 border-[#D79A45] flex items-center justify-center shrink-0 shadow-sm relative">
            <AnimalAvatar avatarId={selectedAvatarId} accessory={avatarAccessory} className="w-14 h-14" />
            <div className="absolute -bottom-2 -right-2 bg-[#D79A45] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#F7F3EA]">
              Lv {levelInfo.level}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#332821] tracking-tight">
              {user?.firstName || "Student"} {user?.lastName || ""}
            </h1>
            <p className="text-[#756C64] text-sm font-medium mt-1">Level {levelInfo.level} • Scholar Explorer</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#B77A45] mb-1">{levelInfo.currentXP} / {levelInfo.nextLevelXP} XP</div>
            <div className="w-48 h-2 bg-[#D6CCBF] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D79A45] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (levelInfo.currentXP / levelInfo.nextLevelXP) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Compact Academic Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-[#D6CCBF] text-sm font-medium text-[#332821]">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">{overallMasteryPct}%</span> Mastery
          </div>
          <div className="w-px h-4 bg-[#D6CCBF] hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-[#D79A45] font-bold">{streak}d</span> Streak
          </div>
          <div className="w-px h-4 bg-[#D6CCBF] hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{totalHours}h {totalMins}m</span> Studied
          </div>
          <div className="w-px h-4 bg-[#D6CCBF] hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-bold">{overall.quizAccuracy || 0}%</span> Accuracy
          </div>
          <div className="w-px h-4 bg-[#D6CCBF] hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-[#B77A45] font-bold">{studyPoints}</span> XP Earned
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SIGNATURE COMPONENT: THE KNOWLEDGE PATH */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-[#49372D] uppercase tracking-widest">
            Knowledge Path
          </h2>
          <div className="bg-[#F7F3EA] border border-[#D6CCBF] rounded-xl p-6 relative">
            <div className="absolute left-[35px] top-10 bottom-10 w-0.5 bg-[#D6CCBF] z-0"></div>
            <div className="space-y-8 relative z-10">
              
              {/* Beginner */}
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 border-2 border-[#F7F3EA] mt-1 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <div className="font-bold text-[#332821]">BEGINNER</div>
                  <div className="text-xs text-[#756C64] font-medium">[Seal: Novice Scholar]</div>
                  <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                </div>
              </div>

              {/* Explorer */}
              <div className="flex items-start gap-4">
                <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-[#F7F3EA] mt-1 shadow-sm", overallMasteryPct > 20 ? "bg-emerald-600 text-white" : "bg-[#D79A45] text-white ring-4 ring-[#D79A45]/20")}>
                  {overallMasteryPct > 20 ? <div className="w-2 h-2 rounded-full bg-white"></div> : <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                  <div className="font-bold text-[#332821]">EXPLORER</div>
                  <div className="text-xs text-[#756C64] font-medium">[Seal: Academic Seeker]</div>
                  {overallMasteryPct > 20 ? (
                    <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                  ) : (
                    <div className="text-xs text-[#B77A45] font-bold mt-1">● Current Phase ({overallMasteryPct}% Mastery)</div>
                  )}
                </div>
              </div>

              {/* Scholar */}
              <div className="flex items-start gap-4">
                <div className={clsx("w-6 h-6 rounded-sm rotate-45 flex items-center justify-center shrink-0 border-2 mt-1", overallMasteryPct > 40 ? "bg-emerald-600 border-[#F7F3EA]" : overallMasteryPct > 20 ? "bg-[#D79A45] border-[#F7F3EA] ring-4 ring-[#D79A45]/20" : "bg-[#FFFCF6] border-[#D6CCBF]")}>
                  <div className={clsx("w-1.5 h-1.5 rounded-sm bg-white", overallMasteryPct <= 20 && "bg-[#D6CCBF]")}></div>
                </div>
                <div>
                  <div className="font-bold text-[#332821]">SCHOLAR</div>
                  <div className="text-xs text-[#756C64] font-medium">[Seal: Research Fellow]</div>
                  {overallMasteryPct > 40 ? (
                    <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                  ) : overallMasteryPct > 20 ? (
                     <div className="text-xs text-[#B77A45] font-bold mt-1">● Current Level ({overallMasteryPct}% Mastery)</div>
                  ) : (
                    <div className="text-xs text-[#756C64] font-medium mt-1">○ Unlocks at 40%</div>
                  )}
                </div>
              </div>

              {/* Specialist */}
              <div className="flex items-start gap-4">
                <div className={clsx("w-6 h-6 rounded-sm rotate-45 flex items-center justify-center shrink-0 border-2 mt-1", overallMasteryPct > 65 ? "bg-emerald-600 border-[#F7F3EA]" : overallMasteryPct > 40 ? "bg-[#D79A45] border-[#F7F3EA] ring-4 ring-[#D79A45]/20" : "bg-[#FFFCF6] border-[#D6CCBF]")}>
                  <div className={clsx("w-1.5 h-1.5 rounded-sm bg-white", overallMasteryPct <= 40 && "bg-[#D6CCBF]")}></div>
                </div>
                <div>
                  <div className="font-bold text-[#332821]">SPECIALIST</div>
                  <div className="text-xs text-[#756C64] font-medium">[Seal: Discipline Master]</div>
                  {overallMasteryPct > 65 ? (
                    <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                  ) : overallMasteryPct > 40 ? (
                     <div className="text-xs text-[#B77A45] font-bold mt-1">● Current Level ({overallMasteryPct}% Mastery)</div>
                  ) : (
                    <div className="text-xs text-[#756C64] font-medium mt-1">○ Unlocks at 65%</div>
                  )}
                </div>
              </div>

              {/* Master */}
              <div className="flex items-start gap-4">
                <div className={clsx("w-6 h-6 rounded-sm rotate-45 flex items-center justify-center shrink-0 border-2 mt-1", overallMasteryPct > 85 ? "bg-emerald-600 border-[#F7F3EA]" : overallMasteryPct > 65 ? "bg-[#D79A45] border-[#F7F3EA] ring-4 ring-[#D79A45]/20" : "bg-[#FFFCF6] border-[#D6CCBF]")}>
                  <div className={clsx("w-1.5 h-1.5 rounded-sm bg-white", overallMasteryPct <= 65 && "bg-[#D6CCBF]")}></div>
                </div>
                <div>
                  <div className="font-bold text-[#332821]">MASTER</div>
                  <div className="text-xs text-[#756C64] font-medium">[Seal: Grand Luminary]</div>
                  {overallMasteryPct > 85 ? (
                    <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                  ) : overallMasteryPct > 65 ? (
                     <div className="text-xs text-[#B77A45] font-bold mt-1">● Current Level ({overallMasteryPct}% Mastery)</div>
                  ) : (
                    <div className="text-xs text-[#756C64] font-medium mt-1">○ Unlocks at 85%</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          {/* ACHIEVEMENTS */}
          <div>
            <h2 className="text-sm font-bold text-[#49372D] uppercase tracking-widest mb-4">
              Collectible Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((m) => {
                const meta = ACCESSORY_META[m.reward];
                return (
                  <div
                    key={m.id}
                    className={clsx(
                      "rounded-xl p-4 flex flex-col justify-between border-2 transition-all",
                      m.unlocked
                        ? "bg-[#F7F3EA] border-[#D79A45]"
                        : "bg-[#FFFCF6] border-[#D6CCBF]"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2", m.unlocked ? "bg-[#FFFCF6] border-[#D79A45] text-[#D79A45]" : "bg-[#F2EEE6] border-[#D6CCBF] text-[#D6CCBF]")}>
                        {m.unlocked ? <span className="text-2xl">{meta?.icon || "✨"}</span> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className={clsx("text-sm font-bold line-clamp-1", m.unlocked ? "text-[#332821]" : "text-[#756C64]")}>{m.title}</div>
                        {m.unlocked && <div className="text-[10px] font-bold text-[#B77A45] bg-[#D79A45]/10 px-2 py-0.5 rounded inline-block mt-1">+XP Awarded</div>}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-bold text-[#756C64]">
                        <span>{m.unlocked ? "Achieved" : "In Progress"}</span>
                        <span>{Math.min(m.target, m.current)} / {m.target}</span>
                      </div>
                      <div className="w-full bg-[#D6CCBF] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full transition-all duration-500", m.unlocked ? "bg-[#D79A45]" : "bg-[#756C64]")}
                          style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* WEEKLY ACTIVITY TRACKER */}
          <div>
            <h2 className="text-sm font-bold text-[#49372D] uppercase tracking-widest mb-4">
              Activity Tracker
            </h2>
            <div className="bg-[#F7F3EA] border border-[#D6CCBF] rounded-xl p-6">
              <StreakTracker streak={streak} sessions={sessions} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProgressView;
