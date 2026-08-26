-- v1.4: replaces the onboarding questionnaire's experience_level/role_title fields
-- (unused) with name, age_range and gender.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS role_title;
