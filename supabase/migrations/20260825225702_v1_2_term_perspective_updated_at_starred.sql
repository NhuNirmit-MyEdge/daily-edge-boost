-- v1.2: Term of the Day, Perspective of the Day, last-updated timestamp, starred events

ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS term_of_the_day jsonb,
  ADD COLUMN IF NOT EXISTS perspective_of_the_day jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Keep updated_at current on every UPDATE (loadPastedEntry saves fields one at a time,
-- so this is what makes the "last updated" timestamp on the home page trustworthy).
CREATE OR REPLACE FUNCTION public.set_daily_entries_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_entries_set_updated_at ON public.daily_entries;
CREATE TRIGGER daily_entries_set_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_daily_entries_updated_at();

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;
