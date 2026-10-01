"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Archive,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { ClassSchedule, DayOfWeek } from "@/lib/types";
import { ScheduleImportModal } from "@/components/schedule/schedule-import-modal";
import { EmptyState } from "@/components/ui/empty-state";

const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ManageScheduleViewProps {
  onBack?: () => void;
}

export function ManageScheduleView({ onBack }: ManageScheduleViewProps) {
  const { user } = useAuthStore();
  const {
    semesters,
    classSchedules,
    deleteClassSchedule,
    updateClassSchedule,
    archiveSemester,
    addClassSchedule,
  } = useAcademicStore();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  // Edit class state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDays, setEditDays] = useState<DayOfWeek[]>([]);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editInstructor, setEditInstructor] = useState("");

  // Add single class manually state
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<DayOfWeek[]>(["Mon", "Wed"]);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("11:00");
  const [newRoom, setNewRoom] = useState("");
  const [newInstructor, setNewInstructor] = useState("");

  const userSemesters = semesters.filter((s) => s.userId === user?.id);
  const activeSemester =
    userSemesters.find((s) => s.id === selectedSemesterId) ||
    userSemesters.find((s) => s.isActive && !s.isArchived) ||
    userSemesters[0] ||
    null;

  const currentSemesterId = activeSemester?.id || null;
  const classesForSemester = classSchedules.filter(
    (c) => c.userId === user?.id && c.semesterId === currentSemesterId
  );

  const startEditing = (cls: ClassSchedule) => {
    setEditingClassId(cls.id);
    setEditCode(cls.subjectCode);
    setEditName(cls.subjectName);
    setEditDays(cls.days);
    setEditStart(cls.startTime);
    setEditEnd(cls.endTime);
    setEditRoom(cls.room || "");
    setEditInstructor(cls.instructor || "");
  };

  const saveEditing = (clsId: string) => {
    updateClassSchedule(clsId, {
      subjectCode: editCode.trim(),
      subjectName: editName.trim(),
      days: editDays,
      startTime: editStart,
      endTime: editEnd,
      room: editRoom.trim() || undefined,
      instructor: editInstructor.trim() || undefined,
    });
    setEditingClassId(null);
  };

  const handleAddSingleClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !user || !currentSemesterId) return;

    addClassSchedule({
      userId: user.id,
      semesterId: currentSemesterId,
      subjectCode: newCode.trim(),
      subjectName: newName.trim(),
      days: newDays,
      startTime: newStart,
      endTime: newEnd,
      room: newRoom.trim() || undefined,
      instructor: newInstructor.trim() || undefined,
      isArchived: false,
    });

    setIsAddingClass(false);
    setNewCode("");
    setNewName("");
    setNewRoom("");
    setNewInstructor("");
  };

  const toggleDay = (day: DayOfWeek, current: DayOfWeek[], setter: (days: DayOfWeek[]) => void) => {
    if (current.includes(day)) {
      if (current.length > 1) {
        setter(current.filter((d) => d !== day));
      }
    } else {
      setter([...current, day]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-border hover:bg-surface-muted transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-accent" />
              Manage Schedule
            </h1>
            <p className="text-sm text-muted-text">
              View, edit, or import class schedules for your semesters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSemester && (
            <button
              onClick={() => setIsAddingClass(!isAddingClass)}
              className="px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-surface hover:bg-surface-muted transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          )}
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-95 transition shadow-sm flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Import Schedule
          </button>
        </div>
      </div>

      {/* Semester Tabs */}
      {userSemesters.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-border">
          {userSemesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => setSelectedSemesterId(sem.id)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-2",
                currentSemesterId === sem.id
                  ? "bg-accent-light text-accent-text font-semibold border border-accent/20"
                  : "text-muted-text hover:text-foreground hover:bg-surface-muted"
              )}
            >
              <span>{sem.name}</span>
              {sem.isActive && !sem.isArchived && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Semester" />
              )}
              {sem.isArchived && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-muted-text">
                  Archived
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {/* Active Semester Content */}
      {activeSemester ? (
        <div>
          {/* Semester Details Bar */}
          <div className="flex items-center justify-between p-3.5 mb-6 rounded-xl bg-surface border border-border">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-text">
                Current Semester
              </span>
              <h2 className="text-base font-semibold text-foreground">{activeSemester.name}</h2>
              {activeSemester.startDate && activeSemester.endDate && (
                <p className="text-xs text-muted-text mt-0.5">
                  {activeSemester.startDate} to {activeSemester.endDate}
                </p>
              )}
            </div>

            {!activeSemester.isArchived && (
              <button
                onClick={() => archiveSemester(activeSemester.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-text hover:text-foreground hover:bg-surface-muted transition flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Semester
              </button>
            )}
          </div>

          {/* Add Single Class Inline Form */}
          {isAddingClass && (
            <form
              onSubmit={handleAddSingleClass}
              className="p-4 mb-6 rounded-xl bg-surface border border-accent/30 shadow-sm animate-fade-in"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Add New Class</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="p-1 rounded-md text-muted-text hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. ITST 306"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. UX/UI Design"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              {/* Days selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-text mb-1.5">Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day, newDays, setNewDays)}
                      className={clsx(
                        "px-3 py-1 text-xs rounded-md font-medium transition",
                        newDays.includes(day)
                          ? "bg-accent text-white"
                          : "border border-border text-muted-text hover:bg-surface-muted"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">
                    Room (optional)
                  </label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Room 302"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-text mb-1">
                    Instructor (optional)
                  </label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    placeholder="e.g. Prof. Smith"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:opacity-90 transition"
                >
                  Save Class
                </button>
              </div>
            </form>
          )}

          {/* Classes List */}
          {classesForSemester.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {classesForSemester.map((cls) => {
                const isEditing = editingClassId === cls.id;

                if (isEditing) {
                  return (
                    <div
                      key={cls.id}
                      className="p-4 rounded-xl bg-surface border-2 border-accent/40 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                            Code
                          </label>
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded border border-border bg-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded border border-border bg-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-muted-text mb-1">
                            Days
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {ALL_DAYS.map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day, editDays, setEditDays)}
                                className={clsx(
                                  "px-2 py-0.5 text-[10px] rounded font-medium",
                                  editDays.includes(day)
                                    ? "bg-accent text-white"
                                    : "border border-border text-muted-text"
                                )}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                              Start
                            </label>
                            <input
                              type="time"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-border bg-surface"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                              End
                            </label>
                            <input
                              type="time"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-border bg-surface"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                              Room
                            </label>
                            <input
                              type="text"
                              value={editRoom}
                              onChange={(e) => setEditRoom(e.target.value)}
                              placeholder="Room"
                              className="w-full px-2 py-1 text-xs rounded border border-border bg-surface"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-muted-text mb-0.5">
                              Instructor
                            </label>
                            <input
                              type="text"
                              value={editInstructor}
                              onChange={(e) => setEditInstructor(e.target.value)}
                              placeholder="Instructor"
                              className="w-full px-2 py-1 text-xs rounded border border-border bg-surface"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => setEditingClassId(null)}
                            className="px-2.5 py-1 text-xs rounded border border-border"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditing(cls.id)}
                            className="px-3 py-1 text-xs rounded bg-accent text-white flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition shadow-subtle flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-light text-accent-text">
                            {cls.subjectCode}
                          </span>
                          <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-1">
                            {cls.subjectName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(cls)}
                            className="p-1.5 rounded-lg text-muted-text hover:text-foreground hover:bg-surface-muted transition"
                            title="Edit Class"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteClassSchedule(cls.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                            title="Delete Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-text mt-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>
                            {cls.days.join(", ")} • {cls.startTime} - {cls.endTime}
                          </span>
                        </div>
                        {cls.room && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-text shrink-0" />
                            <span>{cls.room}</span>
                          </div>
                        )}
                        {cls.instructor && (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-text shrink-0" />
                            <span>{cls.instructor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              expression="studying"
              title="No classes added for this semester"
              description="Import your schedule or add classes manually to see them in your calendar and home dashboard."
              actions={[
                {
                  label: "Import Schedule",
                  onClick: () => setImportModalOpen(true),
                },
                {
                  label: "Add Class",
                  onClick: () => setIsAddingClass(true),
                  variant: "secondary",
                },
              ]}
            />
          )}
        </div>
      ) : (
        <EmptyState
          expression="neutral"
          title="No academic schedules yet"
          description="Import your class schedule to automatically create subjects and populate recurring calendar events."
          actions={[
            {
              label: "Import Class Schedule",
              onClick: () => setImportModalOpen(true),
            },
          ]}
        />
      )}

      {/* Schedule Import Modal */}
      {user && (
        <ScheduleImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}
