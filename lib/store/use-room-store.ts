import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StudyRoom, RoomMember, QuizQuestion } from "../types";

interface RoomState {
  rooms: StudyRoom[];
  activeRoomId: string | null;
  pendingInviteCode: string | null;

  setPendingInviteCode: (code: string | null) => void;
  createRoom: (name: string, subjectId: string | undefined, hostUser: { id: string; name: string }) => StudyRoom;
  joinRoom: (code: string, user: { id: string; name: string }) => StudyRoom | null;
  leaveRoom: (roomId: string, userId: string) => void;
  setRoomActivity: (roomId: string, activity: StudyRoom["activity"]) => void;
  
  // Synchronized Pomodoro
  startGroupPomodoro: (roomId: string, durationMinutes: number) => void;
  pauseGroupPomodoro: (roomId: string) => void;
  resumeGroupPomodoro: (roomId: string) => void;
  resetGroupPomodoro: (roomId: string) => void;
  syncPomodoroTick: (roomId: string) => void;

  // Group Quiz & Race
  initGroupQuiz: (roomId: string, questions: QuizQuestion[]) => void;
  submitMemberAnswer: (roomId: string, memberId: string, answer: string) => void;
  lockGroupAnswersAndShowSummary: (roomId: string) => void;
  nextGroupQuestion: (roomId: string) => void;

  // Survival / Last One Standing
  initSurvivalMode: (roomId: string, questions: QuizQuestion[]) => void;
  applySurvivalAnswer: (roomId: string, memberId: string, isCorrect: boolean) => void;

  // Cross-tab real-time sync
  broadcastRoomUpdate: (room: StudyRoom) => void;
  receiveBroadcast: (room: StudyRoom) => void;
}

// Global broadcast channel for cross-tab multi-user real-time sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcastChannel = new BroadcastChannel("studydeck_multiplayer_sync");
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => {
      // Listen for updates from other tabs
      if (typeof window !== "undefined" && broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "ROOM_SYNC" && event.data?.room) {
            get().receiveBroadcast(event.data.room);
          }
        };
      }

      return {
        rooms: [
          // Initial sample active room UX306 for instant testability
          {
            id: "room_ux306",
            code: "UX306",
            name: "ITST 306 Midterm Review",
            hostId: "usr_lady",
            activity: "lobby",
            members: [
              {
                id: "usr_lady",
                name: "Lady (Host)",
                isHost: true,
                avatarColor: "bg-blue-600",
                joinedAt: new Date().toISOString(),
              },
              {
                id: "usr_maria",
                name: "Maria Santos",
                isHost: false,
                avatarColor: "bg-emerald-600",
                joinedAt: new Date().toISOString(),
              },
              {
                id: "usr_alex",
                name: "Alex Vance",
                isHost: false,
                avatarColor: "bg-amber-600",
                joinedAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
          },
        ],
        activeRoomId: null,
        pendingInviteCode: null,

        setPendingInviteCode: (code) => set({ pendingInviteCode: code }),

        broadcastRoomUpdate: (room: StudyRoom) => {
          if (broadcastChannel) {
            broadcastChannel.postMessage({ type: "ROOM_SYNC", room });
          }
        },

        receiveBroadcast: (updatedRoom: StudyRoom) => {
          set((state) => ({
            rooms: state.rooms.some((r) => r.id === updatedRoom.id)
              ? state.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
              : [...state.rooms, updatedRoom],
          }));
        },

        createRoom: (name, subjectId, hostUser) => {
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          const newRoom: StudyRoom = {
            id: `room_${Date.now()}`,
            code,
            name,
            subjectId,
            hostId: hostUser.id,
            activity: "lobby",
            members: [
              {
                id: hostUser.id,
                name: `${hostUser.name} (Host)`,
                isHost: true,
                avatarColor: "bg-blue-600",
                joinedAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            rooms: [...state.rooms, newRoom],
            activeRoomId: newRoom.id,
          }));

          get().broadcastRoomUpdate(newRoom);
          return newRoom;
        },

        joinRoom: (code, user) => {
          const normalized = code.trim().toUpperCase();
          const targetRoom = get().rooms.find((r) => r.code === normalized);
          if (!targetRoom) return null;

          const exists = targetRoom.members.some((m) => m.id === user.id);
          const colors = ["bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-purple-600", "bg-rose-600"];
          const avatarColor = colors[targetRoom.members.length % colors.length];

          const updatedRoom: StudyRoom = {
            ...targetRoom,
            members: exists
              ? targetRoom.members
              : [
                  ...targetRoom.members,
                  {
                    id: user.id,
                    name: user.name,
                    isHost: user.id === targetRoom.hostId,
                    avatarColor,
                    lives: 3,
                    score: 0,
                    joinedAt: new Date().toISOString(),
                  },
                ],
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
            activeRoomId: updatedRoom.id,
          }));

          get().broadcastRoomUpdate(updatedRoom);
          return updatedRoom;
        },

        leaveRoom: (roomId, userId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const updatedMembers = room.members.filter((m) => m.id !== userId);
          const updatedRoom: StudyRoom = {
            ...room,
            members: updatedMembers,
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
            activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        setRoomActivity: (roomId, activity) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const updatedRoom: StudyRoom = {
            ...room,
            activity,
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        startGroupPomodoro: (roomId, durationMinutes) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const now = Date.now();
          const durationSeconds = durationMinutes * 60;
          const targetTimestamp = now + durationSeconds * 1000;

          const updatedRoom: StudyRoom = {
            ...room,
            activity: "pomodoro",
            pomodoroState: {
              durationMinutes,
              remainingSeconds: durationSeconds,
              isRunning: true,
              startTimestamp: now,
              targetTimestamp,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        pauseGroupPomodoro: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.pomodoroState) return;

          const remaining = Math.max(
            0,
            Math.round((room.pomodoroState.targetTimestamp - Date.now()) / 1000)
          );

          const updatedRoom: StudyRoom = {
            ...room,
            pomodoroState: {
              ...room.pomodoroState,
              isRunning: false,
              remainingSeconds: remaining,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        resumeGroupPomodoro: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.pomodoroState) return;

          const now = Date.now();
          const targetTimestamp = now + room.pomodoroState.remainingSeconds * 1000;

          const updatedRoom: StudyRoom = {
            ...room,
            pomodoroState: {
              ...room.pomodoroState,
              isRunning: true,
              startTimestamp: now,
              targetTimestamp,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        resetGroupPomodoro: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.pomodoroState) return;

          const updatedRoom: StudyRoom = {
            ...room,
            pomodoroState: {
              ...room.pomodoroState,
              isRunning: false,
              remainingSeconds: room.pomodoroState.durationMinutes * 60,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        syncPomodoroTick: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.pomodoroState || !room.pomodoroState.isRunning) return;

          const remaining = Math.max(
            0,
            Math.round((room.pomodoroState.targetTimestamp - Date.now()) / 1000)
          );

          if (remaining !== room.pomodoroState.remainingSeconds) {
            const updatedRoom: StudyRoom = {
              ...room,
              pomodoroState: {
                ...room.pomodoroState,
                remainingSeconds: remaining,
                isRunning: remaining > 0,
              },
            };

            set((state) => ({
              rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
            }));
          }
        },

        initGroupQuiz: (roomId, questions) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const updatedRoom: StudyRoom = {
            ...room,
            activity: "quiz",
            quizState: {
              currentQuestionIndex: 0,
              questions,
              isAnswerLocked: false,
              showExplanation: false,
              answersSubmitted: {},
            },
            members: room.members.map((m) => ({
              ...m,
              score: 0,
              hasAnswered: false,
              currentAnswer: undefined,
            })),
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        submitMemberAnswer: (roomId, memberId, answer) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.quizState) return;

          const currentQ = room.quizState.questions[room.quizState.currentQuestionIndex];
          const isCorrect = currentQ && currentQ.correctAnswer.toLowerCase() === answer.toLowerCase();

          const updatedSubmitted = {
            ...room.quizState.answersSubmitted,
            [memberId]: answer,
          };

          const updatedMembers = room.members.map((m) => {
            if (m.id !== memberId) return m;
            return {
              ...m,
              hasAnswered: true,
              currentAnswer: answer,
              score: isCorrect ? (m.score || 0) + 100 : m.score || 0,
            };
          });

          // Check if all members have answered
          const allAnswered = updatedMembers.every((m) => updatedSubmitted[m.id]);

          const updatedRoom: StudyRoom = {
            ...room,
            members: updatedMembers,
            quizState: {
              ...room.quizState,
              answersSubmitted: updatedSubmitted,
              isAnswerLocked: allAnswered,
              showExplanation: allAnswered,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        lockGroupAnswersAndShowSummary: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.quizState) return;

          const updatedRoom: StudyRoom = {
            ...room,
            quizState: {
              ...room.quizState,
              isAnswerLocked: true,
              showExplanation: true,
            },
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        nextGroupQuestion: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room || !room.quizState) return;

          const nextIndex = room.quizState.currentQuestionIndex + 1;
          const isFinished = nextIndex >= room.quizState.questions.length;

          const updatedRoom: StudyRoom = {
            ...room,
            activity: isFinished ? "lobby" : room.activity,
            quizState: isFinished
              ? undefined
              : {
                  ...room.quizState,
                  currentQuestionIndex: nextIndex,
                  isAnswerLocked: false,
                  showExplanation: false,
                  answersSubmitted: {},
                },
            members: room.members.map((m) => ({
              ...m,
              hasAnswered: false,
              currentAnswer: undefined,
            })),
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        initSurvivalMode: (roomId, questions) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const updatedRoom: StudyRoom = {
            ...room,
            activity: "survival",
            quizState: {
              currentQuestionIndex: 0,
              questions,
              isAnswerLocked: false,
              showExplanation: false,
              answersSubmitted: {},
            },
            members: room.members.map((m) => ({
              ...m,
              lives: 3,
              score: 0,
              hasAnswered: false,
              currentAnswer: undefined,
            })),
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },

        applySurvivalAnswer: (roomId, memberId, isCorrect) => {
          const room = get().rooms.find((r) => r.id === roomId);
          if (!room) return;

          const updatedMembers = room.members.map((m) => {
            if (m.id !== memberId) return m;
            const currentLives = m.lives ?? 3;
            return {
              ...m,
              lives: isCorrect ? currentLives : Math.max(0, currentLives - 1),
              score: isCorrect ? (m.score || 0) + 100 : m.score || 0,
            };
          });

          const updatedRoom: StudyRoom = {
            ...room,
            members: updatedMembers,
          };

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
          }));

          get().broadcastRoomUpdate(updatedRoom);
        },
      };
    },
    {
      name: "studydeck_rooms_state",
    }
  )
);
