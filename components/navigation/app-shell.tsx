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

  const isStudy = pathname.startsWith("/study");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Desktop Persistent Left Navigation Rail */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#D6CCBF] dark:border-[#44372E] bg-[#F7F3EA] dark:bg-[#171310] h-screen sticky top-0 px-4 py-6 justify-between select-none shrink-0 z-30">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {/* Brand Logo */}
            <Link href="/" className="px-2 focus:outline-none">
              <Logo size="md" showWordmark={true} tagline={true} />
            </Link>

            {/* Student Progression - Field Journal Style */}
            <div className="px-2">
              <div className="flex items-end justify-between mb-1">
                <div>
                  <div className="text-[10px] font-bold text-[#654A3A] dark:text-[#D09A68] tracking-widest uppercase">LV. {levelInfo.level}</div>
                  <div className="text-xs font-black text-[#332821] dark:text-[#F2EADF] tracking-widest uppercase">{levelInfo.title}</div>
                </div>
                <div className="text-[10px] font-bold text-[#756C64] dark:text-[#B9ADA1]">
                  {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
                </div>
              </div>
              <div className="h-1 bg-[#D6CCBF] dark:bg-[#44372E] rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-[#B77A45] dark:bg-[#D09A68] transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, Math.max(0, (levelInfo.currentXP / levelInfo.nextLevelXP) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="px-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-[#756C64] dark:text-[#B9ADA1] bg-[#EAE3D8] dark:bg-[#29211C] border border-[#D6CCBF] dark:border-[#44372E] rounded-md hover:border-[#805B43] dark:hover:border-[#D09A68] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#756C64] dark:text-[#B9ADA1]" strokeWidth={1.75} />
                <span className="font-medium font-sans">Search...</span>
              </span>
              <kbd className="text-[10px] bg-[#F7F3EA] dark:bg-[#211A16] px-1.5 py-0.5 rounded border border-[#D6CCBF] dark:border-[#44372E] font-mono font-bold shadow-sm">
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
                    "flex items-center gap-3 px-3 py-2 text-sm font-bold transition-all duration-100",
                    isActive
                      ? "bg-[#EAE3D8] dark:bg-[#29211C] text-[#332821] dark:text-[#F2EADF] border-l-2 border-[#654A3A] dark:border-[#D09A68]"
                      : "text-[#756C64] dark:text-[#B9ADA1] hover:bg-[#EAE3D8]/50 dark:hover:bg-[#29211C]/50 hover:text-[#332821] dark:hover:text-[#F2EADF] border-l-2 border-transparent"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4",
                      isActive
                        ? "text-[#654A3A] dark:text-[#D09A68]"
                        : "text-[#756C64] dark:text-[#B9ADA1]"
                    )}
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-[#D6CCBF] dark:bg-[#44372E] mx-2" />

          {/* Quick Companion Tools */}
          <div className="flex flex-col gap-2 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#756C64] dark:text-[#B9ADA1] mb-1">
              Tools
            </span>
            <button
              onClick={() => setPomodoroOpen(true)}
              className="group flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-semibold text-[#332821] dark:text-[#F2EADF] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] transition-colors text-left"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-[#EAE3D8] dark:bg-[#29211C] text-[#756C64] dark:text-[#B9ADA1] group-hover:bg-[#D79A45] group-hover:text-white transition-colors relative">
                <Timer className="w-3.5 h-3.5" strokeWidth={1.75} />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#B77A45] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="min-w-0">
                <div className="font-bold">Milo&apos;s Focus</div>
              </div>
            </button>

            <button
              onClick={() => setAiOpen(true)}
              className="group flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-semibold text-[#332821] dark:text-[#F2EADF] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] transition-colors text-left"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-[#EAE3D8] dark:bg-[#29211C] text-[#756C64] dark:text-[#B9ADA1] group-hover:bg-[#6B4E71] group-hover:text-white transition-colors relative">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#6B4E71] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="min-w-0">
                <div className="font-bold">Lumi AI Assistant</div>
              </div>
            </button>
          </div>
        </div>

        {/* User Footer Profile & Notifications */}
        <div className="pt-4 border-t border-[#D6CCBF] dark:border-[#44372E] flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-1.5 text-[#756C64] dark:text-[#B9ADA1] hover:text-[#332821] dark:hover:text-[#F2EADF] rounded-md hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#D79A45] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="text-[9px] font-bold text-[#756C64] dark:text-[#B9ADA1] hover:text-[#332821] dark:hover:text-[#F2EADF] uppercase tracking-wider transition-colors underline decoration-[#D6CCBF] dark:decoration-[#44372E] underline-offset-2"
            >
              Wardrobe
            </button>
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <AnimalAvatar
                avatarId={selectedAvatarId}
                accessory={avatarAccessory}
                size="sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#332821] dark:text-[#F2EADF] truncate group-hover:text-[#654A3A] dark:group-hover:text-[#D09A68] transition-colors">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] font-semibold text-[#756C64] dark:text-[#B9ADA1] truncate">Lv.{levelInfo.level} • {levelInfo.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Flame className={clsx("w-3.5 h-3.5", currentStreak > 0 ? "text-[#D79A45] fill-[#D79A45]" : "text-[#D6CCBF] dark:text-[#44372E]")} strokeWidth={1.75} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={clsx(
        "flex-1 flex flex-col min-w-0",
        isStudy ? "h-screen overflow-hidden" : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8"
      )}>
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-[#F7F3EA]/95 dark:bg-[#171310]/95 backdrop-blur-sm border-b border-[#D6CCBF] dark:border-[#44372E] px-3 sm:px-4 py-2.5 flex items-center justify-between safe-top">
          <Link href="/" className="focus:outline-none shrink-0 mr-2">
            <Logo size="sm" showWordmark={true} />
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFFBEB] dark:bg-[#29211C] border border-[#D79A45]/30 text-[#B77A45] dark:text-[#D09A68] font-bold text-[10px]">
              <Flame className="w-3 h-3 text-[#D79A45] fill-[#D79A45]" />
              <span>{currentStreak}d</span>
            </div>
            <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EAE3D8] dark:bg-[#29211C] border border-[#D6CCBF] dark:border-[#44372E] text-[#332821] dark:text-[#F2EADF] font-bold text-[10px]">
              <span>Lv.{levelInfo.level}</span>
            </div>

            {/* Quick Mobile Tools: Milo & Lumi */}
            <button
              onClick={() => setPomodoroOpen(true)}
              className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#B9ADA1] dark:hover:text-[#F2EADF] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] rounded-md transition-colors"
              aria-label="Milo Focus Timer"
              title="Milo's Focus Timer"
            >
              <Timer className="w-4 h-4 text-[#B77A45]" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setAiOpen(true)}
              className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#B9ADA1] dark:hover:text-[#F2EEE6] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] rounded-md transition-colors"
              aria-label="Lumi AI Assistant"
              title="Lumi AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-[#6B4E71]" strokeWidth={1.75} />
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#B9ADA1] dark:hover:text-[#F2EADF] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] rounded-md transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#B9ADA1] dark:hover:text-[#F2EADF] hover:bg-[#EAE3D8] dark:hover:bg-[#29211C] rounded-md transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#D79A45] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="focus:outline-none shrink-0"
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
        <main className={clsx(
          "flex-1 w-full",
          isStudy
            ? "h-[calc(100dvh-3.5rem)] md:h-screen overflow-hidden p-0"
            : "max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-5 md:py-8"
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar with Safe Area Inset */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F3EA]/95 dark:bg-[#171310]/95 backdrop-blur-md border-t border-[#D6CCBF] dark:border-[#44372E] px-1 sm:px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 py-1 transition-all text-center touch-target",
                isActive
                  ? "text-[#654A3A] dark:text-[#D09A68] font-bold"
                  : "text-[#756C64] dark:text-[#B9ADA1] hover:text-[#332821] dark:hover:text-[#F2EADF]"
              )}
            >
              <Icon className={clsx("w-5 h-5 mb-0.5", isActive && "fill-[#654A3A]/10 dark:fill-[#D09A68]/10")} strokeWidth={1.75} />
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
