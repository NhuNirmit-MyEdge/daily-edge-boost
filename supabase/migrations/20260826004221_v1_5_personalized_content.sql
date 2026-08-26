-- v1.5: daily content (News, Learn, Action, Quiz, Influencers, Term of the day,
-- Debate, Videos) becomes personal per user instead of one shared row per date —
-- you paste one JSON with a "users" block per person and each person's account
-- gets its own row. Companies become a per-user tracked list (the underlying
-- company_updates facts stay shared; who's tracking which company is personal).

-- Admins need to see every account (to match emails when loading content, and for
-- the admin overview screen) — user_profiles_self only covers your own row, so add
-- a second, admin-only read policy alongside it (Postgres ORs multiple permissive
-- policies together for the same command).
DROP POLICY IF EXISTS "user_profiles_admin_read" ON public.user_profiles;
CREATE POLICY "user_profiles_admin_read" ON public.user_profiles
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------- daily_entries: one row per (user, date) instead of one per date ----------
ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
-- Not a primary key: existing rows have a NULL user_id until backfilled, and a
-- primary key can't contain NULLs. A unique index has no such restriction.
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS daily_entries_unique_key
  ON public.daily_entries (user_id, entry_date);

DROP POLICY IF EXISTS "daily_entries_read" ON public.daily_entries;
CREATE POLICY "daily_entries_read" ON public.daily_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
-- Write/update/delete stay admin-only, unchanged from before — only you paste content.

-- ---------- Companies become a personal tracked list ----------
CREATE TABLE IF NOT EXISTS public.user_tracked_companies (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_tracked_companies TO authenticated;
GRANT ALL ON public.user_tracked_companies TO service_role;
ALTER TABLE public.user_tracked_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_tracked_companies_self" ON public.user_tracked_companies;
CREATE POLICY "user_tracked_companies_self" ON public.user_tracked_companies
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_tracked_companies_admin_read" ON public.user_tracked_companies;
CREATE POLICY "user_tracked_companies_admin_read" ON public.user_tracked_companies
  FOR SELECT TO authenticated USING (public.is_admin());
