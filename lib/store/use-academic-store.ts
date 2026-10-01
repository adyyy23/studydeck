import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CalendarEvent,
  AcademicTask,
  ExamPlan,
  StudySession,
  DailyStudyMilestone,
  ClassSchedule,
  Semester,
  DayOfWeek,
  ParsedClass,
} from "../types";

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

/** Get all dates between start and end that match a given day of week (0=Sun..6=Sat) */
function getDatesForDayOfWeek(
  dayOfWeek: number,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  // Move to first matching day
  while (cursor.getDay() !== dayOfWeek) {
    cursor.setDate(cursor.getDate() + 1);
  }
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

interface AcademicState {
  events: CalendarEvent[];
  tasks: AcademicTask[];
  examPlans: ExamPlan[];
  sessions: StudySession[];
  semesters: Semester[];
  classSchedules: ClassSchedule[];

  // Event actions
  addEvent: (data: Omit<CalendarEvent, "id" | "createdAt">) => CalendarEvent;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Task actions
  addTask: (data: Omit<AcademicTask, "id" | "createdAt">) => AcademicTask;
  updateTask: (id: string, data: Partial<AcademicTask>) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;

  // Semester actions
  addSemester: (data: Omit<Semester, "id" | "createdAt">) => Semester;
  updateSemester: (id: string, data: Partial<Semester>) => void;
  archiveSemester: (id: string) => void;

  // Class schedule actions
  addClassSchedule: (data: Omit<ClassSchedule, "id" | "createdAt">) => ClassSchedule;
  updateClassSchedule: (id: string, data: Partial<ClassSchedule>) => void;
  deleteClassSchedule: (id: string) => void;

  /** Import a batch of parsed classes — creates ClassSchedule records + recurring CalendarEvents */
  importScheduleBatch: (
    classes: ParsedClass[],
    semesterId: string,
    semester: Semester,
    subjectIdMap: Record<string, string> // subjectCode -> subjectId (may be empty for new subjects)
  ) => { schedules: ClassSchedule[]; events: CalendarEvent[] };

  /** Get class schedules for today's day of week */
  getTodayClasses: (userId: string) => ClassSchedule[];

  // Exam Plan actions
  createExamPlan: (
    data: {
      userId: string;
      subjectId: string;
      examName: string;
      examDate: string;
      coverageModuleIds: string[];
    },
    moduleTitles: string[]
  ) => ExamPlan;
  updateDailyMilestone: (planId: string, milestoneIndex: number, completed: boolean) => void;
  rescheduleMilestones: (planId: string, newStartDate: string) => void;
  deleteExamPlan: (id: string) => void;

  // Session actions
  logSession: (session: Omit<StudySession, "id" | "createdAt">) => StudySession;
  calculateStreak: () => number;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
      events: [],
      tasks: [],
      examPlans: [],
      sessions: [],
      semesters: [],
      classSchedules: [],

      addEvent: (data) => {
        const newEvent: CalendarEvent = {
          ...data,
          id: generateId("evt"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ events: [...state.events, newEvent] }));
        return newEvent;
      },

      updateEvent: (id, data) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      addTask: (data) => {
        const newTask: AcademicTask = {
          ...data,
          id: generateId("tsk"),
          createdAt: new Date().toISOString(),
        };

        const relatedEvent: CalendarEvent = {
          id: `evt_tsk_${newTask.id}`,
          userId: data.userId,
          subjectId: data.subjectId,
          title: data.title,
          type: data.type === "quiz" ? "quiz" : data.type === "exam" ? "exam" : "assignment",
          date: data.dueDate,
          time: data.dueTime,
          notes: data.notes,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
          events: [...state.events, relatedEvent],
        }));
        return newTask;
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      toggleTaskStatus: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const nextStatus =
              t.status === "completed"
                ? "todo"
                : t.status === "todo"
                ? "in_progress"
                : "completed";
            return { ...t, status: nextStatus };
          }),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          events: state.events.filter((e) => e.id !== `evt_tsk_${id}`),
        }));
      },

      addSemester: (data) => {
        const newSem: Semester = {
          ...data,
          id: generateId("sem"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ semesters: [...state.semesters, newSem] }));
        return newSem;
      },

      updateSemester: (id, data) => {
        set((state) => ({
          semesters: state.semesters.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      archiveSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === id ? { ...s, isActive: false, isArchived: true } : s
          ),
          classSchedules: state.classSchedules.map((c) =>
            c.semesterId === id ? { ...c, isArchived: true } : c
          ),
        }));
      },

      addClassSchedule: (data) => {
        const newSchedule: ClassSchedule = {
          ...data,
          id: generateId("cls"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ classSchedules: [...state.classSchedules, newSchedule] }));
        return newSchedule;
      },

      updateClassSchedule: (id, data) => {
        set((state) => ({
          classSchedules: state.classSchedules.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },

      deleteClassSchedule: (id) => {
        set((state) => ({
          classSchedules: state.classSchedules.filter((c) => c.id !== id),
          // Remove all recurring calendar events linked to this schedule
          events: state.events.filter((e) => e.classScheduleId !== id),
        }));
      },

      importScheduleBatch: (parsedClasses, semesterId, semester, subjectIdMap) => {
        const today = new Date();
        const startDate = semester.startDate
          ? new Date(semester.startDate)
          : today;
        const endDate = semester.endDate
          ? new Date(semester.endDate)
          : new Date(startDate.getTime() + 16 * 7 * 24 * 60 * 60 * 1000); // 16 weeks

        const newSchedules: ClassSchedule[] = [];
        const newEvents: CalendarEvent[] = [];

        for (const parsed of parsedClasses) {
          const scheduleId = generateId("cls");
          const recurringGroupId = generateId("rcg");

          const schedule: ClassSchedule = {
            id: scheduleId,
            userId: semester.userId,
            semesterId,
            subjectId: subjectIdMap[parsed.subjectCode] ?? undefined,
            subjectCode: parsed.subjectCode,
            subjectName: parsed.subjectName,
            days: parsed.days,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            room: parsed.room || undefined,
            instructor: parsed.instructor || undefined,
            section: parsed.section || undefined,
            isArchived: false,
            createdAt: new Date().toISOString(),
          };
          newSchedules.push(schedule);

          // Generate recurring events for each day
          for (const day of parsed.days) {
            const dayNum = DAY_MAP[day];
            if (dayNum === undefined) continue;
            const dates = getDatesForDayOfWeek(dayNum, startDate, endDate);
            for (const date of dates) {
              const evt: CalendarEvent = {
                id: generateId("evt"),
                userId: semester.userId,
                subjectId: subjectIdMap[parsed.subjectCode] ?? undefined,
                classScheduleId: scheduleId,
                title: `${parsed.subjectCode} — ${parsed.subjectName}`,
                type: "class",
                date: date.toISOString().split("T")[0],
                time: parsed.startTime || undefined,
                endTime: parsed.endTime || undefined,
                locationOrRoomCode: parsed.room || undefined,
                instructor: parsed.instructor || undefined,
                isRecurring: true,
                recurringGroupId,
                createdAt: new Date().toISOString(),
              };
              newEvents.push(evt);
            }
          }
        }

        set((state) => ({
          classSchedules: [...state.classSchedules, ...newSchedules],
          events: [...state.events, ...newEvents],
        }));

        return { schedules: newSchedules, events: newEvents };
      },

      getTodayClasses: (userId) => {
        const { classSchedules, semesters } = get();
        const activeSemIds = new Set(
          semesters.filter((s) => s.isActive && !s.isArchived).map((s) => s.id)
        );
        const dayNames: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayDay = dayNames[new Date().getDay()];

        return classSchedules
          .filter(
            (c) =>
              c.userId === userId &&
              !c.isArchived &&
              activeSemIds.has(c.semesterId) &&
              c.days.includes(todayDay)
          )
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },

      createExamPlan: (data, moduleTitles) => {
        const today = new Date();
        const examDateObj = new Date(data.examDate);
        const diffDays = Math.max(
          1,
          Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        );

        const milestones: DailyStudyMilestone[] = [];
        const titles = moduleTitles.length > 0 ? moduleTitles : ["Core Concepts", "Review"];

        for (let i = 0; i < titles.length; i++) {
          const dayOffset = Math.min(diffDays - 2, Math.floor((i * (diffDays - 2)) / titles.length));
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + Math.max(1, dayOffset));

          milestones.push({
            date: targetDate.toISOString().split("T")[0],
            moduleOrTopicTitle: titles[i],
            targetCards: 15,
            completed: false,
          });
        }

        const weakDate = new Date(examDateObj);
        weakDate.setDate(examDateObj.getDate() - 2);
        milestones.push({
          date: weakDate.toISOString().split("T")[0],
          moduleOrTopicTitle: "Weak Topics & Mistakes Review",
          targetCards: 20,
          completed: false,
        });

        const finalReviewDate = new Date(examDateObj);
        finalReviewDate.setDate(examDateObj.getDate() - 1);
        milestones.push({
          date: finalReviewDate.toISOString().split("T")[0],
          moduleOrTopicTitle: "Final Comprehensive Practice Exam",
          targetCards: 25,
          completed: false,
        });

        const newPlan: ExamPlan = {
          ...data,
          id: generateId("plan"),
          dailySchedule: milestones,
          createdAt: new Date().toISOString(),
        };

        const examEvent: CalendarEvent = {
          id: `evt_exam_${newPlan.id}`,
          userId: data.userId,
          subjectId: data.subjectId,
          title: `${data.examName} (Exam)`,
          type: "exam",
          date: data.examDate,
          time: "09:00",
          notes: `Coverage: ${titles.join(", ")}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          examPlans: [...state.examPlans, newPlan],
          events: [...state.events, examEvent],
        }));
        return newPlan;
      },

      updateDailyMilestone: (planId, milestoneIndex, completed) => {
        set((state) => ({
          examPlans: state.examPlans.map((plan) => {
            if (plan.id !== planId) return plan;
            const updatedSchedule = [...plan.dailySchedule];
            if (updatedSchedule[milestoneIndex]) {
              updatedSchedule[milestoneIndex] = {
                ...updatedSchedule[milestoneIndex],
                completed,
              };
            }
            return { ...plan, dailySchedule: updatedSchedule };
          }),
        }));
      },

      rescheduleMilestones: (planId, newStartDate) => {
        set((state) => ({
          examPlans: state.examPlans.map((plan) => {
            if (plan.id !== planId) return plan;
            const start = new Date(newStartDate);
            const updated = plan.dailySchedule.map((m, idx) => {
              const d = new Date(start);
              d.setDate(start.getDate() + idx * 2);
              return {
                ...m,
                date: d.toISOString().split("T")[0],
              };
            });
            return { ...plan, dailySchedule: updated };
          }),
        }));
      },

      deleteExamPlan: (id) => {
        set((state) => ({
          examPlans: state.examPlans.filter((p) => p.id !== id),
          events: state.events.filter((e) => e.id !== `evt_exam_${id}`),
        }));
      },

      logSession: (sessionData) => {
        const newSession: StudySession = {
          ...sessionData,
          id: generateId("sess"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
        }));
        return newSession;
      },

      calculateStreak: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;

        const sessionDates = Array.from(
          new Set(sessions.map((s) => s.createdAt.split("T")[0]))
        ).sort((a, b) => b.localeCompare(a));

        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        let currentStreak = 0;
        let checkDate =
          sessionDates[0] === today
            ? today
            : sessionDates[0] === yesterday
            ? yesterday
            : null;

        if (!checkDate) return 0;

        let cursor = new Date(checkDate);
        while (true) {
          const dateStr = cursor.toISOString().split("T")[0];
          if (sessionDates.includes(dateStr)) {
            currentStreak += 1;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        }

        return currentStreak;
      },
    }),
    {
      name: "studydeck_academic_state",
    }
  )
);
