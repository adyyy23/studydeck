"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Layers,
  BookOpen,
  Users,
  Flag,
  GraduationCap,
  MapPin,
  User,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { CalendarEvent, AcademicTask, EventType, TaskPriority } from "@/lib/types";
import { ExamPlannerModal } from "@/components/exam-planner/exam-planner-modal";
import { ManageScheduleView } from "@/components/schedule/manage-schedule-view";

export function CalendarView() {
  const { events, tasks, examPlans, addEvent, addTask, toggleTaskStatus, deleteTask } =
    useAcademicStore();
  const { subjects } = useStudyStore();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = useState<"month" | "agenda">("agenda");
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Modals
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [examPlannerOpen, setExamPlannerOpen] = useState(false);
  const [showManageSchedule, setShowManageSchedule] = useState(false);

  // Form states for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("quiz");
  const [eventDate, setEventDate] = useState(selectedDateStr);
  const [eventTime, setEventTime] = useState("10:00");
  const [eventSubjectId, setEventSubjectId] = useState(subjects[0]?.id || "");

  // Form states for new task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(selectedDateStr);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskSubjectId, setTaskSubjectId] = useState(subjects[0]?.id || "");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !user) return;

    addEvent({
      userId: user.id,
      title: eventTitle,
      type: eventType,
      date: eventDate,
      time: eventTime,
      subjectId: eventSubjectId || undefined,
    });

    setEventTitle("");
    setAddEventOpen(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user) return;

    addTask({
      userId: user.id,
      title: taskTitle,
      type: "assignment",
      dueDate: taskDueDate,
      priority: taskPriority,
      status: "todo",
      subjectId: taskSubjectId || undefined,
    });

    setTaskTitle("");
    setAddTaskOpen(false);
  };

  const getSubjectName = (subId?: string) => {
    if (!subId) return null;
    const s = subjects.find((sub) => sub.id === subId);
    return s ? s.code : null;
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "class":
        return "bg-blue-50 text-accent dark:bg-blue-950/60 dark:text-blue-300 border-accent/20";
      case "exam":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900";
      case "quiz":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      case "assignment":
      case "project":
        return "bg-blue-50 text-brand-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900";
      case "group_study":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  // Month navigation calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (showManageSchedule) {
    return <ManageScheduleView onBack={() => setShowManageSchedule(false)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Academic Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized calendar, assignment deadlines, and milestone study plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode("agenda")}
              className={clsx(
                "px-2.5 py-1.5 rounded-md transition-colors",
                viewMode === "agenda"
                  ? "bg-surface text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={clsx(
                "px-2.5 py-1.5 rounded-md transition-colors",
                viewMode === "month"
                  ? "bg-surface text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              Month
            </button>
          </div>

          <button
            onClick={() => setShowManageSchedule(true)}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <GraduationCap className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Manage Schedule</span>
          </button>

          <button
            onClick={() => setExamPlannerOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-brand-200 dark:border-blue-900 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-blue-300 text-xs font-semibold hover:bg-brand-100 transition-colors"
          >
            Plan Exam
          </button>

          <button
            onClick={() => setAddEventOpen(true)}
            className="p-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* ================= MONTH VIEW ================= */}
      {viewMode === "month" && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface shadow-subtle space-y-4">
          {/* Month controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-[10px] uppercase font-semibold text-slate-400 py-1">
                {day}
              </div>
            ))}

            {/* Empty offset slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty_${i}`} className="h-10 sm:h-12" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                d
              ).padStart(2, "0")}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isSelected = selectedDateStr === dateStr;

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={clsx(
                    "h-10 sm:h-12 rounded-lg p-1 text-xs font-medium flex flex-col items-center justify-between transition-colors border",
                    isSelected
                      ? "border-brand-700 bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-blue-300 font-bold"
                      : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  )}
                >
                  <span>{d}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full bg-brand-600"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= AGENDA & TASKS VIEW ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Events Schedule (2 Cols) */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Events &amp; Exams ({events.length})
            </h3>
            <span className="text-xs text-slate-400">
              {viewMode === "month" ? `Showing ${selectedDateStr}` : "All upcoming"}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-surface-subtle">
              <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Your schedule is clear. Click &quot;Add Event&quot; or &quot;Plan Exam&quot; to schedule study milestones.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(viewMode === "month"
                ? events.filter((e) => e.date === selectedDateStr)
                : events
              ).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface shadow-subtle flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-surface-subtle border border-slate-200 dark:border-slate-700 text-center shrink-0 min-w-[50px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {new Date(evt.date).toLocaleDateString([], { month: "short" })}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "text-[10px] font-semibold uppercase px-2 py-0.5 rounded border",
                            getBadgeStyle(evt.type)
                          )}
                        >
                          {evt.type.replace("_", " ")}
                        </span>
                        {getSubjectName(evt.subjectId) && (
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {getSubjectName(evt.subjectId)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {evt.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        {evt.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-accent" />
                            <span>
                              {evt.time}
                              {evt.endTime ? ` - ${evt.endTime}` : ""}
                            </span>
                          </span>
                        )}
                        {evt.locationOrRoomCode && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{evt.locationOrRoomCode}</span>
                          </span>
                        )}
                        {evt.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{evt.instructor}</span>
                          </span>
                        )}
                      </div>
                      {evt.notes && (
                        <p className="text-xs text-slate-500 mt-1">{evt.notes}</p>
                      )}
                      {evt.type === "class" && (
                        <div className="mt-2">
                          <Link
                            href="/study"
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            <span>Open Subject</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Academic Tasks Rail (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tasks &amp; Deadlines ({tasks.length})
            </h3>
            <button
              onClick={() => setAddTaskOpen(true)}
              className="text-xs text-brand-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>New Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-surface-subtle text-center text-xs text-slate-400">
              No tasks pending.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface shadow-subtle flex items-start gap-2.5"
                >
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-brand-700 dark:hover:text-blue-400"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={clsx(
                        "text-xs font-medium block truncate",
                        task.status === "completed"
                          ? "line-through text-slate-400"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>Due {task.dueDate}</span>
                      <span className="capitalize">{task.priority} priority</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {addEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-sm bg-surface p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Schedule Academic Event
            </h3>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Title</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. ITST 306 Midterm Quiz"
                required
                className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
                >
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="study_session">Study Session</option>
                  <option value="group_study">Group Study</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-medium">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddEventOpen(false)}
                className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs bg-brand-700 text-white font-medium rounded-lg hover:bg-brand-800"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-sm bg-surface p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Create Academic Task
            </h3>

            <div>
              <label className="text-[11px] text-slate-500 font-medium">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Finish Prototype Wireframes"
                required
                className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-medium">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddTaskOpen(false)}
                className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs bg-brand-700 text-white font-medium rounded-lg hover:bg-brand-800"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Planner Modal */}
      <ExamPlannerModal
        isOpen={examPlannerOpen}
        onClose={() => setExamPlannerOpen(false)}
      />
    </div>
  );
}
