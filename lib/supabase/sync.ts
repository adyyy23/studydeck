'use client';

/**
 * StudyDeck Supabase Sync Layer
 *
 * Provides bidirectional sync helpers between local Zustand stores and Supabase tables.
 * Safe fallback: If Supabase is not configured or offline, it gracefully does nothing
 * so the application functions flawlessly offline via Zustand localStorage.
 */

import { getSupabaseClient } from './client';
import {
  Subject,
  Module,
  Topic,
  StudyMaterial,
  Flashcard,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  MistakeItem,
  StudySession,
  CalendarEvent,
  ClassSchedule,
  Semester,
} from '../types';

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    url !== 'your_supabase_project_url' &&
    key &&
    key !== 'your_supabase_anon_key'
  );
}

// ─── SUBJECTS ──────────────────────────────────────────────────────────────

export async function syncSubjectToSupabase(subject: Subject, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('subjects').upsert(
      {
        id: subject.id,
        user_id: userId,
        code: subject.code,
        name: subject.name,
        color: subject.color,
        icon: subject.icon ?? 'book',
        description: subject.description ?? null,
        is_archived: subject.isArchived ?? false,
        created_at: subject.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync subject:', err);
  }
}

export async function deleteSubjectFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('subjects').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete subject:', err);
  }
}

// ─── MODULES ───────────────────────────────────────────────────────────────

export async function syncModuleToSupabase(mod: Module, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('modules').upsert(
      {
        id: mod.id,
        subject_id: mod.subjectId,
        user_id: userId,
        title: mod.title,
        order_index: mod.order ?? 0,
        created_at: mod.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync module:', err);
  }
}

export async function deleteModuleFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('modules').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete module:', err);
  }
}

// ─── TOPICS ────────────────────────────────────────────────────────────────

export async function syncTopicToSupabase(topic: Topic, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('topics').upsert(
      {
        id: topic.id,
        module_id: topic.moduleId,
        subject_id: topic.subjectId,
        user_id: userId,
        title: topic.title,
        order_index: topic.order ?? 0,
        created_at: topic.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync topic:', err);
  }
}

export async function deleteTopicFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('topics').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete topic:', err);
  }
}

// ─── STUDY MATERIALS ───────────────────────────────────────────────────────

export async function syncMaterialToSupabase(mat: StudyMaterial, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('study_materials').upsert(
      {
        id: mat.id,
        subject_id: mat.subjectId,
        module_id: mat.moduleId ?? null,
        user_id: userId,
        title: mat.title,
        content: mat.content ?? null,
        type: mat.type,
        created_at: mat.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync study material:', err);
  }
}

export async function deleteMaterialFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('study_materials').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete material:', err);
  }
}

// ─── FLASHCARDS ────────────────────────────────────────────────────────────

export async function syncFlashcardToSupabase(card: Flashcard, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('flashcards').upsert(
      {
        id: card.id,
        user_id: userId,
        subject_id: card.subjectId,
        module_id: card.moduleId ?? null,
        topic_id: card.topicId ?? null,
        front: card.front,
        back: card.back,
        state: card.state,
        ease_factor: card.easeFactor,
        interval_days: card.intervalDays,
        repetitions: card.repetitions,
        next_review_date: card.nextReviewDate ?? null,
        last_reviewed_at: card.lastReviewedAt ?? null,
        created_at: card.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync flashcard:', err);
  }
}

export async function deleteFlashcardFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('flashcards').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete flashcard:', err);
  }
}

// ─── QUIZZES ───────────────────────────────────────────────────────────────

export async function syncQuizToSupabase(quiz: Quiz, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('quizzes').upsert(
      {
        id: quiz.id,
        user_id: userId,
        subject_id: quiz.subjectId,
        title: quiz.title,
        mode: quiz.isExamMode ? 'exam' : 'practice',
        time_limit_seconds: quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null,
        created_at: quiz.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (quiz.questions && quiz.questions.length > 0) {
      const rows = quiz.questions.map((q, i) => ({
        id: q.id,
        quiz_id: quiz.id,
        subject_id: quiz.subjectId,
        user_id: userId,
        type: q.type,
        question_text: q.question,
        options: q.options ?? null,
        correct_answer: q.correctAnswer,
        explanation: q.explanation ?? null,
        order_index: i,
        created_at: new Date().toISOString(),
      }));
      await sb.from('quiz_questions').upsert(rows, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('[Supabase] Failed to sync quiz:', err);
  }
}

export async function deleteQuizFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('quizzes').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete quiz:', err);
  }
}

// ─── QUIZ ATTEMPTS ─────────────────────────────────────────────────────────

export async function syncQuizAttemptToSupabase(attempt: QuizAttempt, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('quiz_attempts').upsert(
      {
        id: attempt.id,
        user_id: userId,
        quiz_id: attempt.quizId,
        subject_id: attempt.subjectId,
        score: attempt.score,
        total: attempt.totalQuestions,
        accuracy: attempt.accuracy,
        answers: attempt.userAnswers ?? {},
        completed_at: attempt.completedAt ?? new Date().toISOString(),
        duration_seconds: attempt.timeSpentSeconds ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync quiz attempt:', err);
  }
}

// ─── MISTAKE ITEMS ─────────────────────────────────────────────────────────

export async function syncMistakeToSupabase(mistake: MistakeItem, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('mistake_items').upsert(
      {
        id: mistake.id,
        user_id: userId,
        subject_id: mistake.subjectId ?? null,
        question_text: mistake.questionText,
        correct_answer: mistake.correctAnswer,
        user_answer: mistake.lastUserAnswer,
        source: 'quiz',
        state: mistake.state,
        created_at: mistake.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync mistake item:', err);
  }
}

// ─── STUDY SESSIONS ────────────────────────────────────────────────────────

export async function syncSessionToSupabase(session: StudySession, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('study_sessions').upsert(
      {
        id: session.id,
        user_id: userId,
        subject_id: session.subjectId ?? null,
        type: session.type,
        duration_minutes: session.durationMinutes,
        cards_reviewed: session.itemsReviewed ?? 0,
        notes: session.notes ?? null,
        created_at: session.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync study session:', err);
  }
}

// ─── CALENDAR EVENTS ───────────────────────────────────────────────────────

export async function syncCalendarEventToSupabase(event: CalendarEvent, userId: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('calendar_events').upsert(
      {
        id: event.id,
        user_id: userId,
        title: event.title,
        date: event.date,
        start_time: event.time ?? null,
        end_time: event.endTime ?? null,
        type: event.type,
        subject_id: event.subjectId ?? null,
        description: event.notes ?? null,
        created_at: event.createdAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[Supabase] Failed to sync calendar event:', err);
  }
}

export async function deleteCalendarEventFromSupabase(id: string) {
  if (!hasSupabaseConfig()) return;
  try {
    const sb = getSupabaseClient();
    await sb.from('calendar_events').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Failed to delete calendar event:', err);
  }
}

// ─── FULL DATA LOAD / HYDRATION ────────────────────────────────────────────

export interface HydratedUserData {
  subjects: Subject[];
  modules: Module[];
  topics: Topic[];
  materials: StudyMaterial[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  mistakes: MistakeItem[];
  sessions: StudySession[];
  calendarEvents: CalendarEvent[];
  semesters: Semester[];
  classSchedules: ClassSchedule[];
}

export async function loadAllUserDataFromSupabase(userId: string): Promise<HydratedUserData | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const sb = getSupabaseClient();

    const [
      subjectsRes,
      modulesRes,
      topicsRes,
      materialsRes,
      flashcardsRes,
      quizzesRes,
      quizQuestionsRes,
      quizAttemptsRes,
      mistakeItemsRes,
      sessionsRes,
      calendarEventsRes,
      semestersRes,
      classSchedulesRes,
    ] = await Promise.all([
      sb.from('subjects').select('*').eq('user_id', userId),
      sb.from('modules').select('*').eq('user_id', userId),
      sb.from('topics').select('*').eq('user_id', userId),
      sb.from('study_materials').select('*').eq('user_id', userId),
      sb.from('flashcards').select('*').eq('user_id', userId),
      sb.from('quizzes').select('*').eq('user_id', userId),
      sb.from('quiz_questions').select('*').eq('user_id', userId),
      sb.from('quiz_attempts').select('*').eq('user_id', userId),
      sb.from('mistake_items').select('*').eq('user_id', userId),
      sb.from('study_sessions').select('*').eq('user_id', userId),
      sb.from('calendar_events').select('*').eq('user_id', userId),
      sb.from('semesters').select('*').eq('user_id', userId),
      sb.from('class_schedules').select('*').eq('user_id', userId),
    ]);

    // Map quiz questions back onto their respective quizzes
    const questionsByQuiz = (quizQuestionsRes.data ?? []).reduce(
      (acc: Record<string, QuizQuestion[]>, q: any) => {
        const item: QuizQuestion = {
          id: q.id,
          subjectId: q.subject_id,
          type: q.type,
          question: q.question_text,
          options: q.options ?? [],
          correctAnswer: q.correct_answer,
          explanation: q.explanation ?? '',
        };
        if (!acc[q.quiz_id]) acc[q.quiz_id] = [];
        acc[q.quiz_id].push(item);
        return acc;
      },
      {}
    );

    const quizzes: Quiz[] = (quizzesRes.data ?? []).map((q: any) => ({
      id: q.id,
      userId: q.user_id,
      subjectId: q.subject_id,
      title: q.title,
      isExamMode: q.mode === 'exam',
      timeLimitMinutes: q.time_limit_seconds ? Math.round(q.time_limit_seconds / 60) : undefined,
      questions: questionsByQuiz[q.id] ?? [],
      createdAt: q.created_at,
    }));

    return {
      subjects: (subjectsRes.data ?? []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        code: s.code,
        name: s.name,
        color: s.color,
        icon: s.icon,
        description: s.description ?? undefined,
        isArchived: s.is_archived,
        createdAt: s.created_at,
        updatedAt: s.created_at,
      })),
      modules: (modulesRes.data ?? []).map((m: any) => ({
        id: m.id,
        subjectId: m.subject_id,
        title: m.title,
        order: m.order_index,
        createdAt: m.created_at,
      })),
      topics: (topicsRes.data ?? []).map((t: any) => ({
        id: t.id,
        moduleId: t.module_id,
        subjectId: t.subject_id,
        title: t.title,
        order: t.order_index,
        createdAt: t.created_at,
      })),
      materials: (materialsRes.data ?? []).map((mat: any) => ({
        id: mat.id,
        userId: mat.user_id,
        subjectId: mat.subject_id,
        moduleId: mat.module_id ?? undefined,
        title: mat.title,
        content: mat.content ?? '',
        type: mat.type,
        wordCount: (mat.content ?? '').split(/\s+/).filter(Boolean).length,
        createdAt: mat.created_at,
        updatedAt: mat.created_at,
      })),
      flashcards: (flashcardsRes.data ?? []).map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        subjectId: f.subject_id,
        moduleId: f.module_id ?? undefined,
        topicId: f.topic_id ?? undefined,
        front: f.front,
        back: f.back,
        type: (f.type as any) ?? "term_def",
        state: f.state,
        easeFactor: Number(f.ease_factor),
        intervalDays: f.interval_days,
        repetitions: f.repetitions,
        nextReviewDate: f.next_review_date ?? '',
        lastReviewedAt: f.last_reviewed_at ?? undefined,
        createdAt: f.created_at,
      })),
      quizzes,
      quizAttempts: (quizAttemptsRes.data ?? []).map((a: any) => ({
        id: a.id,
        quizId: a.quiz_id,
        userId: a.user_id,
        subjectId: a.subject_id,
        score: a.score,
        totalQuestions: a.total,
        accuracy: Number(a.accuracy),
        timeSpentSeconds: a.duration_seconds ?? 0,
        userAnswers: a.answers ?? {},
        isExamMode: false,
        completedAt: a.completed_at ?? a.created_at,
      })),
      mistakes: (mistakeItemsRes.data ?? []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        subjectId: m.subject_id ?? '',
        questionId: m.id,
        questionText: m.question_text,
        correctAnswer: m.correct_answer,
        lastUserAnswer: m.user_answer,
        explanation: '',
        attemptsCount: 1,
        consecutiveCorrect: 0,
        state: m.state,
        createdAt: m.created_at,
        updatedAt: m.created_at,
      })),
      sessions: (sessionsRes.data ?? []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        subjectId: s.subject_id ?? undefined,
        type: s.type,
        durationMinutes: s.duration_minutes,
        itemsReviewed: s.cards_reviewed,
        notes: s.notes ?? undefined,
        createdAt: s.created_at,
      })),
      calendarEvents: (calendarEventsRes.data ?? []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        title: e.title,
        date: e.date,
        time: e.start_time ?? undefined,
        endTime: e.end_time ?? undefined,
        type: e.type,
        subjectId: e.subject_id ?? undefined,
        notes: e.description ?? undefined,
        createdAt: e.created_at,
      })),
      semesters: (semestersRes.data ?? []).map((sem: any) => ({
        id: sem.id,
        userId: sem.user_id,
        name: sem.name,
        startDate: sem.start_date ?? undefined,
        endDate: sem.end_date ?? undefined,
        isActive: sem.is_active,
        isArchived: sem.is_archived,
        createdAt: sem.created_at,
      })),
      classSchedules: (classSchedulesRes.data ?? []).map((cs: any) => ({
        id: cs.id,
        userId: cs.user_id,
        semesterId: cs.semester_id,
        subjectId: cs.subject_id ?? undefined,
        subjectCode: cs.subject_code,
        subjectName: cs.subject_name,
        days: cs.days ?? [],
        startTime: cs.start_time,
        endTime: cs.end_time,
        room: cs.room ?? undefined,
        instructor: cs.instructor ?? undefined,
        isArchived: false,
        createdAt: cs.created_at,
      })),
    };
  } catch (err) {
    console.warn('[Supabase] Failed to load user data:', err);
    return null;
  }
}
