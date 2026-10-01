export type UserRole = "student" | "teacher" | "lifelong_learner";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  interests: string[];
  studyGoals: string[];
  avatarUrl?: string;
  avatarId?: AvatarId;
  avatarAccessory?: AvatarAccessoryId;
  createdAt: string;
}

export type SubjectColor =
  | "cobalt"
  | "sage"
  | "terracotta"
  | "teal"
  | "slate"
  | "crimson"
  | "amber"
  | "indigo"
  | "rose"
  | "emerald";

export type SubjectIcon =
  | "book"
  | "code"
  | "flask"
  | "palette"
  | "calculator"
  | "globe"
  | "music"
  | "pen"
  | "shield"
  | "cpu"
  | "leaf"
  | "heart"
  | "microscope"
  | "chart"
  | "briefcase";

export interface Subject {
  id: string;
  userId: string;
  code: string; // e.g. "ITST 306"
  name: string; // e.g. "UX/UI and Cross Platform Applications"
  description?: string;
  color: SubjectColor;
  icon?: SubjectIcon;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  subjectId: string;
  title: string; // e.g. "Module 1: UX Fundamentals"
  order: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  moduleId: string;
  subjectId: string;
  title: string; // e.g. "Design Thinking & Research"
  order: number;
  createdAt: string;
}

export type MaterialType = "note" | "pasted" | "pdf" | "docx" | "txt" | "image";

export interface StudyMaterial {
  id: string;
  userId: string;
  subjectId: string;
  moduleId?: string;
  topicId?: string;
  title: string;
  content: string;
  type: MaterialType;
  fileName?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CardState = "new" | "learning" | "review" | "mastered";
export type Rating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: string;
  userId: string;
  subjectId: string;
  moduleId?: string;
  topicId?: string;
  materialId?: string;
  front: string;
  back: string;
  type: "term_def" | "question_answer" | "fill_blank" | "custom";
  // Spaced Repetition (SM-2 variant)
  state: CardState;
  intervalDays: number; // days until next review
  easeFactor: number; // default 2.5
  repetitions: number;
  nextReviewDate: string; // ISO date
  lastReviewedAt?: string;
  createdAt: string;
}

export type QuestionType =
  | "multiple_choice"
  | "identification"
  | "true_false"
  | "fill_blank";

export interface QuizQuestion {
  id: string;
  subjectId: string;
  moduleId?: string;
  topicId?: string;
  materialId?: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId: string;
  moduleId?: string;
  title: string;
  questions: QuizQuestion[];
  isExamMode: boolean;
  timeLimitMinutes?: number;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, string>; // questionId -> answer
  isExamMode: boolean;
  completedAt: string;
}

export type MistakeState = "learning" | "improving" | "mastered";

export interface MistakeItem {
  id: string;
  userId: string;
  subjectId: string;
  moduleId?: string;
  topicId?: string;
  questionId: string;
  questionText: string;
  lastUserAnswer: string;
  correctAnswer: string;
  explanation: string;
  attemptsCount: number;
  consecutiveCorrect: number;
  state: MistakeState;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  type: "pomodoro" | "flashcards" | "quiz" | "focus_review" | "game" | "room";
  durationMinutes: number;
  accuracy?: number;
  itemsReviewed?: number;
  mistakesResolved?: number;
  cardsImproved?: number;
  gameType?: string;
  gameScore?: number;
  gameMasteryWeight?: number; // multiplier e.g. 0.3 for games vs 1.0 for quizzes
  notes?: string;
  createdAt: string;
}

export interface GameRecord {
  id: string;
  userId: string;
  subjectId?: string;
  gameType: string;
  accuracy: number; // 0-1
  itemsPlayed: number;
  streak: number;
  score: number;
  durationSeconds: number;
  masteryWeight: number; // 0.3 for games
  createdAt: string;
}

export type EventType =
  | "class"
  | "exam"
  | "quiz"
  | "assignment"
  | "project"
  | "study_session"
  | "group_study"
  | "review_session";

export interface CalendarEvent {
  id: string;
  userId: string;
  subjectId?: string;
  classScheduleId?: string; // links back to ClassSchedule if this is a class event
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  endTime?: string; // HH:mm
  locationOrRoomCode?: string;
  instructor?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringGroupId?: string; // all events for one ClassSchedule share this
  createdAt: string;
}

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface ClassSchedule {
  id: string;
  userId: string;
  semesterId: string;
  subjectId?: string; // linked subject if created
  subjectCode: string;
  subjectName: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  room?: string;
  instructor?: string;
  section?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Semester {
  id: string;
  userId: string;
  name: string; // e.g. "1st Semester AY 2026-2027"
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
}

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed";

export interface AcademicTask {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  type: "assignment" | "quiz" | "exam" | "project" | "reading" | "other";
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
}

export interface DailyStudyMilestone {
  date: string; // YYYY-MM-DD
  moduleOrTopicTitle: string;
  targetCards: number;
  completed: boolean;
}

export interface ExamPlan {
  id: string;
  userId: string;
  subjectId: string;
  examName: string;
  examDate: string; // YYYY-MM-DD
  coverageModuleIds: string[];
  dailySchedule: DailyStudyMilestone[];
  createdAt: string;
}

export interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  avatarColor: string;
  currentAnswer?: string;
  hasAnswered?: boolean;
  score?: number;
  lives?: number;
  joinedAt: string;
}

export interface StudyRoom {
  id: string;
  code: string; // e.g. "UX306"
  name: string;
  subjectId?: string;
  hostId: string;
  activity: "lobby" | "pomodoro" | "quiz" | "race" | "survival";
  members: RoomMember[];
  pomodoroState?: {
    durationMinutes: number;
    remainingSeconds: number;
    isRunning: boolean;
    startTimestamp: number;
    targetTimestamp: number;
  };
  quizState?: {
    currentQuestionIndex: number;
    questions: QuizQuestion[];
    isAnswerLocked: boolean;
    showExplanation: boolean;
    answersSubmitted: Record<string, string>; // memberId -> answer
  };
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending";
}

export interface SharedStudySet {
  id: string;
  shareCode: string;
  title: string;
  subjectName: string;
  authorName: string;
  flashcards: Partial<Flashcard>[];
  questions: Partial<QuizQuestion>[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "review_due" | "exam" | "room_invite" | "streak" | "task_due" | "class_reminder";
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  groundedInMaterial?: boolean;
  citation?: string;
  timestamp: string;
}

// Theme system
export type AppThemeId =
  | "studydeck"
  | "midnight"
  | "forest"
  | "sakura"
  | "ocean"
  | "lavender"
  | "latte"
  | "mono";

export type LightDarkMode = "light" | "dark" | "system";

export interface AppThemePalette {
  id: AppThemeId;
  name: string;
  description: string;
  // Light mode values
  light: {
    accent: string;
    accentLight: string;
    accentMuted: string;
    accentText: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    foreground: string;
    mutedText: string;
    border: string;
    progressBar: string;
    selection: string;
  };
  // Dark mode overrides
  dark: {
    accent: string;
    accentLight: string;
    accentMuted: string;
    accentText: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    foreground: string;
    mutedText: string;
    border: string;
    progressBar: string;
    selection: string;
  };
}

// Animal Character and Avatar IDs
export type CompanionCharacterId =
  | "pip"       // Pip the Red Panda (Primary mascot - curiosity, progress)
  | "milo"      // Milo the Capybara (Deep focus, Pomodoro, tea master)
  | "lumi"      // Lumi the Fennec Fox (AI Study Assistant, big listener)
  | "barnaby"   // Barnaby the Sea Otter (Social study, study rooms, group quiz)
  | "toby"      // Toby the Pangolin (Schedule, timetable organization, planner)
  | "zara";     // Zara the Quokka (Games, speed challenges, high-energy cheer)

export type AvatarAccessoryId =
  | "none"
  | "headphones"   // Unlocked with focus sessions
  | "glasses"      // Unlocked with flashcard reviews
  | "beanie"       // Unlocked with 7-day streak
  | "headband"     // Unlocked with mistake notebook mastery
  | "cap"          // Unlocked with group study
  | "badge_feather"; // Unlocked with exam practice

// Avatar IDs for profile customization (animal mascots + legacy geometric compatibility)
export type AvatarId =
  | CompanionCharacterId
  | "none"
  | "geometric_a"
  | "geometric_b"
  | "geometric_c"
  | "geometric_d"
  | "geometric_e";

// Parsed class from schedule import
export interface ParsedClass {
  subjectCode: string;
  subjectName: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm or empty
  endTime: string;   // HH:mm or empty
  room: string;
  instructor: string;
  section: string;
  confidence: {
    subjectCode: number;
    subjectName: number;
    days: number;
    startTime: number;
    endTime: number;
    room: number;
    instructor: number;
  };
}
