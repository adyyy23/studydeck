# 🗄️ StudyDeck — Supabase Database & Vercel Setup

StudyDeck is designed with a **hybrid cloud-first architecture**:
- **Offline / Zero-Config Mode:** Works instantly out-of-the-box using local storage.
- **Supabase Cloud Mode:** When configured, unlocks real email/password authentication, cloud persistence across devices, and Postgres database storage for subjects, flashcards, quizzes, study sessions, and progress.

---

## ⚡ Quick 3-Step Setup

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **"Start your project"** (free tier).
2. Choose an organization and create a new project named `studydeck`.
3. Set a strong database password and select your closest region.

---

### Step 2: Run the Database Schema
1. In your Supabase project dashboard, click **SQL Editor** on the left menu.
2. Click **New query**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) in this repository and copy all its contents.
4. Paste the SQL into the Supabase editor and click **Run**.
   - This creates all 15 tables (`profiles`, `subjects`, `modules`, `topics`, `flashcards`, `quizzes`, `quiz_questions`, `quiz_attempts`, `mistake_items`, `study_sessions`, `calendar_events`, `class_schedules`, `semesters`, etc.).
   - It also enables Row Level Security (RLS) policies so each student can only access their own data.
   - It sets up an automatic trigger to create a profile and default settings whenever a new student signs up.

---

### Step 3: Connect to Vercel

1. In Supabase, go to **Project Settings** (gear icon) → **API**.
2. Find the following two values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project API Keys** → `anon` `public` key (e.g. `eyJhbGciOi...`)

3. Add them to your Vercel deployment:
   - Go to your [Vercel Dashboard → StudyDeck Project](https://vercel.com/dashboard)
   - Click **Settings** → **Environment Variables**
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = `<your-supabase-url>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   - Check all environments: **Production**, **Preview**, and **Development**.
   - Click **Save**.

4. Redeploy on Vercel:
   - Go to the **Deployments** tab on Vercel.
   - On your latest deployment, click the **...** menu → **Redeploy** (so it picks up the new environment variables).

---

## 💻 Local Development Setup (Optional)

If running locally on your computer:
1. Open `.env.local` in the project root.
2. Fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run `npm run dev` or `npm start` (on `http://localhost:3005`).

---

## 🔒 Security & Data Privacy
- **Row Level Security (RLS)** is enabled on all tables.
- Students can only read, insert, update, and delete their own academic materials and logs.
- Authentication is handled securely by Supabase GoTrue with encrypted passwords and JWT tokens.
