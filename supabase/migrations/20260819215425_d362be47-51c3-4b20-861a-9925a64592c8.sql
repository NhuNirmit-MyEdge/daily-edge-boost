CREATE TABLE public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  date_added date not null default current_date
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_all ON public.companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.company_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_date date not null default current_date,
  headline text not null,
  summary text,
  source_url text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_updates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_updates TO anon;
GRANT ALL ON public.company_updates TO service_role;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_updates_all ON public.company_updates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  location text,
  relevance_note text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_all ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS influencers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_recommendation jsonb;

INSERT INTO public.companies (name) VALUES
 ('Anthropic'),('OpenAI'),('Apple'),('Google'),('Amazon'),('Meta'),
 ('Weight Watchers'),('Second Nature'),('Oviva'),('Liva'),('Healum')
ON CONFLICT (name) DO NOTHING;