-- v1.3: accounts for a small group (~5-10 people).
--
-- Splits data into two kinds:
--   "shared" content (daily_entries, companies, company_updates, events) is the same
--   for everyone and can only be written by an admin (you) — everyone else can read it.
--   "personal" data (profile/streak, quiz_responses, task_completions, section_views,
--   lesson_reflections, event_stars) is private to each signed-in user: nobody, not
--   even another logged-in user, can read or write another person's rows. This is
--   enforced by Postgres Row Level Security, not by anything in the app code.

-- ---------- user_profiles: one row per account; also holds the onboarding answers ----------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  focus_topics text[] NOT NULL DEFAULT '{}',
  experience_level text,
  role_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_self" ON public.user_profiles;
CREATE POLICY "user_profiles_self" ON public.user_profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_user_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_user_profiles_updated_at();

-- ---------- profile (streak tracking) becomes per-user ----------
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
CREATE UNIQUE INDEX IF NOT EXISTS profile_user_id_key ON public.profile (user_id);

-- ---------- Auto-provision a user_profiles + profile row the moment someone signs up ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile (user_id, topics_covered, streak_count)
  VALUES (new.id, '{}', 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lets policies below ask "is this request from an admin" without RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()), false);
$$;

-- ---------- Shared content: readable by any signed-in user, writable only by admins ----------
REVOKE ALL ON public.daily_entries FROM anon;
REVOKE ALL ON public.companies FROM anon;
REVOKE ALL ON public.company_updates FROM anon;
REVOKE ALL ON public.events FROM anon;

DROP POLICY IF EXISTS "daily_entries_all" ON public.daily_entries;
CREATE POLICY "daily_entries_read" ON public.daily_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_entries_write" ON public.daily_entries FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "daily_entries_update" ON public.daily_entries FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "daily_entries_delete" ON public.daily_entries FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "companies_all" ON public.companies;
CREATE POLICY "companies_read" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_write" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "companies_delete" ON public.companies FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "company_updates_all" ON public.company_updates;
CREATE POLICY "company_updates_read" ON public.company_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_updates_write" ON public.company_updates FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "company_updates_update" ON public.company_updates FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "company_updates_delete" ON public.company_updates FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "events_all" ON public.events;
CREATE POLICY "events_read" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_write" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "events_delete" ON public.events FOR DELETE TO authenticated USING (public.is_admin());

-- A shared "starred" flag on events doesn't make sense once several people use the
-- app, so starring moves to its own per-user table.
CREATE TABLE IF NOT EXISTS public.event_stars (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  starred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_stars TO authenticated;
GRANT ALL ON public.event_stars TO service_role;
ALTER TABLE public.event_stars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_stars_self" ON public.event_stars;
CREATE POLICY "event_stars_self" ON public.event_stars
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.events DROP COLUMN IF EXISTS starred;

-- ---------- Personal data: each user only ever sees / writes their own rows ----------
REVOKE ALL ON public.profile FROM anon;
REVOKE ALL ON public.quiz_responses FROM anon;
REVOKE ALL ON public.task_completions FROM anon;
REVOKE ALL ON public.lesson_reflections FROM anon;
REVOKE ALL ON public.section_views FROM anon;

DROP POLICY IF EXISTS "profile_all" ON public.profile;
CREATE POLICY "profile_self" ON public.profile
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.quiz_responses DROP CONSTRAINT IF EXISTS quiz_responses_entry_date_question_index_key;
CREATE UNIQUE INDEX IF NOT EXISTS quiz_responses_unique_key
  ON public.quiz_responses (user_id, entry_date, question_index);
DROP POLICY IF EXISTS "quiz_responses_all" ON public.quiz_responses;
CREATE POLICY "quiz_responses_self" ON public.quiz_responses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE public.task_completions DROP CONSTRAINT IF EXISTS task_completions_entry_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS task_completions_unique_key
  ON public.task_completions (user_id, entry_date);
DROP POLICY IF EXISTS "task_completions_all" ON public.task_completions;
CREATE POLICY "task_completions_self" ON public.task_completions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.lesson_reflections
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Not ADD PRIMARY KEY: existing rows have a NULL user_id until the backfill step
-- below runs, and a primary key can't contain NULLs. A unique index has no such
-- restriction (Postgres treats each NULL as distinct), so it's safe either way.
ALTER TABLE public.lesson_reflections DROP CONSTRAINT IF EXISTS lesson_reflections_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS lesson_reflections_unique_key
  ON public.lesson_reflections (user_id, entry_date);
DROP POLICY IF EXISTS "lesson_reflections_all" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_self" ON public.lesson_reflections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.section_views
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Same reasoning as lesson_reflections above: a unique index, not a primary key,
-- so existing NULL user_id rows don't block the migration.
ALTER TABLE public.section_views DROP CONSTRAINT IF EXISTS section_views_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS section_views_unique_key
  ON public.section_views (user_id, section, view_date);
DROP POLICY IF EXISTS "section_views_all" ON public.section_views;
CREATE POLICY "section_views_self" ON public.section_views
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
