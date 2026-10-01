"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Moon,
  Sun,
  Laptop,
  Users,
  Bell,
  Download,
  ShieldCheck,
  LogOut,
  Sparkles,
  Check,
  Layers,
  Palette,
  CheckCircle2,
  Shirt,
  Flame,
  Award,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useSocialStore } from "@/lib/store/use-social-store";
import { THEMES, THEME_ORDER } from "@/lib/themes";
import { AvatarId, AvatarAccessoryId, CompanionCharacterId } from "@/lib/types";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { Character, CHARACTER_META, ACCESSORY_META } from "@/components/ui/character";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_COMPANIONS: CompanionCharacterId[] = ["pip", "milo", "lumi", "barnaby", "toby", "zara"];

const ALL_ACCESSORIES: AvatarAccessoryId[] = [
  "none",
  "headphones",
  "glasses",
  "beanie",
  "headband",
  "cap",
  "badge_feather",
];

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, logout, switchTestUser, updateProfile } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const {
    appTheme,
    setAppTheme,
    lightDarkMode,
    setLightDarkMode,
    selectedAvatarId,
    setSelectedAvatarId,
    avatarAccessory,
    setAvatarAccessory,
    unlockedAccessories,
    unlockAccessory,
    homeCompanionId,
    setHomeCompanionId,
    studyPoints,
    classReminderMinutes,
    setClassReminderMinutes,
    notifyReviews,
    setNotifyReviews,
    notifyDeadlines,
    setNotifyDeadlines,
    pomodoroWorkMinutes,
    pomodoroBreakMinutes,
    setPomodoroSettings,
    soundEnabled,
    setSoundEnabled,
  } = useSettingsStore();
  const { subjects, resetAllStudyData, loadSampleITST306Curriculum } = useStudyStore();
  const { friends } = useSocialStore();

  const [activeTab, setActiveTab] = useState<"profile" | "wardrobe" | "settings" | "friends">("profile");
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  if (!isOpen || !user) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ firstName, lastName });
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-surface h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-muted/30">
            <div className="flex gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab("profile")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg transition-all",
                  activeTab === "profile"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-text hover:text-foreground"
                )}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("wardrobe")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                  activeTab === "wardrobe"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-text hover:text-foreground"
                )}
              >
                <span>Wardrobe</span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg transition-all",
                  activeTab === "settings"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-text hover:text-foreground"
                )}
              >
                Themes
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={clsx(
                  "px-3 py-1.5 rounded-lg transition-all",
                  activeTab === "friends"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-text hover:text-foreground"
                )}
              >
                Friends ({friends.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-muted-text hover:text-foreground rounded-lg hover:bg-surface-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ================= TAB 1: PROFILE ================= */}
          {activeTab === "profile" && (
            <div className="p-5 flex flex-col gap-5">
              {/* Identity Header */}
              <div className="flex items-center gap-4 card-tactile p-4">
                <AnimalAvatar
                  avatarId={selectedAvatarId}
                  accessory={avatarAccessory}
                  size="lg"
                  showPoints={true}
                  points={studyPoints}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-foreground truncate">
                      {user.firstName} {user.lastName}
                    </h2>
                    <button
                      onClick={() => setEditingName(!editingName)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {editingName ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-text truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {user.role}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      ★ {studyPoints} SP
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Name Form */}
              {editingName && (
                <form
                  onSubmit={handleSaveName}
                  className="p-3 bg-surface-muted rounded-xl border border-border flex flex-col gap-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-text font-bold">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-text font-bold">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-tactile self-end px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold border-blue-800"
                  >
                    Save Changes
                  </button>
                </form>
              )}

              {/* Academic Interests & Goals */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-2">
                    Academic Interests
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests && user.interests.length > 0 ? (
                      user.interests.map((interest, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-muted border border-border text-foreground"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-text italic">No interests listed.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-2">
                    Study Goals
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {user.studyGoals && user.studyGoals.length > 0 ? (
                      user.studyGoals.map((goal, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                        >
                          {goal}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-text italic">No goals defined.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Demo Account Switcher */}
              <div className="pt-3 border-t border-border">
                <span className="text-xs font-black uppercase tracking-wider text-muted-text block mb-2">
                  Test Student Profiles
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "usr_lady", name: "Lady (Host)", idx: 0 },
                    { id: "usr_alex", name: "Alex", idx: 1 },
                    { id: "usr_maria", name: "Maria", idx: 2 },
                  ].map((testUser) => (
                    <button
                      key={testUser.id}
                      onClick={() => switchTestUser(testUser.idx as 0 | 1 | 2)}
                      className={clsx(
                        "p-2 text-center rounded-xl border text-xs font-bold transition-all",
                        user.id === testUser.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200"
                          : "border-border hover:bg-surface-muted text-muted-text"
                      )}
                    >
                      {testUser.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: WARDROBE & COMPANIONS ================= */}
          {activeTab === "wardrobe" && (
            <div className="p-5 flex flex-col gap-6">
              {/* Active Avatar Character Preview */}
              {(() => {
                const isAnimal =
                  selectedAvatarId === "pip" ||
                  selectedAvatarId === "milo" ||
                  selectedAvatarId === "lumi" ||
                  selectedAvatarId === "barnaby" ||
                  selectedAvatarId === "toby" ||
                  selectedAvatarId === "zara";
                const activeChar: CompanionCharacterId = isAnimal
                  ? (selectedAvatarId as CompanionCharacterId)
                  : "pip";
                const meta = CHARACTER_META[activeChar];

                return (
                  <div className="card-tactile p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-blue-50/60 to-surface dark:from-blue-950/30 dark:to-surface">
                    <Character
                      character={activeChar}
                      accessory={avatarAccessory}
                      expression="happy"
                      size="xl"
                      speechBubble={`Hi! I'm ${meta?.name || "Pip"}!`}
                      bubblePosition="top"
                    />
                    <h3 className="text-base font-black text-foreground mt-2">
                      {meta?.name} {meta?.title}
                    </h3>
                    <span className="text-xs text-muted-text mt-0.5">
                      {meta?.trait}
                    </span>
                  </div>
                );
              })()}

              {/* 1. Pick Your Character Avatar */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-text mb-2.5">
                  Choose Active Animal Avatar
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_COMPANIONS.map((cid) => {
                    const isSelected = selectedAvatarId === cid;
                    return (
                      <button
                        key={cid}
                        onClick={() => setSelectedAvatarId(cid)}
                        className={clsx(
                          "btn-tactile p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all",
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500 border-b-blue-800"
                            : "border-border hover:bg-surface-muted border-b-slate-400"
                        )}
                      >
                        <AnimalAvatar avatarId={cid} size="sm" />
                        <span className="text-xs font-bold text-foreground">
                          {CHARACTER_META[cid].name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Equip Unlocked Accessories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-text">
                    Accessory Wardrobe
                  </h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {unlockedAccessories.length} / {ALL_ACCESSORIES.length} Unlocked
                  </span>
                </div>

                <div className="space-y-2">
                  {ALL_ACCESSORIES.map((acc) => {
                    const isUnlocked = unlockedAccessories.includes(acc) || acc === "none";
                    const isEquipped = avatarAccessory === acc;
                    const meta = ACCESSORY_META[acc];

                    return (
                      <div
                        key={acc}
                        className={clsx(
                          "p-3 rounded-2xl border flex items-center justify-between transition-all",
                          isEquipped
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                            : "border-border bg-surface"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              {meta.name}
                            </span>
                            <span className="text-[10px] text-muted-text">
                              {meta.unlockRequirement}
                            </span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <button
                            onClick={() => setAvatarAccessory(acc)}
                            className={clsx(
                              "btn-tactile px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                              isEquipped
                                ? "bg-blue-600 text-white border-blue-800"
                                : "border border-border hover:bg-surface-muted text-foreground"
                            )}
                          >
                            {isEquipped ? "Equipped" : "Equip"}
                          </button>
                        ) : (
                          <button
                            onClick={() => unlockAccessory(acc)}
                            className="btn-tactile px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold border-amber-700 shadow-xs"
                            title="Unlock using Study Points"
                          >
                            Unlock (50 SP)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Pick Home Companion Speaker */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-text mb-2">
                  Home Greeting Companion
                </h4>
                <select
                  value={homeCompanionId}
                  onChange={(e) => setHomeCompanionId(e.target.value as CompanionCharacterId)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-border bg-surface text-foreground focus:outline-none"
                >
                  {ALL_COMPANIONS.map((cid) => (
                    <option key={cid} value={cid}>
                      {CHARACTER_META[cid].name} {CHARACTER_META[cid].title} ({CHARACTER_META[cid].trait})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ================= TAB 3: THEMES & SETTINGS ================= */}
          {activeTab === "settings" && (
            <div className="p-5 flex flex-col gap-6">
              {/* 1. Theme Palette Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-accent" />
                    <span>8 Theme Palettes</span>
                  </h3>
                  <span className="text-[11px] font-bold text-accent">
                    {THEMES[appTheme]?.name || "Default"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {THEME_ORDER.map((themeKey) => {
                    const themeObj = THEMES[themeKey];
                    const isSelected = appTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => setAppTheme(themeKey)}
                        className={clsx(
                          "btn-tactile flex flex-col items-center p-2 rounded-2xl border text-center transition-all",
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/40 border-b-blue-800"
                            : "border-border hover:border-accent/40 bg-surface border-b-slate-400"
                        )}
                        title={themeObj.description}
                      >
                        {/* Swatch preview */}
                        <div
                          className="w-full h-8 rounded-lg mb-1.5 flex items-center justify-center border border-black/10 shadow-xs overflow-hidden"
                          style={{ backgroundColor: themeObj.light.background }}
                        >
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: themeObj.light.accent }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-foreground truncate w-full">
                          {themeObj.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Light / Dark / System Toggle */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-2">
                  Appearance Mode
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "light", label: "Light", icon: Sun },
                    { key: "dark", label: "Dark", icon: Moon },
                    { key: "system", label: "System", icon: Laptop },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = lightDarkMode === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setLightDarkMode(item.key as any);
                          setTheme(item.key);
                        }}
                        className={clsx(
                          "btn-tactile flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-colors",
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-b-blue-800"
                            : "border-border hover:bg-surface-muted text-muted-text border-b-slate-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Notifications & Reminders */}
              <div className="pt-2 border-t border-border">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-accent" />
                  <span>Class &amp; Study Reminders</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">Class Reminders</span>
                      <span className="text-[11px] text-muted-text">Alert before classes begin</span>
                    </div>
                    <select
                      value={classReminderMinutes}
                      onChange={(e) => setClassReminderMinutes(Number(e.target.value) as any)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-surface text-foreground"
                    >
                      <option value={0}>Off</option>
                      <option value={-1}>At start time</option>
                      <option value={10}>10 min before</option>
                      <option value={15}>15 min before</option>
                      <option value={30}>30 min before</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">Review Reminders</span>
                      <span className="text-[11px] text-muted-text">Alert when flashcards are due</span>
                    </div>
                    <button
                      onClick={() => setNotifyReviews(!notifyReviews)}
                      className={clsx(
                        "w-9 h-5 rounded-full transition-colors relative",
                        notifyReviews ? "bg-blue-600" : "bg-surface-muted border border-border"
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                          notifyReviews ? "left-4.5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">Task Deadlines</span>
                      <span className="text-[11px] text-muted-text">Notify upcoming quiz &amp; exam dates</span>
                    </div>
                    <button
                      onClick={() => setNotifyDeadlines(!notifyDeadlines)}
                      className={clsx(
                        "w-9 h-5 rounded-full transition-colors relative",
                        notifyDeadlines ? "bg-blue-600" : "bg-surface-muted border border-border"
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                          notifyDeadlines ? "left-4.5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Pomodoro Preferences */}
              <div className="pt-2 border-t border-border">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-3">
                  Focus Timer Settings
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Work Duration</span>
                    <select
                      value={pomodoroWorkMinutes}
                      onChange={(e) =>
                        setPomodoroSettings(Number(e.target.value), pomodoroBreakMinutes, 15)
                      }
                      className="p-2 rounded-xl border border-border bg-surface text-foreground font-semibold"
                    >
                      <option value={15}>15 minutes (Sprint)</option>
                      <option value={25}>25 minutes (Standard)</option>
                      <option value={50}>50 minutes (Deep Focus)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Break Duration</span>
                    <select
                      value={pomodoroBreakMinutes}
                      onChange={(e) =>
                        setPomodoroSettings(pomodoroWorkMinutes, Number(e.target.value), 15)
                      }
                      className="p-2 rounded-xl border border-border bg-surface text-foreground font-semibold"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-foreground">Audio Chimes</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={clsx(
                        "w-9 h-5 rounded-full transition-colors relative",
                        soundEnabled ? "bg-blue-600" : "bg-surface-muted border border-border"
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                          soundEnabled ? "left-4.5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Data & Dataset Tools */}
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-text mb-1">
                  Data &amp; Backup
                </h3>
                <button
                  onClick={() => {
                    const exportObj = {
                      user,
                      exportedAt: new Date().toISOString(),
                    };
                    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `studydeck_export_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-surface-muted flex items-center justify-between transition"
                >
                  <span>Export StudyDeck Data (.json)</span>
                  <Download className="w-4 h-4 text-muted-text" />
                </button>
                <button
                  onClick={() => {
                    loadSampleITST306Curriculum(user.id);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-surface-muted flex items-center justify-between transition"
                >
                  <span>Load ITST 306 Sample Curriculum</span>
                  <Layers className="w-4 h-4 text-muted-text" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Reset study state to start with an empty account?")) {
                      resetAllStudyData();
                      onClose();
                    }
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                >
                  Reset All Study Data to Clean State
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 4: FRIENDS ================= */}
          {activeTab === "friends" && (
            <div className="p-5 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-text">
                Connected Study Partners
              </h3>
              <div className="flex flex-col gap-2">
                {friends.map((fr) => (
                  <div
                    key={fr.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface shadow-2xs"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {fr.name}
                      </h4>
                      <p className="text-[11px] text-muted-text">{fr.email}</p>
                    </div>
                    <span
                      className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                        fr.status === "active"
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {fr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-5 border-t border-border">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-text hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDrawer;
