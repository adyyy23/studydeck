"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Copy,
  Check,
  Share2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  Heart,
  Plus,
  ArrowRight,
  LogOut,
  HelpCircle,
  Crown,
  X
} from "lucide-react";
import clsx from "clsx";
import { useRoomStore } from "@/lib/store/use-room-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { StudyRoom, RoomMember, QuizQuestion } from "@/lib/types";
import { Character } from "@/components/ui/character";

export function RoomsView() {
  const searchParams = useSearchParams();
  const {
    rooms,
    activeRoomId,
    createRoom,
    joinRoom,
    leaveRoom,
    setRoomActivity,
    startGroupPomodoro,
    pauseGroupPomodoro,
    resumeGroupPomodoro,
    resetGroupPomodoro,
    syncPomodoroTick,
    initGroupQuiz,
    submitMemberAnswer,
    lockGroupAnswersAndShowSummary,
    nextGroupQuestion,
    initSurvivalMode,
    applySurvivalAnswer,
  } = useRoomStore();

  const { user } = useAuthStore();
  const { subjects, quizzes } = useStudyStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("ITST 306 Midterm Review");
  const [newRoomSubjectId, setNewRoomSubjectId] = useState(subjects[0]?.id || "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get("room") || searchParams.get("code");
    if (codeParam && user) {
      joinRoom(codeParam, { id: user.id, name: `${user.firstName} ${user.lastName}` });
    }
  }, [searchParams, user, joinRoom]);

  useEffect(() => {
    if (!activeRoomId) return;
    const interval = setInterval(() => {
      syncPomodoroTick(activeRoomId);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoomId, syncPomodoroTick]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const isHost = activeRoom?.hostId === user?.id;

  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!activeRoom || typeof window === "undefined") return;
    const url = `${window.location.origin}/rooms?code=${activeRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    createRoom(newRoomName, newRoomSubjectId || undefined, {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    });
    setCreateModalOpen(false);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !user) return;
    const joined = joinRoom(joinCodeInput, {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    });
    if (joined) {
      setJoinCodeInput("");
      setJoinModalOpen(false);
    } else {
      alert(`No active room found with code "${joinCodeInput.toUpperCase()}".`);
    }
  };

  const startQuizActivity = () => {
    if (!activeRoom) return;
    const availableQuestions = quizzes.flatMap((q) => q.questions);
    const questionsPool: QuizQuestion[] =
      availableQuestions.length >= 3
        ? availableQuestions.slice(0, 5)
        : [
            {
              id: "gq_1",
              subjectId: "itst306",
              type: "multiple_choice",
              question: "What is the primary advantage of low-fidelity prototypes?",
              options: [
                "Fast iterative feedback on conceptual architecture",
                "Accurate representation of micro-animations",
                "Final client presentation signoff",
                "Load testing backend database queries",
              ],
              correctAnswer: "Fast iterative feedback on conceptual architecture",
              explanation: "Low-fidelity prototypes prioritize early layout and user navigation over styling details.",
            },
            {
              id: "gq_2",
              subjectId: "itst306",
              type: "multiple_choice",
              question: "Jakob Nielsen's research shows that testing with how many participants discovers ~85% of usability bugs?",
              options: ["5 participants", "25 participants", "50 participants", "100 participants"],
              correctAnswer: "5 participants",
              explanation: "5 users in iterative rounds yield the highest return on usability inspection.",
            },
            {
              id: "gq_3",
              subjectId: "itst306",
              type: "multiple_choice",
              question: "Which term describes UI properties that intuitively communicate their interaction function?",
              options: ["Affordance", "Fitts Law", "Heuristic Skeuomorphism", "Cognitive Friction"],
              correctAnswer: "Affordance",
              explanation: "Affordance conveys how a control can be used (e.g. elevated button indicates clickability).",
            },
          ];

    initGroupQuiz(activeRoom.id, questionsPool);
  };

  const startSurvivalActivity = () => {
    if (!activeRoom) return;
    const availableQuestions = quizzes.flatMap((q) => q.questions);
    initSurvivalMode(activeRoom.id, availableQuestions.slice(0, 5));
  };

  const formatSeconds = (secs?: number) => {
    if (secs === undefined || isNaN(secs)) return "25:00";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto py-6">
      {!activeRoom ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Study Rooms</h1>
              <p className="text-sm text-muted-text font-medium mt-1">
                Multiplayer synchronized study sessions
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setJoinModalOpen(true)}
                className="px-4 py-2.5 rounded-lg border-2 border-border bg-surface text-foreground text-sm font-bold hover:bg-surface-muted transition"
              >
                Join with Code
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Room</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-text mb-4">
              Active Sessions ({rooms.length})
            </h2>

            {rooms.length === 0 ? (
              <div className="p-8 rounded-xl border-2 border-dashed border-border bg-surface-subtle flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <Character
                  character="barnaby"
                  expression="neutral"
                  size="sm"
                  className="mb-4"
                />
                <p className="text-sm font-bold text-foreground mb-4 max-w-sm">
                  No active rooms right now. Create a room and invite your classmates to study together.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Study Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => {
                  const activityColors: Record<string, string> = {
                    lobby: "text-slate-500 bg-slate-100 dark:bg-slate-800",
                    pomodoro: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
                    quiz: "text-brand-700 bg-brand-50 dark:bg-brand-900/30",
                    survival: "text-red-500 bg-red-50 dark:bg-red-900/30",
                  };
                  return (
                    <div
                      key={room.id}
                      className="p-5 rounded-xl border-2 border-border bg-surface hover:border-brand-700/50 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
                          </span>
                          <span className="text-xs font-mono font-bold text-muted-text">
                            #{room.code}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-4">
                          {room.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {room.members.slice(0, 4).map((m, i) => (
                              <div
                                key={i}
                                className={clsx(
                                  "w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-surface shadow-sm",
                                  m.avatarColor || "bg-blue-600"
                                )}
                                title={m.name}
                              >
                                {m.name[0]}
                              </div>
                            ))}
                            {room.members.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-surface-muted text-muted-text text-xs font-bold flex items-center justify-center border-2 border-surface">
                                +{room.members.length - 4}
                              </div>
                            )}
                          </div>
                          <span className={clsx("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded", activityColors[room.activity] || activityColors.lobby)}>
                            Activity: {room.activity}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-border flex justify-end">
                        <button
                          onClick={() => {
                            if (user) {
                              joinRoom(room.code, {
                                id: user.id,
                                name: `${user.firstName} ${user.lastName}`,
                              });
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-bold hover:bg-brand-800 flex items-center gap-2 transition"
                        >
                          Join Room <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border-2 border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
              <span className="text-xs font-mono font-bold text-muted-text">
                #{activeRoom.code}
              </span>
              <h1 className="text-lg font-black text-foreground uppercase tracking-tight border-l-2 border-border pl-3 ml-1">
                {activeRoom.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg border border-border bg-surface-muted text-xs font-bold hover:bg-border transition flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg border border-border bg-surface-muted text-xs font-bold hover:bg-border transition flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? "Link Copied" : "Share"}
              </button>

              <button
                onClick={() => {
                  if (user) leaveRoom(activeRoom.id, user.id);
                }}
                className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center gap-1.5"
                title="Leave Room"
              >
                Leave <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeRoom.activity === "lobby" && (
                <div className="p-6 rounded-xl border-2 border-border bg-surface space-y-6">
                  <div className="border-b border-border pb-4">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                      Activity Stage
                    </h3>
                    <p className="text-sm font-medium text-muted-text mt-1">
                      {isHost
                        ? "Select an activity to launch for all participants."
                        : "Waiting for host to launch the next activity..."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-3">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">
                          Group Pomodoro
                        </h4>
                        <p className="text-xs font-medium text-muted-text mb-4">
                          Shared 25-minute focus session with real-time countdown sync.
                        </p>
                      </div>
                      {isHost ? (
                        <button
                          onClick={() => startGroupPomodoro(activeRoom.id, 25)}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition"
                        >
                          Launch
                        </button>
                      ) : (
                        <div className="text-xs font-bold text-amber-600/70 text-center py-2.5">Waiting for host...</div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-brand-700 text-white flex items-center justify-center mb-3">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">
                          Group Quiz
                        </h4>
                        <p className="text-xs font-medium text-muted-text mb-4">
                          Simultaneous quiz. Aggregates anonymous answers before explanation.
                        </p>
                      </div>
                      {isHost ? (
                        <button
                          onClick={startQuizActivity}
                          className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-bold transition"
                        >
                          Launch
                        </button>
                      ) : (
                        <div className="text-xs font-bold text-blue-600/70 text-center py-2.5">Waiting for host...</div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-red-500 text-white flex items-center justify-center mb-3">
                          <Heart className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-2">
                          Last One Standing
                        </h4>
                        <p className="text-xs font-medium text-muted-text mb-4">
                          Survival elimination mode. Each student gets 3 lives.
                        </p>
                      </div>
                      {isHost ? (
                        <button
                          onClick={startSurvivalActivity}
                          className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition"
                        >
                          Launch
                        </button>
                      ) : (
                        <div className="text-xs font-bold text-red-600/70 text-center py-2.5">Waiting for host...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeRoom.activity === "pomodoro" && activeRoom.pomodoroState && (
                <div className="p-8 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/50 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
                    Synchronized Focus
                  </span>
                  <p className="text-sm font-bold text-foreground mb-8">
                    {activeRoom.members.length} focusing together
                  </p>

                  <div className="relative flex items-center justify-center w-64 h-64 mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-amber-200 dark:text-amber-900" />
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="753.9" strokeDashoffset={753.9 * (1 - activeRoom.pomodoroState.remainingSeconds / (activeRoom.pomodoroState.durationMinutes * 60))} className="text-amber-500 timer-ring-progress" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-black font-mono text-foreground">
                        {formatSeconds(activeRoom.pomodoroState.remainingSeconds)}
                      </div>
                    </div>
                  </div>

                  {isHost && (
                    <div className="flex gap-4">
                      {activeRoom.pomodoroState.isRunning ? (
                        <button
                          onClick={() => pauseGroupPomodoro(activeRoom.id)}
                          className="px-6 py-3 rounded-lg border-2 border-amber-500 text-amber-700 bg-amber-100 font-bold text-sm hover:bg-amber-200 transition"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => resumeGroupPomodoro(activeRoom.id)}
                          className="px-6 py-3 rounded-lg bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => resetGroupPomodoro(activeRoom.id)}
                        className="px-6 py-3 rounded-lg border-2 border-border bg-surface text-foreground font-bold text-sm hover:bg-surface-muted transition"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setRoomActivity(activeRoom.id, "lobby")}
                        className="px-6 py-3 rounded-lg border-2 border-border bg-surface text-foreground font-bold text-sm hover:bg-surface-muted transition"
                      >
                        End
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeRoom.activity === "quiz" && activeRoom.quizState && (
                <div className="p-6 rounded-xl border-2 border-border bg-surface">
                  {(() => {
                    const currentQ =
                      activeRoom.quizState.questions[activeRoom.quizState.currentQuestionIndex];
                    const memberAnswer = user
                      ? activeRoom.quizState.answersSubmitted[user.id]
                      : null;
                    const answersCount = Object.keys(
                      activeRoom.quizState.answersSubmitted
                    ).length;

                    const aggregates: Record<string, number> = {};
                    currentQ.options?.forEach((opt) => {
                      aggregates[opt] = Object.values(
                        activeRoom.quizState?.answersSubmitted || {}
                      ).filter((ans) => ans === opt).length;
                    });

                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
                              Question {activeRoom.quizState.currentQuestionIndex + 1} of{" "}
                              {activeRoom.quizState.questions.length}
                            </span>
                            <h3 className="text-lg font-black text-foreground mt-2">
                              {currentQ.question}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {currentQ.options?.map((option, idx) => {
                            const isMySelection = memberAnswer === option;
                            const voteCount = aggregates[option] || 0;
                            const isCorrect = option === currentQ.correctAnswer;

                            let optStyle =
                              "border-border hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/10";
                            let iconContent = null;

                            if (activeRoom.quizState?.showExplanation) {
                              if (isCorrect) {
                                optStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100";
                                iconContent = <Check className="w-5 h-5 text-green-600" />;
                              } else if (isMySelection && !isCorrect) {
                                optStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 opacity-60";
                                iconContent = <X className="w-5 h-5 text-red-600" />;
                              } else {
                                optStyle = "border-border opacity-50";
                              }
                            } else if (isMySelection) {
                              optStyle = "border-brand-700 bg-brand-50 dark:bg-brand-900/30";
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (user && !activeRoom.quizState?.isAnswerLocked) {
                                    submitMemberAnswer(activeRoom.id, user.id, option);
                                  }
                                }}
                                disabled={Boolean(memberAnswer) || activeRoom.quizState?.isAnswerLocked}
                                className={clsx(
                                  "w-full p-4 rounded-xl border-2 text-left text-sm font-bold flex items-center justify-between transition-colors",
                                  optStyle
                                )}
                              >
                                <span className="flex-1 pr-4">{option}</span>
                                <div className="flex items-center gap-3">
                                  {activeRoom.quizState?.showExplanation && (
                                    <span className="text-xs font-mono font-bold bg-surface-muted px-2 py-1 rounded">
                                      {voteCount}
                                    </span>
                                  )}
                                  {iconContent}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {activeRoom.quizState.showExplanation && (
                          <div className="p-4 rounded-xl bg-surface-muted border-2 border-border text-sm font-medium">
                            <span className="font-bold block mb-1">Explanation:</span>
                            {currentQ.explanation}
                          </div>
                        )}

                        {isHost && (
                          <div className="pt-4 border-t border-border flex justify-end">
                            {!activeRoom.quizState.isAnswerLocked ? (
                              <button
                                onClick={() => lockGroupAnswersAndShowSummary(activeRoom.id)}
                                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition"
                              >
                                Lock Answers &amp; Reveal
                              </button>
                            ) : (
                              <button
                                onClick={() => nextGroupQuestion(activeRoom.id)}
                                className="px-6 py-3 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold transition flex items-center gap-2"
                              >
                                Next Question <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {activeRoom.activity === "survival" && (
                <div className="p-6 rounded-xl border-2 border-border bg-surface text-center">
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-4">Survival Mode</h3>
                  <p className="text-sm font-bold text-muted-text">Survival mode is currently active.</p>
                  {isHost && (
                    <button onClick={() => setRoomActivity(activeRoom.id, "lobby")} className="mt-4 px-4 py-2 bg-surface border-2 border-border rounded-lg text-sm font-bold">End Game</button>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="p-5 rounded-xl border-2 border-border bg-surface space-y-4">
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                  IN THIS ROOM ({activeRoom.members.length})
                </h3>
                
                <div className="space-y-3">
                  {activeRoom.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-lg border-2 border-border bg-surface flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-sm",
                            member.avatarColor || "bg-blue-600"
                          )}
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-foreground">
                              {member.name}
                            </span>
                            {member.isHost && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block mt-0.5">
                            {activeRoom.activity === "lobby" && "Ready"}
                            {activeRoom.activity === "pomodoro" && `Focusing • ${activeRoom.pomodoroState ? formatSeconds(activeRoom.pomodoroState.remainingSeconds) : ''}`}
                            {activeRoom.activity === "quiz" && (
                               member.hasAnswered ? "Answered" : "Thinking..."
                            )}
                            {activeRoom.activity === "survival" && `${member.lives ?? 3} Lives`}
                          </span>
                        </div>
                      </div>

                      {activeRoom.activity === "survival" && (
                        <div className="flex gap-0.5 text-red-500">
                          {Array.from({ length: member.lives ?? 3 }).map((_, i) => (
                            <Heart key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateNewRoom}
            className="w-full max-w-sm bg-surface p-6 rounded-xl border-2 border-border shadow-xl space-y-4"
          >
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
              Create Study Room
            </h3>

            <div>
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-1">Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                className="w-full text-sm font-bold p-3 rounded-lg border-2 border-border bg-surface focus:outline-none focus:border-brand-700 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-1">Subject</label>
              <select
                value={newRoomSubjectId}
                onChange={(e) => setNewRoomSubjectId(e.target.value)}
                className="w-full text-sm font-bold p-3 rounded-lg border-2 border-border bg-surface focus:outline-none focus:border-brand-700 transition"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 py-3 text-sm font-bold border-2 border-border rounded-lg text-foreground hover:bg-surface-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-sm font-bold bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleJoinByCode}
            className="w-full max-w-sm bg-surface p-6 rounded-xl border-2 border-border shadow-xl space-y-4"
          >
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
              Join Study Room
            </h3>
            <p className="text-sm font-medium text-muted-text">
              Enter the 6-character room code shared by your peer.
            </p>

            <div>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="UX306"
                required
                className="w-full text-lg font-mono font-bold uppercase tracking-widest text-center p-4 rounded-lg border-2 border-border bg-surface focus:outline-none focus:border-brand-700 transition"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="flex-1 py-3 text-sm font-bold border-2 border-border rounded-lg text-foreground hover:bg-surface-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-sm font-bold bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
