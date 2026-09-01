-- v1.6: self-healing admin, free-text personal company tracking, category-tagged
-- events, and a structured (category-aware) daily task.

-- ---------- Admin: nhu.nirmit@gmail.com is always admin, automatically ----------
-- Fixes the account right now (idempotent — safe to run even if already true)...
UPDATE public.user_profiles
SET is_admin = true
WHERE email = 'nhu.nirmit@gmail.com';

-- ...and makes it self-healing going forward: any account signing up with this email
-- (e.g. after a re-signup) is automatically marked admin too.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_admin)
  VALUES (new.id, new.email, new.email = 'nhu.nirmit@gmail.com')
  ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin OR public.user_profiles.is_admin;

  INSERT INTO public.profile (user_id, topics_covered, streak_count)
  VALUES (new.id, '{}', 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- ---------- user_tracked_companies: allow a private, free-text entry alongside the
-- existing shared-company link. Exactly one of company_id / custom_name is set. ----------
ALTER TABLE public.user_tracked_companies DROP CONSTRAINT IF EXISTS user_tracked_companies_pkey;
ALTER TABLE public.user_tracked_companies
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS custom_name text;
ALTER TABLE public.user_tracked_companies ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.user_tracked_companies ADD CONSTRAINT user_tracked_companies_pkey PRIMARY KEY (id);
ALTER TABLE public.user_tracked_companies DROP CONSTRAINT IF EXISTS user_tracked_companies_kind_check;
ALTER TABLE public.user_tracked_companies
  ADD CONSTRAINT user_tracked_companies_kind_check
  CHECK ((company_id IS NOT NULL) <> (custom_name IS NOT NULL));
-- Plain (non-partial) unique constraint: Postgres treats each NULL as distinct, so this
-- only ever de-dupes real shared-company rows and never blocks multiple custom rows —
-- and it's also what trackCompany()/setTrackedCompanies() target via onConflict.
CREATE UNIQUE INDEX IF NOT EXISTS user_tracked_companies_user_company_key
  ON public.user_tracked_companies (user_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_tracked_companies_user_custom_key
  ON public.user_tracked_companies (user_id, lower(custom_name)) WHERE custom_name IS NOT NULL;

-- ---------- events: tag with the same 28 focus-topic categories used everywhere else,
-- replacing the old health-industry-specific sector taxonomy. ----------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- ---------- daily_entries.task: string -> {category?, description}, so Action can show
-- a category label like every other section. Existing plain-text tasks are wrapped. ----------
ALTER TABLE public.daily_entries ALTER COLUMN task DROP DEFAULT;
ALTER TABLE public.daily_entries
  ALTER COLUMN task TYPE jsonb
  USING (CASE WHEN task IS NULL THEN NULL ELSE jsonb_build_object('description', task) END);
