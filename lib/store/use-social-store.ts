import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Friend, SharedStudySet, NotificationItem, Flashcard, QuizQuestion } from "../types";

interface SocialState {
  friends: Friend[];
  sharedSets: SharedStudySet[];
  notifications: NotificationItem[];

  addFriend: (name: string, email: string) => void;
  removeFriend: (id: string) => void;
  shareStudySet: (data: {
    title: string;
    subjectName: string;
    authorName: string;
    flashcards: Partial<Flashcard>[];
    questions: Partial<QuizQuestion>[];
  }) => SharedStudySet;
  getSharedSetByCode: (code: string) => SharedStudySet | undefined;
  markNotificationAsRead: (id: string) => void;
  addNotification: (data: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  clearAllNotifications: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      friends: [
        {
          id: "fr_1",
          name: "Alex Vance",
          email: "alex@studydeck.edu",
          status: "active",
        },
        {
          id: "fr_2",
          name: "Maria Santos",
          email: "maria@studydeck.edu",
          status: "active",
        },
        {
          id: "fr_3",
          name: "David Kim",
          email: "david@studydeck.edu",
          status: "pending",
        },
      ],
      sharedSets: [
        {
          id: "set_sample_1",
          shareCode: "UX-MIDTERM",
          title: "ITST 306 — Core Exam Vocabulary & Heuristics",
          subjectName: "ITST 306",
          authorName: "Alex Vance",
          flashcards: [
            {
              front: "Heuristic Evaluation",
              back: "A usability inspection method where evaluators examine an interface against recognized usability principles.",
              type: "term_def",
            },
            {
              front: "Fitts's Law",
              back: "The time required to rapidly move to a target area is a function of the ratio between the distance to the target and the width of the target.",
              type: "term_def",
            },
            {
              front: "Hick's Law",
              back: "The time it takes to make a decision increases logarithmically with the number and complexity of choices.",
              type: "term_def",
            },
          ],
          questions: [
            {
              type: "multiple_choice",
              question: "Which law explains why larger call-to-action buttons placed closer to the thumb zone are faster to tap?",
              options: ["Fitts's Law", "Hick's Law", "Miller's Law", "Moore's Law"],
              correctAnswer: "Fitts's Law",
              explanation: "Fitts's law models target acquisition time as a function of target distance and target size.",
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      notifications: [
        {
          id: "notif_1",
          userId: "usr_lady",
          title: "18 Flashcards Due for Review",
          message: "Keep your retention high by completing today's spaced review session.",
          type: "review_due",
          link: "/study",
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif_2",
          userId: "usr_lady",
          title: "Group Study Room UX306 Live",
          message: "Alex Vance and Maria Santos are studying in ITST 306 Midterm Review.",
          type: "room_invite",
          link: "/rooms?code=UX306",
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],

      addFriend: (name, email) => {
        const newFriend: Friend = {
          id: `fr_${Date.now()}`,
          name,
          email,
          status: "pending",
        };
        set((state) => ({ friends: [...state.friends, newFriend] }));
      },

      removeFriend: (id) => {
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== id),
        }));
      },

      shareStudySet: (data) => {
        const shareCode = `${data.subjectName.replace(/\s+/g, "").substring(0, 4)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
        const newSet: SharedStudySet = {
          ...data,
          id: `set_${Date.now()}`,
          shareCode,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sharedSets: [...state.sharedSets, newSet] }));
        return newSet;
      },

      getSharedSetByCode: (code) => {
        const normalized = code.trim().toUpperCase();
        return get().sharedSets.find((s) => s.shareCode === normalized);
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      addNotification: (data) => {
        const newNotif: NotificationItem = {
          ...data,
          id: `notif_${Date.now()}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },

      clearAllNotifications: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
    }),
    {
      name: "studydeck_social_state",
    }
  )
);
