"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw, Check, Sparkles, BookOpen, Coffee, Timer } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#332821]/50 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#221B17] rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border border-[#D79A45]/30 uppercase tracking-wider">
              Milo&apos;s Focus Desk
            </span>
            <h2 className="text-xs sm:text-sm font-serif font-black text-[#332821] dark:text-[#F2EEE6]">
              Deep Study Block
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] hover:bg-[#EAE3D8] dark:hover:bg-[#2E2520] transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between items-center text-center overflow-y-auto">
          {/* Preset Buttons */}
          <div className="flex gap-2 shrink-0">
            {[
              { work: 25, brk: 5, label: "25 / 5" },
              { work: 50, brk: 10, label: "50 / 10" },
              { work: 15, brk: 3, label: "15m Sprint" },
            ].map((preset) => (
              <button
                key={preset.work}
                onClick={() => handleSelectPreset(preset.work, preset.brk)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-colors touch-target",
                  durationMinutes === preset.work
                    ? "border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45]"
                    : "border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#756C64] dark:text-[#9E9186] hover:bg-[#EAE3D8]"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Subject & Goal metadata */}
          <div className="w-full mt-3 space-y-2 shrink-0">
            {subjects.length > 0 && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] font-semibold focus:outline-none focus:border-[#B77A45]"
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
              className="w-full text-xs p-2.5 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] focus:outline-none focus:border-[#B77A45]"
            />
          </div>

          {/* Milo Mascot Scene */}
          <div className="my-2 sm:my-3 flex flex-col items-center shrink-0">
            <Character
              character="milo"
              expression={isCompleted ? "celebrating" : isRunning ? "studying" : "neutral"}
              size="md"
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
          <div className="mb-2 shrink-0">
            <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[#332821] dark:text-[#F2EEE6]">
              {formatTime(secondsRemaining)}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] font-bold text-[#B77A45] dark:text-[#D79A45] uppercase tracking-widest">
              {isCompleted ? "✓ Focus Goal Complete (+20 SP)" : isRunning ? "Deep Focus in Progress" : "Ready to Start"}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#EAE3D8] dark:bg-[#2E2520] rounded-full h-1.5 overflow-hidden mb-4 shrink-0">
            <div
              className="bg-[#D79A45] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 w-full shrink-0">
            <button
              onClick={handleReset}
              className="btn-secondary p-2.5 sm:p-3 text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] touch-target"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                className="btn-primary flex-1 py-2.5 sm:py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 touch-target"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(true)}
                className="btn-primary flex-1 py-2.5 sm:py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 touch-target"
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
              className="btn-secondary py-2.5 sm:py-3 px-4 text-xs font-bold uppercase tracking-wider touch-target"
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
