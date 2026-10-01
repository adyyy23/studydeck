-- ============================================================
-- StudyDeck Database Schema for Supabase
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users, auto-created on signup)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  role text not null default 'student',
  year_level text,
  university text,
  study_interests text[] default '{}',
  study_goals text[] default '{}',
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- USER SETTINGS
-- ============================================================
create table if not exists public.user_settings (
  user_id uuid references auth.users on delete cascade primary key,
  study_points integer not null default 0,
  daily_goal_minutes integer not null default 30,
  home_companion_id text not null default 'pip',
  selected_avatar_id text not null default 'pip',
  avatar_accessory text,
  unlocked_accessories text[] not null default '{}',
  app_theme text not null default 'studydeck',
  light_dark_mode text not null default 'system',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null,
  name text not null,
  color text not null default 'cobalt',
  icon text not null default 'book',
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MODULES
-- ============================================================
create table if not exists public.modules (
  id text primary key,
  subject_id text references public.subjects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOPICS
-- ============================================================
create table if not exists public.topics (
  id text primary key,
  module_id text references public.modules on delete cascade not null,
  subject_id text references public.subjects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDY MATERIALS
-- ============================================================
create table if not exists public.study_materials (
  id text primary key,
  subject_id text references public.subjects on delete cascade not null,
  module_id text references public.modules on delete set null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text,
  type text not null default 'pasted',
  created_at timestamptz not null default now()
);

-- ============================================================
-- FLASHCARDS
-- ============================================================
create table if not exists public.flashcards (
  id text primary key,
  subject_id text references public.subjects on delete cascade not null,
  module_id text,
  topic_id text,
  user_id uuid references auth.users on delete cascade not null,
  front text not null,
  back text not null,
  state text not null default 'new',
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  next_review_date text,
  last_reviewed_at text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- QUIZZES
-- ============================================================
create table if not exists public.quizzes (
  id text primary key,
  subject_id text references public.subjects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  mode text not null default 'practice',
  time_limit_seconds integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
create table if not exists public.quiz_questions (
  id text primary key,
  quiz_id text references public.quizzes on delete cascade not null,
  subject_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  type text not null default 'multiple_choice',
  question_text text not null,
  options jsonb,
  correct_answer text not null,
  explanation text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
create table if not exists public.quiz_attempts (
  id text primary key,
  quiz_id text not null,
  subject_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  score integer not null default 0,
  total integer not null default 0,
  accuracy numeric not null default 0,
  answers jsonb default '[]',
  completed_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MISTAKE ITEMS
-- ============================================================
create table if not exists public.mistake_items (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id text,
  question_text text not null,
  correct_answer text not null,
  user_answer text not null,
  source text not null default 'quiz',
  state text not null default 'active',
  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
create table if not exists public.study_sessions (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id text,
  type text not null default 'study',
  duration_minutes integer not null default 0,
  cards_reviewed integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  date text not null,
  start_time text,
  end_time text,
  type text not null default 'study_session',
  subject_id text,
  description text,
  color text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CLASS SCHEDULES
-- ============================================================
create table if not exists public.class_schedules (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  semester_id text not null,
  subject_id text,
  subject_code text not null,
  subject_name text not null,
  days text[] not null default '{}',
  start_time text not null,
  end_time text not null,
  room text,
  instructor text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEMESTERS
-- ============================================================
create table if not exists public.semesters (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  start_date text,
  end_date text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — users can only access their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.subjects enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.study_materials enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.mistake_items enable row level security;
alter table public.study_sessions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.class_schedules enable row level security;
alter table public.semesters enable row level security;

-- Profiles: view/update own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Settings
create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id);

-- All other tables: full CRUD for own records
create policy "Users can manage own subjects" on public.subjects for all using (auth.uid() = user_id);
create policy "Users can manage own modules" on public.modules for all using (auth.uid() = user_id);
create policy "Users can manage own topics" on public.topics for all using (auth.uid() = user_id);
create policy "Users can manage own materials" on public.study_materials for all using (auth.uid() = user_id);
create policy "Users can manage own flashcards" on public.flashcards for all using (auth.uid() = user_id);
create policy "Users can manage own quizzes" on public.quizzes for all using (auth.uid() = user_id);
create policy "Users can manage own quiz_questions" on public.quiz_questions for all using (auth.uid() = user_id);
create policy "Users can manage own quiz_attempts" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "Users can manage own mistake_items" on public.mistake_items for all using (auth.uid() = user_id);
create policy "Users can manage own study_sessions" on public.study_sessions for all using (auth.uid() = user_id);
create policy "Users can manage own calendar_events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "Users can manage own class_schedules" on public.class_schedules for all using (auth.uid() = user_id);
create policy "Users can manage own semesters" on public.semesters for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile + settings on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
