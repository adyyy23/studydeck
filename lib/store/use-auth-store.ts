import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "../types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
  }) => Promise<boolean>;
  completeOnboarding: (data: {
    role: UserRole;
    interests: string[];
    studyGoals: string[];
  }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  switchTestUser: (userIndex: 0 | 1 | 2) => void;
}

const TEST_USERS: UserProfile[] = [
  {
    id: "usr_lady",
    email: "lady@studydeck.edu",
    firstName: "Lady",
    lastName: "Caragay",
    role: "student",
    interests: ["IT / Computer Science", "UX/UI Design", "Engineering"],
    studyGoals: ["Prepare for exams", "Build better study habits"],
    avatarUrl: "",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "usr_alex",
    email: "alex@studydeck.edu",
    firstName: "Alex",
    lastName: "Vance",
    role: "student",
    interests: ["IT / Computer Science", "Software Architecture"],
    studyGoals: ["Improve grades"],
    avatarUrl: "",
    createdAt: "2026-09-02T10:00:00.000Z",
  },
  {
    id: "usr_maria",
    email: "maria@studydeck.edu",
    firstName: "Maria",
    lastName: "Santos",
    role: "student",
    interests: ["UX/UI Design", "Product Research"],
    studyGoals: ["Learn consistently"],
    avatarUrl: "",
    createdAt: "2026-09-03T11:00:00.000Z",
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,

      login: async (email: string) => {
        // Find existing or mock user login
        const existing = TEST_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        const user: UserProfile = existing || {
          id: `usr_${Date.now()}`,
          email,
          firstName: email.split("@")[0] || "Student",
          lastName: "",
          role: "student",
          interests: [],
          studyGoals: [],
          createdAt: new Date().toISOString(),
        };

        set({
          user,
          isAuthenticated: true,
          isOnboarded: (user.interests && user.interests.length > 0) || false,
        });
        return true;
      },

      signup: async ({ firstName, lastName, email }) => {
        const newUser: UserProfile = {
          id: `usr_${Date.now()}`,
          email,
          firstName,
          lastName,
          role: "student",
          interests: [],
          studyGoals: [],
          createdAt: new Date().toISOString(),
        };

        set({
          user: newUser,
          isAuthenticated: true,
          isOnboarded: false,
        });
        return true;
      },

      completeOnboarding: ({ role, interests, studyGoals }) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser: UserProfile = {
          ...currentUser,
          role,
          interests,
          studyGoals,
        };
        set({
          user: updatedUser,
          isOnboarded: true,
        });
      },

      updateProfile: (data) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: { ...currentUser, ...data },
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
        });
      },

      switchTestUser: (userIndex) => {
        const target = TEST_USERS[userIndex] || TEST_USERS[0];
        set({
          user: target,
          isAuthenticated: true,
          isOnboarded: true,
        });
      },
    }),
    {
      name: "studydeck_auth_session",
    }
  )
);
