"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Layers,
  AlertCircle,
  Clock,
  Users,
  Target,
  Plus,
  Play,
  Calendar,
  Sparkles,
  Flame,
  Gamepad2,
  Trophy,
  CheckCircle2,
  Circle,
  Timer,
  ChevronRight,
  CheckSquare,
  Shield,
  Star
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { useRoomStore } from "@/lib/store/use-room-store";
import { FocusReviewModal } from "@/components/focus-review/focus-review-modal";
import { PomodoroModal } from "@/components/pomodoro/pomodoro-modal";
import { Character, CHARACTER_META } from "@/components/ui/character";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScheduleImportModal } from "@/components/schedule/schedule-import-modal";

import { MasteryRing } from '@/components/ui/mastery-ring';
import { XPBar } from '@/components/ui/xp-bar';
import { LevelBadge } from '@/components/ui/level-badge';
import { QuestItem } from '@/components/ui/quest-item';
import { StreakTracker } from '@/components/ui/streak-tracker';
import { calculateSubjectMastery } from '@/lib/mastery';

export function HomeView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    subjects,
    modules,
    flashcards,
    mistakes,
    quizzes,
    quizAttempts,
    topics,
    loadSampleITST306Curriculum,
    addSubject,
    addModule,
  } = useStudyStore();
  const { events, sessions, calculateStreak, getTodayClasses } = useAcademicStore();
  const { rooms } = useRoomStore();
  const {
    homeCompanionId,
    avatarAccessory,
    dailyGoalMinutes,
    studyPoints,
    selectedAvatarId,
  } = useSettingsStore();

  const [focusReviewOpen, setFocusReviewOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [quickCreateSubjectOpen, setQuickCreateSubjectOpen] = useState(false);
  const [importScheduleOpen, setImportScheduleOpen] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");

  const streak = calculateStreak();
  const todayClasses = user ? getTodayClasses(user.id) : [];

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Due flashcards count
  const todayStr = new Date().toISOString().split("T")[0];
  const dueCardsCount = flashcards.filter(
    (c) => c.state === "new" || c.nextReviewDate <= todayStr
  ).length;

  // Active unresolved mistakes
  const unresolvedMistakesCount = mistakes.filter((m) => m.state !== "mastered").length;

  // Today's studied minutes
  const todayMinutes = sessions
    .filter((s) => s.createdAt.startsWith(todayStr))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

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

  // Quest Completions
  const todayQuizzes = quizAttempts.filter(a => a.completedAt?.startsWith(todayStr));
  const todaySessions = sessions.filter(s => s.createdAt.startsWith(todayStr));
  const quest1Done = dueCardsCount === 0 || flashcards.some(f => f.lastReviewedAt?.startsWith(todayStr));
  const quest2Done = todayQuizzes.length > 0;
  const quest3Done = todaySessions.some(s => s.type === "pomodoro" && s.durationMinutes >= 25) || todayMinutes >= 25;
  const questsCompleted = [quest1Done, quest2Done, quest3Done].filter(Boolean).length;

  // Weekly Challenge Progress
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0,0,0,0);
  const studyDays = new Set(sessions.filter(s => new Date(s.createdAt) >= weekStart).map(s => s.createdAt.split('T')[0]));
  const studyDaysThisWeek = studyDays.size;

  const handleQuickAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim() || !user) return;
    const sub = addSubject({
      userId: user.id,
      code: newSubCode.trim(),
      name: newSubName.trim(),
    });
    addModule(sub.id, "Module 1: Fundamentals");
    setNewSubCode("");
    setNewSubName("");
    setQuickCreateSubjectOpen(false);
  };

  return (
    <div className="animate-fade-in select-none bg-[#F2EEE6] min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8">
      {/* 1. TOP HEADER: Field Journal Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-black text-[#332821]">
          {getGreeting()}, {user?.firstName || "Student"}.
        </h1>
        <p className="text-sm font-medium text-[#756C64] mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Your study plan is ready.
        </p>
        
        {/* Student Progression strip integrated */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-[#49372D]">LV. {levelInfo.level} — NOVICE</span>
            <div className="w-32 h-1.5 bg-[#D6CCBF] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D79A45] transition-all duration-500" 
                style={{ width: `${Math.min(100, (levelInfo.currentXP / levelInfo.nextLevelXP) * 100)}%` }} 
              />
            </div>
            <span className="text-xs font-bold text-[#B77A45]">{levelInfo.currentXP} / {levelInfo.nextLevelXP} XP</span>
          </div>
          
          <div className="flex items-center gap-4 sm:ml-auto">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#B77A45] fill-[#B77A45]" />
              <span className="font-bold text-[#B77A45] text-sm">{streak}d streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#D79A45] fill-[#D79A45]" />
              <span className="font-bold text-[#D79A45] text-sm">★ {studyPoints} SP</span>
            </div>
            <div className="text-xs font-bold text-[#756C64]">
              Daily Goal: {todayMinutes}/{dailyGoalMinutes || 30} min
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S JOURNEY: Connected Horizontal Progression Track */}
      <div className="bg-[#F7F3EA] border border-[#D6CCBF] rounded-xl p-5 mb-6 relative shadow-sm">
        <div className="text-xs font-black text-[#756C64] uppercase tracking-widest mb-6">Today's Journey</div>
        
        <div className="relative flex items-center justify-between max-w-3xl mx-auto mb-2 px-4 sm:px-12">
          {/* Connecting line */}
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-[#D6CCBF] -z-10" />
          
          {/* Node 1: Review */}
          <button onClick={() => router.push("/study")} className="flex flex-col items-center gap-2 group w-16 sm:w-24">
            <div className="text-sm font-bold text-[#332821] group-hover:text-[#B77A45] transition-colors">Review</div>
            {dueCardsCount === 0 ? (
              <div className="w-8 h-8 rounded-full bg-[#8A9A86] text-white flex items-center justify-center border-2 border-[#F7F3EA] z-10"><CheckCircle2 className="w-5 h-5" /></div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#B77A45] text-white flex items-center justify-center border-2 border-[#F7F3EA] shadow-sm z-10"><Circle className="w-3 h-3 fill-current" /></div>
            )}
            <div className="text-xs text-[#756C64] hidden sm:block">{dueCardsCount === 0 ? "8 cards" : `${dueCardsCount} cards`}</div>
            {dueCardsCount === 0 ? (
              <div className="text-[10px] font-bold text-[#8A9A86]">DONE</div>
            ) : (
              <div className="text-[10px] font-bold text-[#B77A45]">+20 XP</div>
            )}
          </button>
          
          {/* Node 2: Practice */}
          <button onClick={() => router.push("/study")} className="flex flex-col items-center gap-2 group w-16 sm:w-24">
            <div className="text-sm font-bold text-[#332821] group-hover:text-[#B77A45] transition-colors">Practice</div>
            {quest2Done ? (
              <div className="w-8 h-8 rounded-full bg-[#8A9A86] text-white flex items-center justify-center border-2 border-[#F7F3EA] z-10"><CheckCircle2 className="w-5 h-5" /></div>
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-[#D6CCBF] bg-[#FFFCF6] text-[#D6CCBF] flex items-center justify-center z-10"><Circle className="w-3 h-3" /></div>
            )}
            <div className="text-xs text-[#756C64] hidden sm:block">Quiz</div>
            {quest2Done ? (
              <div className="text-[10px] font-bold text-[#8A9A86]">DONE</div>
            ) : (
              <div className="text-[10px] font-bold text-[#B77A45]">+30 XP</div>
            )}
          </button>

          {/* Node 3: Challenge */}
          <button onClick={() => router.push("/study?tab=games")} className="flex flex-col items-center gap-2 group w-16 sm:w-24">
            <div className="text-sm font-bold text-[#332821] group-hover:text-[#B77A45] transition-colors">Challenge</div>
            <div className="w-8 h-8 rounded-full border-2 border-[#D6CCBF] bg-[#FFFCF6] text-[#D6CCBF] flex items-center justify-center z-10"><Circle className="w-3 h-3" /></div>
            <div className="text-xs text-[#756C64] hidden sm:block">Game</div>
            <div className="text-[10px] font-bold text-[#B77A45]">+50 XP</div>
          </button>

          {/* Node 4: Focus */}
          <button onClick={() => setPomodoroOpen(true)} className="flex flex-col items-center gap-2 group w-16 sm:w-24">
            <div className="text-sm font-bold text-[#332821] group-hover:text-[#B77A45] transition-colors">Focus</div>
            {quest3Done ? (
              <div className="w-8 h-8 rounded-full bg-[#8A9A86] text-white flex items-center justify-center border-2 border-[#F7F3EA] z-10"><CheckCircle2 className="w-5 h-5" /></div>
            ) : (
               <div className="w-8 h-8 rounded-full border-2 border-[#D6CCBF] bg-[#FFFCF6] text-[#D6CCBF] flex items-center justify-center z-10"><Circle className="w-3 h-3" /></div>
            )}
            <div className="text-xs text-[#756C64] hidden sm:block">25 min</div>
            {quest3Done ? (
              <div className="text-[10px] font-bold text-[#8A9A86]">DONE</div>
            ) : (
               <div className="text-[10px] font-bold text-[#B77A45]">+40 XP</div>
            )}
          </button>
        </div>
        
        {/* Barnaby hint */}
        <div className="mt-4 sm:absolute sm:top-4 sm:right-4 flex items-center gap-2 text-[#756C64] bg-[#F2EEE6] px-3 py-1.5 rounded-lg border border-[#D6CCBF] text-[10px] sm:text-xs">
           <span className="font-bold text-[#B77A45]">Barnaby's Study Guide:</span> Complete today's track to earn +140 XP.
        </div>
      </div>

      {/* 3. TWO-COLUMN EDITORIAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left Column (Quests & Course Work) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Quests (Task Sheet / Quest Log) */}
          <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D6CCBF] pb-3 mb-3">
               <h2 className="text-xs font-black text-[#332821] uppercase tracking-wider">Today's Quests</h2>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-[#B77A45]">{questsCompleted} / 3</span>
                 <div className="w-16 h-1 bg-[#F2EEE6] rounded-full overflow-hidden">
                   <div className="h-full bg-[#B77A45] transition-all duration-500" style={{ width: `${(questsCompleted / 3) * 100}%` }} />
                 </div>
               </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex items-center justify-between py-1 group">
                 <div className="flex items-center gap-3">
                    {quest1Done ? <CheckCircle2 className="w-5 h-5 text-[#8A9A86]" /> : <Circle className="w-5 h-5 text-[#D6CCBF]" />}
                    <span className={clsx("text-sm font-medium", quest1Done ? "text-[#756C64] line-through" : "text-[#332821]")}>Review 8 flashcards</span>
                 </div>
                 {quest1Done ? <span className="text-xs font-bold text-[#8A9A86]">DONE</span> : <span className="text-xs font-bold text-[#B77A45]">+20 XP</span>}
               </div>
               <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D6CCBF]/50 to-transparent" />
               <div className="flex items-center justify-between py-1 group">
                 <div className="flex items-center gap-3">
                    {quest2Done ? <CheckCircle2 className="w-5 h-5 text-[#8A9A86]" /> : <Circle className="w-5 h-5 text-[#D6CCBF]" />}
                    <span className={clsx("text-sm font-medium", quest2Done ? "text-[#756C64] line-through" : "text-[#332821]")}>Complete one quiz</span>
                 </div>
                 {quest2Done ? <span className="text-xs font-bold text-[#8A9A86]">DONE</span> : <span className="text-xs font-bold text-[#B77A45]">+30 XP</span>}
               </div>
               <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D6CCBF]/50 to-transparent" />
               <div className="flex items-center justify-between py-1 group">
                 <div className="flex items-center gap-3">
                    {quest3Done ? <CheckCircle2 className="w-5 h-5 text-[#8A9A86]" /> : <Circle className="w-5 h-5 text-[#D6CCBF]" />}
                    <span className={clsx("text-sm font-medium", quest3Done ? "text-[#756C64] line-through" : "text-[#332821]")}>Study for 25 minutes</span>
                 </div>
                 {quest3Done ? <span className="text-xs font-bold text-[#8A9A86]">DONE</span> : <span className="text-xs font-bold text-[#B77A45]">+40 XP</span>}
               </div>
            </div>
          </div>

          {/* Continue Studying (Academic Course Entry) */}
          {subjects.length > 0 ? (
            <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-xl p-5 shadow-sm">
              <h2 className="text-xs font-black text-[#332821] uppercase tracking-wider mb-4 border-b border-[#D6CCBF] pb-2">Academic Course Entry</h2>
              
              {subjects.slice(0, 1).map(subject => {
                 const masteryStats = calculateSubjectMastery(subject.id, flashcards, quizAttempts, mistakes, topics.filter(t => t.subjectId === subject.id));
                 const subjectCardsCount = flashcards.filter(f => f.subjectId === subject.id).length;
                 const subjectQuizzesCount = quizzes.filter(q => q.subjectId === subject.id).length;
                 return (
                   <div key={subject.id}>
                      <div className="font-mono font-bold text-lg text-[#332821]">{subject.code}</div>
                      <div className="text-sm font-serif italic text-[#756C64] mb-4">{subject.name}</div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 font-mono text-xs text-[#B77A45] flex items-center">
                           {'█'.repeat(Math.floor(masteryStats.masteryPercentage / 10))}
                           {'░'.repeat(10 - Math.floor(masteryStats.masteryPercentage / 10))}
                           <span className="ml-3 text-[#332821]">{masteryStats.masteryPercentage}% Mastery</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                         <span className="px-3 py-1.5 bg-[#F2EEE6] text-[#756C64] text-[10px] font-bold rounded-md border border-[#D6CCBF]">{subjectCardsCount} cards due</span>
                         <span className="px-3 py-1.5 bg-[#F2EEE6] text-[#756C64] text-[10px] font-bold rounded-md border border-[#D6CCBF]">{subjectQuizzesCount} quizzes</span>
                         <span className="px-3 py-1.5 bg-[#F2EEE6] text-[#756C64] text-[10px] font-bold rounded-md border border-[#D6CCBF]">{unresolvedMistakesCount} mistakes</span>
                      </div>

                      <button onClick={() => router.push(`/study?subjectId=${subject.id}`)} className="bg-[#49372D] text-[#FFFCF6] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#332821] transition-colors inline-flex items-center gap-2">
                         Continue Session <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                 )
              })}
            </div>
          ) : (
            <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-xl p-5 shadow-sm">
               <h2 className="text-xs font-black text-[#332821] uppercase tracking-wider mb-4 border-b border-[#D6CCBF] pb-2">Academic Notebook</h2>
               <p className="text-sm text-[#756C64] mb-5">No active subjects found. Create or import your classes to begin your journal.</p>
               <div className="flex flex-wrap gap-3">
                 <button onClick={() => setImportScheduleOpen(true)} className="bg-[#49372D] text-[#FFFCF6] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#332821] transition-colors">
                   Import Schedule
                 </button>
                 <button onClick={() => setQuickCreateSubjectOpen(true)} className="bg-[#F2EEE6] text-[#49372D] border border-[#D6CCBF] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#EAE4D9] transition-colors">
                   Add Subject
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Right Column (Challenge & Today's Schedule) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Weekly Challenge (Collectible Artifact) */}
          <div className="bg-[#F7F3EA] border border-[#D6CCBF] rounded-xl p-5 shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <Trophy className="w-32 h-32 text-[#B77A45]" />
             </div>
             <div className="text-[10px] font-black text-[#B77A45] uppercase tracking-widest mb-1 relative z-10">Weekly Challenge</div>
             <h3 className="text-base font-bold text-[#332821] mb-2 relative z-10">MIDTERM PREP SPRINT</h3>
             <p className="text-sm text-[#756C64] mb-4 relative z-10">Study 5 days this week</p>
             
             <div className="flex items-center gap-2 mb-6 relative z-10">
               {[0,1,2,3,4].map(i => (
                 <Circle key={i} className={clsx("w-3.5 h-3.5", i < studyDaysThisWeek ? "fill-[#B77A45] text-[#B77A45]" : "text-[#D6CCBF]")} />
               ))}
               <span className="ml-2 text-xs font-bold text-[#B77A45]">{studyDaysThisWeek} / 5</span>
             </div>

             <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-lg p-3 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full border border-[#D6CCBF] flex items-center justify-center bg-[#F2EEE6]">
                   <Shield className="w-5 h-5 text-[#B77A45]" />
                </div>
                <div>
                   <div className="text-xs font-bold text-[#B77A45]">+150 XP • Explorer Seal</div>
                   <div className="text-[10px] font-medium text-[#756C64] uppercase tracking-wider mt-0.5">Collectible Reward</div>
                </div>
             </div>
          </div>

          {/* Today's Classes (Academic Agenda) */}
          <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-xl p-5 shadow-sm">
             <h2 className="text-xs font-black text-[#332821] uppercase tracking-wider mb-4 border-b border-[#D6CCBF] pb-2">Academic Agenda</h2>
             
             {todayClasses.length > 0 ? (
               <div className="space-y-4">
                  {todayClasses.map(cls => (
                    <div key={cls.id} className="flex gap-4">
                       <div className="w-16 shrink-0 text-right pt-0.5">
                         <span className="text-xs font-mono font-bold text-[#756C64]">{cls.startTime}</span>
                       </div>
                       <div className="border-l-2 border-[#D6CCBF] pl-4 pb-2">
                         <div className="font-mono text-[10px] font-bold text-[#B77A45] mb-1">{cls.subjectCode}</div>
                         <div className="text-sm font-bold text-[#332821] leading-tight">{cls.subjectName}</div>
                         {cls.room && <div className="text-xs text-[#756C64] mt-1 italic">Room: {cls.room}</div>}
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="text-center py-6 px-4">
                  <p className="text-sm text-[#756C64] mb-4">A quiet desk today. No classes scheduled.</p>
                  <button onClick={() => setPomodoroOpen(true)} className="inline-flex items-center gap-2 bg-[#F2EEE6] border border-[#D6CCBF] text-[#49372D] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#EAE4D9] transition-colors">
                    <Play className="w-4 h-4" />
                    Start 25-min Focus Block
                  </button>
               </div>
             )}
          </div>

        </div>
      </div>

      {/* 4. ACADEMIC ACTIONS STRIP */}
      <div className="flex flex-wrap gap-3">
         <button onClick={() => router.push("/study?tab=mistakes")} className="flex items-center gap-2 bg-[#FFFCF6] border border-[#D6CCBF] px-4 py-2.5 rounded-lg hover:bg-[#F7F3EA] transition-colors shadow-sm">
           <AlertCircle className="w-4 h-4 text-[#B77A45]" />
           <span className="text-sm font-bold text-[#332821]">Mistake Notebook</span>
           {unresolvedMistakesCount > 0 && <span className="bg-[#F2EEE6] text-[#756C64] px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#D6CCBF]">{unresolvedMistakesCount}</span>}
         </button>
         <button onClick={() => router.push("/study?tab=games")} className="flex items-center gap-2 bg-[#FFFCF6] border border-[#D6CCBF] px-4 py-2.5 rounded-lg hover:bg-[#F7F3EA] transition-colors shadow-sm">
           <Gamepad2 className="w-4 h-4 text-[#B77A45]" />
           <span className="text-sm font-bold text-[#332821]">Study Games</span>
         </button>
         <button onClick={() => setImportScheduleOpen(true)} className="flex items-center gap-2 bg-[#FFFCF6] border border-[#D6CCBF] px-4 py-2.5 rounded-lg hover:bg-[#F7F3EA] transition-colors shadow-sm">
           <Calendar className="w-4 h-4 text-[#B77A45]" />
           <span className="text-sm font-bold text-[#332821]">Class Schedule</span>
         </button>
      </div>

      {/* MODALS */}
      {quickCreateSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-[#332821]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickAddSubject}
            className="w-full max-w-sm rounded-xl bg-[#FFFCF6] border border-[#D6CCBF] p-6 shadow-xl space-y-4"
          >
            <h3 className="text-sm font-bold text-[#332821] font-serif uppercase tracking-wider mb-2 border-b border-[#D6CCBF] pb-2">Add Academic Entry</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Code (e.g. ITST 306)"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#D6CCBF] bg-[#F7F3EA] focus:outline-none focus:border-[#B77A45] placeholder-[#756C64]/50"
              />
              <input
                type="text"
                placeholder="Name (e.g. Mobile Computing)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#D6CCBF] bg-[#F7F3EA] focus:outline-none focus:border-[#B77A45] placeholder-[#756C64]/50"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setQuickCreateSubjectOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D6CCBF] text-[#756C64] text-xs font-bold hover:bg-[#F2EEE6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#49372D] text-[#FFFCF6] text-xs font-bold hover:bg-[#332821] transition-colors"
              >
                Create Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <ScheduleImportModal
        isOpen={importScheduleOpen}
        onClose={() => setImportScheduleOpen(false)}
        userId={user?.id || "usr_demo"}
      />

      <FocusReviewModal
        isOpen={focusReviewOpen}
        onClose={() => setFocusReviewOpen(false)}
      />

      <PomodoroModal
        isOpen={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
      />
    </div>
  );
}

export default HomeView;
