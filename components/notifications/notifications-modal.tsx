"use client";

import React from "react";
import { X, Bell, BookOpen, Users, Calendar, Check, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSocialStore } from "@/lib/store/use-social-store";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const router = useRouter();
  const { notifications, markNotificationAsRead, clearAllNotifications } = useSocialStore();

  if (!isOpen) return null;

  const handleNotificationClick = (id: string, link?: string) => {
    markNotificationAsRead(id);
    onClose();
    if (link) router.push(link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "review_due":
        return <BookOpen className="w-4 h-4 text-brand-600 dark:text-blue-400" />;
      case "room_invite":
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "exam":
      case "task_due":
        return <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Academic Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-3 flex-1 flex flex-col gap-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No notifications. Your study agenda is up to date.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.link)}
                className={clsx(
                  "p-3 rounded-lg border text-left cursor-pointer transition-colors flex items-start gap-3",
                  notif.read
                    ? "border-slate-100 dark:border-slate-800 bg-surface text-slate-600 dark:text-slate-400"
                    : "border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100"
                )}
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold truncate">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
