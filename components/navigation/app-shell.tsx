'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  Search,
  Bell,
  Sparkles,
  Timer,
  Flame,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/ui/logo";
import { AnimalAvatar } from "@/components/ui/animal-avatar";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useSocialStore } from "@/lib/store/use-social-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { GlobalSearchModal } from "@/components/search/global-search-modal";
import { ProfileDrawer } from "@/components/profile/profile-drawer";
import { NotificationsModal } from "@/components/notifications/notifications-modal";
import { PomodoroModal } from "@/components/pomodoro/pomodoro-modal";
import { ContextualAIDrawer } from "@/components/ai/contextual-ai-drawer";
import { XPBar } from '@/components/ui/xp-bar';
import { LevelBadge, getLevelFromXP } from '@/components/ui/level-badge';
import { StreakTracker } from '@/components/ui/streak-tracker';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { notifications } = useSocialStore();
  const { selectedAvatarId, avatarAccessory, studyPoints } = useSettingsStore();
  const { calculateStreak } = useAcademicStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentStreak = calculateStreak();
  const levelInfo = getLevelFromXP(studyPoints);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Study", href: "/study", icon: BookOpen },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Rooms", href: "/rooms", icon: Users },
    { label: "Progress", href: "/progress", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Desktop Persistent Left Navigation Rail */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface h-screen sticky top-0 px-4 py-6 justify-between select-none shrink-0">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Brand Logo */}
            <Link href="/" className="px-2 focus:outline-none">
              <Logo size="md" showWordmark={true} tagline={true} />
            </Link>

            {/* XP Widget */}
            <div className="px-3 py-3 border border-border rounded-lg bg-surface-muted mx-2">
              <div className="flex items-center justify-between mb-1.5">
                <LevelBadge level={levelInfo.level} title={levelInfo.title} size="sm" />
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{studyPoints} XP</span>
              </div>
              <XPBar current={levelInfo.currentXP} max={levelInfo.nextLevelXP} variant="amber" />
              <div className="text-[9px] text-muted-text mt-1 text-right">
                {levelInfo.nextLevelXP - levelInfo.currentXP} XP to Lv.{levelInfo.level + 1}
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="px-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-muted-text bg-surface-muted border border-border rounded-xl hover:border-muted-text transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-text" />
                <span className="font-medium">Search...</span>
              </span>
              <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border font-mono font-bold text-muted-text shadow-sm">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-100",
                    isActive
                      ? "bg-accent-light text-accent-text border-l-2 border-accent rounded-r-lg rounded-l-sm"
                      : "text-muted-text hover:bg-surface-muted hover:text-foreground rounded-lg border-l-2 border-transparent"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4",
                      isActive
                        ? "text-accent"
                        : "text-muted-text"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-border mx-2" />

          {/* Quick Companion Tools: Milo Pomodoro + Lumi AI */}
          <div className="flex flex-col gap-2 px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-text mb-1">
              Tools
            </span>
            <button
              onClick={() => setPomodoroOpen(true)}
              className="group flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-surface-muted text-muted-text group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Timer className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold">Milo&apos;s Focus</div>
              </div>
            </button>

            <button
              onClick={() => setAiOpen(true)}
              className="group flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-surface-muted text-muted-text group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold">Lumi AI Assistant</div>
              </div>
            </button>
          </div>
        </div>

        {/* User Footer Profile & Notifications */}
        <div className="pt-4 border-t border-border flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-muted-text hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="text-[10px] font-bold text-muted-text hover:text-foreground uppercase tracking-wider transition-colors"
            >
              Wardrobe
            </button>
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-surface-muted transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <AnimalAvatar
                avatarId={selectedAvatarId}
                accessory={avatarAccessory}
                size="sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] font-semibold text-muted-text truncate">Lv.{levelInfo.level} {levelInfo.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Flame className={clsx("w-3.5 h-3.5", currentStreak > 0 ? "text-amber-500 fill-amber-500" : "text-muted-text")} />
              <span className={clsx("text-xs font-bold", currentStreak > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-text")}>{currentStreak}</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-border px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            <Logo size="sm" showWordmark={true} />
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{currentStreak}d</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-muted border border-border text-foreground font-bold text-[10px]">
              <span>Lv.{levelInfo.level}</span>
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 text-muted-text hover:text-foreground hover:bg-surface-muted rounded-md transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-1.5 text-muted-text hover:text-foreground hover:bg-surface-muted rounded-md transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="focus:outline-none"
              aria-label="User Profile"
            >
              <AnimalAvatar
                avatarId={selectedAvatarId}
                accessory={avatarAccessory}
                size="sm"
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-2 py-1 flex items-center justify-around select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-center",
                isActive
                  ? "text-accent font-bold"
                  : "text-muted-text hover:text-foreground"
              )}
            >
              <Icon className={clsx("w-5 h-5 mb-0.5", isActive && "fill-accent/20")} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <PomodoroModal isOpen={pomodoroOpen} onClose={() => setPomodoroOpen(false)} />
      <ContextualAIDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        contextTitle="StudyDeck Course Knowledge"
      />
    </div>
  );
}

export default AppShell;
