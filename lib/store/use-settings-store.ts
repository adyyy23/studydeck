import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppThemeId, LightDarkMode, AvatarId, AvatarAccessoryId, CompanionCharacterId } from "../types";

interface SettingsState {
  appTheme: AppThemeId;
  lightDarkMode: LightDarkMode;
  // Legacy — kept for compatibility but lightDarkMode is the source of truth
  theme: LightDarkMode;
  accentColor?: string; // curated hex only
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  soundEnabled: boolean;
  offlineDownloads: string[]; // list of subject IDs downloaded locally
  isOfflineMode: boolean;
  selectedAvatarId: AvatarId;
  avatarAccessory: AvatarAccessoryId;
  unlockedAccessories: AvatarAccessoryId[];
  homeCompanionId: CompanionCharacterId;
  dailyGoalMinutes: number;
  studyPoints: number;
  // Notification settings
  classReminderMinutes: -1 | 0 | 10 | 15 | 30; // -1 = at start, 0 = off
  notifyReviews: boolean;
  notifyDeadlines: boolean;
  notifyGroupStudy: boolean;

  setAppTheme: (theme: AppThemeId) => void;
  setLightDarkMode: (mode: LightDarkMode) => void;
  setAccentColor: (hex: string | undefined) => void;
  setTheme: (theme: LightDarkMode) => void; // legacy alias
  setPomodoroSettings: (work: number, breakMins: number, longBreak: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSubjectOfflineDownload: (subjectId: string) => void;
  setOfflineMode: (offline: boolean) => void;
  setSelectedAvatarId: (id: AvatarId) => void;
  setAvatarAccessory: (acc: AvatarAccessoryId) => void;
  unlockAccessory: (acc: AvatarAccessoryId) => void;
  setHomeCompanionId: (companion: CompanionCharacterId) => void;
  setDailyGoalMinutes: (mins: number) => void;
  addStudyPoints: (pts: number) => void;
  setClassReminderMinutes: (mins: -1 | 0 | 10 | 15 | 30) => void;
  setNotifyReviews: (v: boolean) => void;
  setNotifyDeadlines: (v: boolean) => void;
  setNotifyGroupStudy: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appTheme: "studydeck",
      lightDarkMode: "light",
      theme: "light",
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      soundEnabled: true,
      offlineDownloads: [],
      isOfflineMode: false,
      selectedAvatarId: "pip",
      avatarAccessory: "none",
      unlockedAccessories: ["none"],
      homeCompanionId: "pip",
      dailyGoalMinutes: 30,
      studyPoints: 120,
      classReminderMinutes: 15,
      notifyReviews: true,
      notifyDeadlines: true,
      notifyGroupStudy: true,

      setAppTheme: (appTheme) => set({ appTheme }),
      setLightDarkMode: (lightDarkMode) => set({ lightDarkMode, theme: lightDarkMode }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setTheme: (theme) => set({ theme, lightDarkMode: theme }),
      setPomodoroSettings: (work, breakMins, longBreak) =>
        set({
          pomodoroWorkMinutes: work,
          pomodoroBreakMinutes: breakMins,
          pomodoroLongBreakMinutes: longBreak,
        }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      toggleSubjectOfflineDownload: (subjectId) =>
        set((state) => {
          const exists = state.offlineDownloads.includes(subjectId);
          return {
            offlineDownloads: exists
              ? state.offlineDownloads.filter((id) => id !== subjectId)
              : [...state.offlineDownloads, subjectId],
          };
        }),
      setOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
      setSelectedAvatarId: (selectedAvatarId) => set({ selectedAvatarId }),
      setAvatarAccessory: (avatarAccessory) => set({ avatarAccessory }),
      unlockAccessory: (accessory) =>
        set((state) => ({
          unlockedAccessories: state.unlockedAccessories.includes(accessory)
            ? state.unlockedAccessories
            : [...state.unlockedAccessories, accessory],
        })),
      setHomeCompanionId: (homeCompanionId) => set({ homeCompanionId }),
      setDailyGoalMinutes: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
      addStudyPoints: (pts) => set((state) => ({ studyPoints: Math.max(0, state.studyPoints + pts) })),
      setClassReminderMinutes: (classReminderMinutes) => set({ classReminderMinutes }),
      setNotifyReviews: (notifyReviews) => set({ notifyReviews }),
      setNotifyDeadlines: (notifyDeadlines) => set({ notifyDeadlines }),
      setNotifyGroupStudy: (notifyGroupStudy) => set({ notifyGroupStudy }),
    }),
    {
      name: "studydeck_settings_state",
    }
  )
);
