"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw, Check, Sparkles, BookOpen, Coffee } from "lucide-react";
import clsx from "clsx";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { Character } from "@/components/ui/character";

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export function PomodoroModal({
  isOpen,
  onClose,
  defaultSubjectId,
}: PomodoroModalProps) {
  const { subjects } = useStudyStore();
  const { logSession } = useAcademicStore();
  const { user } = useAuthStore();
  const { pomodoroWorkMinutes, pomodoroBreakMinutes, soundEnabled, addStudyPoints } =
    useSettingsStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    defaultSubjectId || (subjects[0]?.id ?? "")
  );
  const [goal, setGoal] = useState("Focus on core concept retention & notes review");
  const [mode, setMode] = useState<"work" | "break">("work");
  const [durationMinutes, setDurationMinutes] = useState<number>(pomodoroWorkMinutes || 25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    (pomodoroWorkMinutes || 25) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (defaultSubjectId) setSelectedSubjectId(defaultSubjectId);
    else if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [defaultSubjectId, subjects, selectedSubjectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      setIsCompleted(true);
      addStudyPoints(20);

      // Play chime if enabled
      if (soundEnabled && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        } catch {
          // AudioContext blocked
        }
      }

      // Record study session
      if (user && mode === "work") {
        logSession({
          userId: user.id,
          subjectId: selectedSubjectId || undefined,
          type: "pomodoro",
          durationMinutes,
          notes: goal,
        });
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, mode, user, selectedSubjectId, durationMinutes, goal, soundEnabled, logSession, addStudyPoints]);

  if (!isOpen) return null;

  const handleSelectPreset = (workMins: number, breakMins: number) => {
    setIsRunning(false);
    setIsCompleted(false);
    setMode("work");
    setDurationMinutes(workMins);
    setSecondsRemaining(workMins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsRemaining(durationMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const progressPercent =
    ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-surface rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[490px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-gradient-to-r from-amber-500/10 via-surface to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
              Milo&apos;s Focus Desk
            </span>
            <h2 className="text-sm font-bold text-foreground">
              Deep Pomodoro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col justify-between items-center text-center">
          {/* Preset Buttons */}
          <div className="flex gap-2">
            {[
              { work: 25, brk: 5, label: "25 / 5" },
              { work: 50, brk: 10, label: "50 / 10" },
              { work: 15, brk: 3, label: "15m Sprint" },
            ].map((preset) => (
              <button
                key={preset.work}
                onClick={() => handleSelectPreset(preset.work, preset.brk)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all",
                  durationMinutes === preset.work
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 shadow-xs"
                    : "border-border text-muted-text hover:bg-surface-muted"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Subject & Goal metadata */}
          <div className="w-full mt-3 space-y-2">
            {subjects.length > 0 && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-surface-muted/50 text-foreground focus:outline-none"
            />
          </div>

          {/* Milo Mascot Scene */}
          <div className="my-3 flex flex-col items-center">
            <Character
              character="milo"
              expression={isCompleted ? "celebrating" : isRunning ? "studying" : "neutral"}
              size="lg"
              speechBubble={
                isCompleted
                  ? "Splendid focus! Take a deep breath and sip some tea."
                  : isRunning
                  ? "Serene and steady. One concept at a time."
                  : "Ready for deep study? Let's begin."
              }
              bubblePosition="top"
            />
          </div>

          {/* Large Countdown Display */}
          <div className="mb-3">
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-foreground">
              {formatTime(secondsRemaining)}
            </div>
            <div className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              {isCompleted ? "✓ Focus Goal Complete (+20 SP)" : isRunning ? "Deep Focus in Progress" : "Ready to Start"}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-5">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Actions (Tactile 3D Buttons) */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleReset}
              className="btn-tactile p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-muted-text hover:bg-surface-muted border-b-slate-400"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                className="btn-tactile flex-1 py-3 px-4 rounded-xl border-amber-800 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(true)}
                className="btn-tactile flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs border-amber-800 flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{secondsRemaining < durationMinutes * 60 ? "Resume" : "Start Focus"}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isRunning && user) {
                  const elapsedMinutes = Math.max(
                    1,
                    Math.round((durationMinutes * 60 - secondsRemaining) / 60)
                  );
                  logSession({
                    userId: user.id,
                    subjectId: selectedSubjectId || undefined,
                    type: "pomodoro",
                    durationMinutes: elapsedMinutes,
                    notes: `Early finish: ${goal}`,
                  });
                }
                onClose();
              }}
              className="btn-tactile py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-muted-text text-xs font-bold hover:bg-surface-muted border-b-slate-400"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PomodoroModal;
