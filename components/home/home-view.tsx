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
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* SECTION 1: Hero Greeting + XP Widget */}
      <div className="bg-surface border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-5 -mt-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black text-foreground">
              {getGreeting()}, {user?.firstName || "Student"}
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold text-[10px] uppercase">
                Level {levelInfo.level}
              </span>
              <span className="text-sm font-semibold text-muted-text">Scholar Explorer</span>
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">
              Daily Goal: {todayMinutes}/{dailyGoalMinutes || 30} min
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-500 text-sm">{streak}d</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{studyPoints} SP</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 w-full max-w-xl">
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (levelInfo.currentXP / levelInfo.nextLevelXP) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted-text whitespace-nowrap">
            {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP toward Level {levelInfo.level + 1}
          </span>
        </div>
      </div>

      {/* SECTION 2: TODAY'S QUEST PROGRESSION TRACK */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Quest Progression Track
          </h2>
        </div>
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 gap-3 hide-scrollbar">
          
          <button
            onClick={() => router.push("/study")}
            className={clsx(
              "flex-shrink-0 w-[240px] sm:w-auto flex items-center p-3 rounded-xl border transition-all text-left",
              dueCardsCount === 0
                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                : "bg-surface border-blue-600 border-l-4 hover:bg-surface-muted"
            )}
          >
            <div className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3",
              dueCardsCount === 0 ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            )} >
              {dueCardsCount === 0 ? <CheckCircle2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-sm font-bold truncate text-foreground">Review</span>
                {dueCardsCount > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 rounded">+20 XP</span>}
              </div>
              <p className="text-xs text-muted-text truncate">
                {dueCardsCount === 0 ? "All caught up" : `Review ${dueCardsCount} flashcards`}
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/study")}
            className={clsx(
              "flex-shrink-0 w-[240px] sm:w-auto flex items-center p-3 rounded-xl border transition-all text-left",
              quest2Done
                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                : "bg-surface border-border border-l-4 border-l-indigo-500 hover:bg-surface-muted"
            )}
          >
            <div className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3",
              quest2Done ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {quest2Done ? <CheckCircle2 className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-sm font-bold truncate text-foreground">Practice</span>
                {!quest2Done && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 rounded">+30 XP</span>}
              </div>
              <p className="text-xs text-muted-text truncate">
                {quest2Done ? "Quiz completed" : "Complete a quiz"}
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/study?tab=games")}
            className="flex-shrink-0 w-[240px] sm:w-auto flex items-center p-3 rounded-xl border border-border border-l-4 border-l-pink-500 bg-surface hover:bg-surface-muted transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3 bg-pink-100 text-pink-600">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-sm font-bold truncate text-foreground">Challenge</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 rounded">+50 XP</span>
              </div>
              <p className="text-xs text-muted-text truncate">Play a study game</p>
            </div>
          </button>

          <button
            onClick={() => setPomodoroOpen(true)}
            className={clsx(
              "flex-shrink-0 w-[240px] sm:w-auto flex items-center p-3 rounded-xl border transition-all text-left",
              quest3Done
                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                : "bg-surface border-border border-l-4 border-l-amber-500 hover:bg-surface-muted"
            )}
          >
            <div className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-3",
              quest3Done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {quest3Done ? <CheckCircle2 className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-sm font-bold truncate text-foreground">Focus</span>
                {!quest3Done && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 rounded">+40 XP</span>}
              </div>
              <p className="text-xs text-muted-text truncate">
                {quest3Done ? "Goal reached" : "25-min focus session"}
              </p>
            </div>
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SECTION 3: DAILY QUESTS CHECKLIST */}
        <div className="bg-surface rounded-xl border border-border p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Daily Quests
            </h3>
            <span className="text-xs font-bold text-blue-600">{questsCompleted} / 3 completed</span>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              {quest1Done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
              <span className={clsx("text-sm font-medium", quest1Done ? "text-muted-text line-through" : "text-foreground")}>Review 8 flashcards</span>
              {!quest1Done && <span className="ml-auto text-xs font-bold text-amber-600">+20 XP</span>}
            </div>
            <div className="flex items-center gap-3">
              {quest2Done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
              <span className={clsx("text-sm font-medium", quest2Done ? "text-muted-text line-through" : "text-foreground")}>Complete one quiz</span>
              {!quest2Done && <span className="ml-auto text-xs font-bold text-amber-600">+30 XP</span>}
            </div>
            <div className="flex items-center gap-3">
              {quest3Done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
              <span className={clsx("text-sm font-medium", quest3Done ? "text-muted-text line-through" : "text-foreground")}>Study 25 minutes</span>
              {!quest3Done && <span className="ml-auto text-xs font-bold text-amber-600">+40 XP</span>}
            </div>
          </div>
          <div className="mt-4 flex gap-1 h-1.5 w-full">
            {[0,1,2].map(i => (
              <div key={i} className={clsx("flex-1 rounded-full", i < questsCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800")} />
            ))}
          </div>
        </div>

        {/* SECTION 4: WEEKLY CHALLENGE */}
        <div className="bg-surface rounded-xl border border-border p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Midterm Prep Challenge
              </h3>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Study {studyDaysThisWeek} / 5 days this week
            </p>
            <p className="text-xs font-bold text-blue-600 mb-4">
              Reward: +150 XP • Academic Explorer Badge
            </p>
          </div>
          <div className="flex gap-1 h-2 w-full mt-auto">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={clsx("flex-1 rounded-full", i < studyDaysThisWeek ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800")} />
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: ACADEMIC STATUS STRIP */}
      <div className="bg-surface border border-border rounded-xl flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        
        <div className="flex-1 p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-foreground leading-none mb-1">{dueCardsCount}</div>
            <div className="text-xs font-bold text-muted-text uppercase">Cards need review</div>
          </div>
          <button 
            onClick={() => setFocusReviewOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 font-bold text-xs transition"
          >
            Review Now
          </button>
        </div>
        
        <div className="flex-1 p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-rose-600 leading-none mb-1">{unresolvedMistakesCount}</div>
            <div className="text-xs font-bold text-muted-text uppercase">Active Mistakes</div>
          </div>
          <button 
            onClick={() => router.push("/study?tab=mistakes")}
            className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 font-bold text-xs transition"
          >
            Practice
          </button>
        </div>

        <div className="flex-1 p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-foreground leading-none mb-1 line-clamp-1">
              {events.find(e => e.type === "quiz" || e.type === "exam")?.title || "None scheduled"}
            </div>
            <div className="text-xs font-bold text-muted-text uppercase">Upcoming Quiz</div>
          </div>
          <button 
            onClick={() => router.push("/study")}
            className="px-3 py-1.5 rounded-lg bg-surface-muted border border-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
          >
            Take Quiz
          </button>
        </div>

      </div>

      {/* SECTION 6: TODAY'S CLASSES */}
      {todayClasses.length > 0 && (
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
            Today's Classes
          </h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {todayClasses.map((cls) => (
              <Link
                key={cls.id}
                href={`/study${cls.subjectId ? `?subjectId=${cls.subjectId}` : ""}`}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-surface-muted transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 text-xs font-bold text-muted-text shrink-0">
                    {cls.startTime}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 uppercase">
                        {cls.subjectCode}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {cls.subjectName}
                      </span>
                    </div>
                    {cls.room && (
                      <div className="text-xs font-medium text-slate-500">
                        Room: {cls.room}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: CONTINUE STUDYING / SUBJECTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Continue Studying
          </h2>
        </div>
        
        {subjects.length === 0 ? (
          <EmptyState
            character="pip"
            expression="encouraging"
            speechBubble="Welcome! Let's get your courses added!"
            title="Your study space is ready."
            description="Import your class schedule or add subjects manually to start practicing."
            actions={[
              {
                label: "Import Class Schedule",
                onClick: () => setImportScheduleOpen(true),
                variant: "primary",
              },
              {
                label: "Add Subject Manually",
                onClick: () => setQuickCreateSubjectOpen(true),
                variant: "secondary",
              },
              {
                label: "Load Sample ITST 306",
                onClick: () => {
                  if (user) loadSampleITST306Curriculum(user.id);
                },
                variant: "secondary",
              },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map(subject => {
              const masteryStats = calculateSubjectMastery(subject.id, flashcards, quizAttempts, mistakes, topics.filter(t => t.subjectId === subject.id));
              const masteryLevel = masteryStats.masteryPercentage > 85 ? "Expert" : masteryStats.masteryPercentage > 40 ? "Scholar" : "Beginner";
              const subjectCardsCount = flashcards.filter(f => f.subjectId === subject.id).length;
              const subjectQuizzesCount = quizzes.filter(q => q.subjectId === subject.id).length;

              return (
                <div key={subject.id} className="subject-card bg-surface border border-border rounded-xl p-4 flex flex-col hover:border-blue-400 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 mb-0.5">{subject.code}</div>
                      <div className="text-sm font-bold text-foreground line-clamp-1">{subject.name}</div>
                    </div>
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - masteryStats.masteryPercentage} className="text-emerald-500" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold">{masteryStats.masteryPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-4">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{masteryLevel}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-text font-medium mb-4">
                    <span>{subjectCardsCount} cards</span>
                    <span>{subjectQuizzesCount} quizzes</span>
                  </div>

                  <button 
                    onClick={() => router.push(`/study?subjectId=${subject.id}`)}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-foreground transition-colors"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Subject Modal */}
      {quickCreateSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickAddSubject}
            className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-xl space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground">Quick Add Subject</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Code (e.g. ITST 306)"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-muted"
              />
              <input
                type="text"
                placeholder="Name (e.g. Mobile Computing)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-muted"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickCreateSubjectOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-tactile px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold border-blue-800"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Import Modal */}
      <ScheduleImportModal
        isOpen={importScheduleOpen}
        onClose={() => setImportScheduleOpen(false)}
        userId={user?.id || "usr_demo"}
      />

      {/* Focus Review Modal */}
      <FocusReviewModal
        isOpen={focusReviewOpen}
        onClose={() => setFocusReviewOpen(false)}
      />

      {/* Pomodoro Focus Modal */}
      <PomodoroModal
        isOpen={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
      />
    </div>
  );
}

export default HomeView;
