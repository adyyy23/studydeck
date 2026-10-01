import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "../types";
import { getSupabaseClient } from "../supabase/client";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  completeOnboarding: (data: {
    role: UserRole;
    interests: string[];
    studyGoals: string[];
  }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  initializeFromSupabase: () => Promise<void>;
  // Keep switchTestUser for demo fallback when no Supabase keys configured
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
    interests: ["IT / Computer Science"],
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
    interests: ["UX/UI Design"],
    studyGoals: ["Learn consistently"],
    avatarUrl: "",
    createdAt: "2026-09-03T11:00:00.000Z",
  },
];

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && url !== "your_supabase_project_url" && key && key !== "your_supabase_anon_key");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      error: null,

      initializeFromSupabase: async () => {
        if (!hasSupabaseConfig()) return;
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email ?? "",
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role as UserRole,
            interests: profile.study_interests ?? [],
            studyGoals: profile.study_goals ?? [],
            avatarUrl: profile.avatar_url ?? "",
            createdAt: profile.created_at,
          };
          set({
            user: userProfile,
            isAuthenticated: true,
            isOnboarded: profile.is_onboarded,
          });
        }
      },

      login: async (email: string, password: string) => {
        if (!hasSupabaseConfig()) {
          // Demo fallback
          const existing = TEST_USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (existing) {
            set({ user: existing, isAuthenticated: true, isOnboarded: true });
            return true;
          }
          set({ error: "No Supabase configuration found. Use demo login." });
          return false;
        }

        set({ isLoading: true, error: null });
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          set({ isLoading: false, error: error.message });
          return false;
        }

        if (!data.user) {
          set({ isLoading: false, error: "Login failed." });
          return false;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email ?? "",
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          role: (profile?.role ?? "student") as UserRole,
          interests: profile?.study_interests ?? [],
          studyGoals: profile?.study_goals ?? [],
          avatarUrl: "",
          createdAt: profile?.created_at ?? new Date().toISOString(),
        };

        set({
          user: userProfile,
          isAuthenticated: true,
          isOnboarded: profile?.is_onboarded ?? false,
          isLoading: false,
        });
        return true;
      },

      signup: async ({ firstName, lastName, email, password }) => {
        if (!hasSupabaseConfig()) {
          // Demo fallback
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
          set({ user: newUser, isAuthenticated: true, isOnboarded: false });
          return true;
        }

        set({ isLoading: true, error: null });
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName },
          },
        });

        if (error) {
          set({ isLoading: false, error: error.message });
          return false;
        }

        if (!data.user) {
          set({ isLoading: false, error: "Signup failed." });
          return false;
        }

        // Upsert profile (trigger may already create it)
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          is_onboarded: false,
        });

        const userProfile: UserProfile = {
          id: data.user.id,
          email,
          firstName,
          lastName,
          role: "student",
          interests: [],
          studyGoals: [],
          avatarUrl: "",
          createdAt: new Date().toISOString(),
        };

        set({
          user: userProfile,
          isAuthenticated: true,
          isOnboarded: false,
          isLoading: false,
        });
        return true;
      },

      completeOnboarding: async ({ role, interests, studyGoals }) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser: UserProfile = {
          ...currentUser,
          role,
          interests,
          studyGoals,
        };

        set({ user: updatedUser, isOnboarded: true });

        if (hasSupabaseConfig()) {
          const supabase = getSupabaseClient();
          await supabase.from("profiles").update({
            role,
            study_interests: interests,
            study_goals: studyGoals,
            is_onboarded: true,
            updated_at: new Date().toISOString(),
          }).eq("id", currentUser.id);
        }
      },

      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...data };
        set({ user: updatedUser });

        if (hasSupabaseConfig()) {
          const supabase = getSupabaseClient();
          await supabase.from("profiles").update({
            first_name: updatedUser.firstName,
            last_name: updatedUser.lastName,
            updated_at: new Date().toISOString(),
          }).eq("id", currentUser.id);
        }
      },

      logout: async () => {
        if (hasSupabaseConfig()) {
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();
        }
        set({ user: null, isAuthenticated: false, isOnboarded: false, error: null });
      },

      switchTestUser: (userIndex) => {
        const target = TEST_USERS[userIndex] || TEST_USERS[0];
        set({ user: target, isAuthenticated: true, isOnboarded: true });
      },
    }),
    { name: "studydeck_auth_session" }
  )
);
