"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users, Copy, Check, Share2, Clock, Play, Pause, RotateCcw, Sparkles, Trophy, Heart, Plus, ArrowRight, LogOut, HelpCircle, Crown, X
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
    rooms, activeRoomId, createRoom, joinRoom, leaveRoom, setRoomActivity,
    startGroupPomodoro, pauseGroupPomodoro, resumeGroupPomodoro, resetGroupPomodoro, syncPomodoroTick,
    initGroupQuiz, submitMemberAnswer, lockGroupAnswersAndShowSummary, nextGroupQuestion,
    initSurvivalMode, applySurvivalAnswer,
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
              id: "gq_1", subjectId: "itst306", type: "multiple_choice",
              question: "What is the primary advantage of low-fidelity prototypes?",
              options: ["Fast iterative feedback", "Accurate representation", "Final client presentation", "Load testing"],
              correctAnswer: "Fast iterative feedback",
              explanation: "Low-fidelity prototypes prioritize early layout.",
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
    <div className="animate-fade-in max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-[#F2EEE6] min-h-screen font-serif text-[#332821]">
      {!activeRoom ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#D6CCBF]">
            <div>
              <h1 className="text-2xl font-bold text-[#49372D] uppercase tracking-widest">Study Rooms</h1>
              <p className="text-[#756C64] font-medium mt-1">Synchronized Study & Accountability</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setJoinModalOpen(true)}
                className="px-4 py-2 rounded-lg border-2 border-[#D6CCBF] bg-[#F7F3EA] text-[#332821] text-sm font-bold hover:bg-[#FFFCF6] transition"
              >
                Join with Code
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#49372D] text-[#FFFCF6] text-sm font-bold flex items-center gap-2 hover:bg-[#332821] transition"
              >
                <Plus className="w-4 h-4" /> Create Study Room
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#49372D]">Active Rooms</h2>
              {rooms.length === 0 ? (
                <div className="p-8 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] flex flex-col items-center justify-center text-center shadow-sm">
                  <Character character="barnaby" expression="neutral" size="sm" className="mb-4" />
                  <p className="text-sm font-bold text-[#332821] mb-6 max-w-sm">
                    No study halls are active right now. Start a room and invite your classmates to study together.
                  </p>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-[#49372D] hover:bg-[#332821] text-[#FFFCF6] text-sm font-bold transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="p-5 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] hover:bg-[#FFFCF6] hover:border-[#B77A45] transition flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                          </span>
                          <span className="text-xs font-bold text-[#756C64]">#{room.code}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#332821] mb-4">{room.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#756C64]" />
                            <span className="text-sm font-bold text-[#49372D]">{room.members.length} Studying</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77A45] px-2 py-1 rounded bg-[#D79A45]/10 border border-[#D79A45]/20">
                            {room.activity === 'lobby' ? 'Lobby' : room.activity}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-[#D6CCBF] flex justify-end">
                        <button
                          onClick={() => user && joinRoom(room.code, { id: user.id, name: `${user.firstName} ${user.lastName}` })}
                          className="px-4 py-2 rounded-lg bg-[#F2EEE6] border border-[#D6CCBF] text-[#332821] text-xs font-bold hover:bg-[#FFFCF6] transition flex items-center gap-2"
                        >
                          Join Room <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] shadow-sm">
                <h3 className="text-sm font-bold text-[#49372D] uppercase tracking-widest mb-4">How Study Rooms Work</h3>
                <ul className="space-y-4 text-sm text-[#332821] font-medium">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#D79A45] text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</span>
                    <p>Sync Pomodoro Timers to focus together.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#D79A45] text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</span>
                    <p>Run Group Quizzes to test knowledge.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#D79A45] text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</span>
                    <p>Compete in Survival Mode for fun.</p>
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-xl border border-[#D6CCBF] bg-[#FFFCF6] shadow-sm">
                <h3 className="text-sm font-bold text-[#49372D] uppercase tracking-widest mb-2">Study Hall Etiquette</h3>
                <p className="text-sm text-[#756C64]">Keep distractions low and support your peers. Accountability is key!</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
              <h1 className="text-lg font-bold text-[#332821] border-l border-[#D6CCBF] pl-3 ml-1">{activeRoom.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyCode} className="px-3 py-2 rounded-lg border border-[#D6CCBF] bg-[#F2EEE6] text-[#332821] text-xs font-bold hover:bg-[#FFFCF6] transition flex items-center gap-1.5">
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </button>
              <button onClick={() => user && leaveRoom(activeRoom.id, user.id)} className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5">
                Leave <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeRoom.activity === "lobby" && (
                <div className="p-6 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] space-y-6 shadow-sm">
                  <div className="border-b border-[#D6CCBF] pb-4">
                    <h3 className="text-lg font-bold text-[#49372D] uppercase tracking-widest">Activity Stage</h3>
                    <p className="text-sm font-medium text-[#756C64] mt-1">
                      {isHost ? "Select an activity to launch for all participants." : "Waiting for host to launch the next activity..."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-[#D6CCBF] bg-[#FFFCF6] flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-[#D79A45] text-white flex items-center justify-center mb-3"><Clock className="w-5 h-5" /></div>
                        <h4 className="text-sm font-bold text-[#332821] uppercase tracking-widest mb-2">Group Pomodoro</h4>
                        <p className="text-xs font-medium text-[#756C64] mb-4">Shared 25-minute focus session.</p>
                      </div>
                      {isHost ? <button onClick={() => startGroupPomodoro(activeRoom.id, 25)} className="w-full py-2.5 bg-[#49372D] hover:bg-[#332821] text-white rounded-lg text-sm font-bold transition">Launch</button> : <div className="text-xs font-bold text-[#756C64] text-center py-2.5">Waiting...</div>}
                    </div>
                    {/* Add other activities here simply for space */}
                    <div className="p-4 rounded-xl border border-[#D6CCBF] bg-[#FFFCF6] flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-[#332821] text-white flex items-center justify-center mb-3"><HelpCircle className="w-5 h-5" /></div>
                        <h4 className="text-sm font-bold text-[#332821] uppercase tracking-widest mb-2">Group Quiz</h4>
                        <p className="text-xs font-medium text-[#756C64] mb-4">Simultaneous quiz competition.</p>
                      </div>
                      {isHost ? <button onClick={startQuizActivity} className="w-full py-2.5 bg-[#49372D] hover:bg-[#332821] text-white rounded-lg text-sm font-bold transition">Launch</button> : <div className="text-xs font-bold text-[#756C64] text-center py-2.5">Waiting...</div>}
                    </div>
                    <div className="p-4 rounded-xl border border-[#D6CCBF] bg-[#FFFCF6] flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-red-800 text-white flex items-center justify-center mb-3"><Heart className="w-5 h-5" /></div>
                        <h4 className="text-sm font-bold text-[#332821] uppercase tracking-widest mb-2">Survival</h4>
                        <p className="text-xs font-medium text-[#756C64] mb-4">Last one standing wins.</p>
                      </div>
                      {isHost ? <button onClick={startSurvivalActivity} className="w-full py-2.5 bg-[#49372D] hover:bg-[#332821] text-white rounded-lg text-sm font-bold transition">Launch</button> : <div className="text-xs font-bold text-[#756C64] text-center py-2.5">Waiting...</div>}
                    </div>
                  </div>
                </div>
              )}
              {activeRoom.activity === "pomodoro" && activeRoom.pomodoroState && (
                <div className="p-8 rounded-xl border border-[#D6CCBF] bg-[#FFFCF6] flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#B77A45] mb-2">Synchronized Focus</span>
                  <p className="text-sm font-bold text-[#332821] mb-8">{activeRoom.members.length} focusing together</p>
                  <div className="text-6xl font-bold font-mono text-[#49372D] mb-8">{formatSeconds(activeRoom.pomodoroState.remainingSeconds)}</div>
                  {isHost && (
                    <div className="flex gap-4">
                      {activeRoom.pomodoroState.isRunning ? <button onClick={() => pauseGroupPomodoro(activeRoom.id)} className="px-6 py-3 rounded-lg border border-[#D6CCBF] bg-[#F2EEE6] font-bold text-sm hover:bg-[#FFFCF6]">Pause</button> : <button onClick={() => resumeGroupPomodoro(activeRoom.id)} className="px-6 py-3 rounded-lg bg-[#49372D] text-white font-bold text-sm">Resume</button>}
                      <button onClick={() => setRoomActivity(activeRoom.id, "lobby")} className="px-6 py-3 rounded-lg border border-[#D6CCBF] bg-[#F2EEE6] text-[#332821] font-bold text-sm hover:bg-[#FFFCF6]">End</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="p-5 rounded-xl border border-[#D6CCBF] bg-[#F7F3EA] space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#49372D] uppercase tracking-widest">In This Room</h3>
                <div className="space-y-3">
                  {activeRoom.members.map((member) => (
                    <div key={member.id} className="p-3 rounded-lg border border-[#D6CCBF] bg-[#FFFCF6] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#D6CCBF] text-[#332821] text-xs font-bold flex items-center justify-center">{member.name[0]}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#332821]">{member.name}</span>
                            {member.isHost && <Crown className="w-3.5 h-3.5 text-[#D79A45]" />}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#756C64] block">
                            {activeRoom.activity === "lobby" ? "Ready" : "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332821]/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateNewRoom} className="w-full max-w-sm bg-[#F7F3EA] p-6 rounded-xl border border-[#D6CCBF] shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#49372D] uppercase tracking-widest">Create Room</h3>
            <div>
              <label className="text-xs font-bold text-[#756C64] uppercase tracking-widest block mb-1">Room Name</label>
              <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required className="w-full text-sm font-bold p-3 rounded-lg border border-[#D6CCBF] bg-[#FFFCF6] focus:outline-none focus:border-[#B77A45]" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-3 text-sm font-bold border border-[#D6CCBF] rounded-lg text-[#332821] bg-[#F2EEE6]">Cancel</button>
              <button type="submit" className="flex-1 py-3 text-sm font-bold bg-[#49372D] text-white rounded-lg hover:bg-[#332821]">Create</button>
            </div>
          </form>
        </div>
      )}

      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332821]/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleJoinByCode} className="w-full max-w-sm bg-[#F7F3EA] p-6 rounded-xl border border-[#D6CCBF] shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#49372D] uppercase tracking-widest">Join Room</h3>
            <div>
              <input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="UX306" required className="w-full text-lg font-mono font-bold uppercase tracking-widest text-center p-4 rounded-lg border border-[#D6CCBF] bg-[#FFFCF6] focus:outline-none focus:border-[#B77A45]" autoFocus />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setJoinModalOpen(false)} className="flex-1 py-3 text-sm font-bold border border-[#D6CCBF] rounded-lg text-[#332821] bg-[#F2EEE6]">Cancel</button>
              <button type="submit" className="flex-1 py-3 text-sm font-bold bg-[#49372D] text-white rounded-lg hover:bg-[#332821]">Join</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default RoomsView;
