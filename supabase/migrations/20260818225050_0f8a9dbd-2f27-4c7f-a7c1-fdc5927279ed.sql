
CREATE TABLE public.daily_entries (
  entry_date date PRIMARY KEY,
  news_brief jsonb NOT NULL DEFAULT '[]'::jsonb,
  expert_insight jsonb,
  lesson jsonb,
  task text,
  quiz jsonb NOT NULL DEFAULT '[]'::jsonb,
  market_note jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_entries TO anon, authenticated;
GRANT ALL ON public.daily_entries TO service_role;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_entries_all" ON public.daily_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL,
  question_index integer NOT NULL,
  selected_index integer NOT NULL,
  correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_date, question_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_responses TO anon, authenticated;
GRANT ALL ON public.quiz_responses TO service_role;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_responses_all" ON public.quiz_responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL UNIQUE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  note text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO anon, authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_completions_all" ON public.task_completions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lesson_reflections (
  entry_date date PRIMARY KEY,
  answer text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_reflections TO anon, authenticated;
GRANT ALL ON public.lesson_reflections TO service_role;
ALTER TABLE public.lesson_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_reflections_all" ON public.lesson_reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topics_covered text[] NOT NULL DEFAULT '{}',
  streak_count integer NOT NULL DEFAULT 0,
  last_completed_date date
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile TO anon, authenticated;
GRANT ALL ON public.profile TO service_role;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_all" ON public.profile FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.profile (topics_covered, streak_count, last_completed_date)
VALUES (ARRAY['Markets', 'AI', 'Decision making'], 4, CURRENT_DATE - 1);

INSERT INTO public.daily_entries (entry_date, news_brief, expert_insight, lesson, task, quiz, market_note)
VALUES (
  CURRENT_DATE,
  '[
    {"headline":"Central bank holds rates steady, signals patience","what_happened":"Policymakers left the benchmark rate unchanged and removed language hinting at near-term cuts.","why_it_matters":"Rate expectations drive the discount rate on every risk asset, from equities to housing.","why_it_matters_to_me":"Your savings yield stays attractive a while longer; long-duration bets stay expensive.","what_to_watch_next":"The next inflation print and any change in the dot plot."},
    {"headline":"Major cloud provider ships cheaper inference chips","what_happened":"A new in-house accelerator was announced with roughly 40% better price-performance for model serving.","why_it_matters":"Falling inference cost pulls AI features from premium tiers into default product behaviour.","why_it_matters_to_me":"Building AI into a product gets cheaper; differentiation shifts to data and distribution.","what_to_watch_next":"Whether rivals cut serving prices in response."},
    {"headline":"Energy demand from data centres hits new record","what_happened":"Grid operators reported the largest quarterly jump in data-centre load on record.","why_it_matters":"Compute growth is now a physical infrastructure problem, not just a chip supply one.","why_it_matters_to_me":"Power, cooling and land become investable themes alongside semiconductors.","what_to_watch_next":"Utility capex guidance and new grid interconnection queues."}
  ]'::jsonb,
  '{"title":"Invert, always invert","source":"Charlie Munger, Poor Charlie''s Almanack","key_idea":"Instead of asking how to succeed, ask what would guarantee failure, then systematically avoid it.","application":"Before your next big decision, write the three fastest ways it could fail and design around them."}'::jsonb,
  '{"module":"Module 1","day":"Day 5","title":"Compounding beyond money","content":"Compounding applies to skills, reputation and relationships. The mechanism is the same: small consistent inputs, a long runway, and avoiding events that reset the balance to zero. Most of the return comes from not interrupting the process."}'::jsonb,
  'Write down one decision you made this week and the single assumption it depends on most.',
  '[
    {"question":"What does inverting a problem mean?","options":["Solving it backwards in time","Asking what would cause failure and avoiding it","Copying a competitor","Delaying the decision"],"correct_index":1,"explanation":"Inversion means identifying failure modes first, then avoiding them."},
    {"question":"Why do steady rates matter for asset prices?","options":["They set the discount rate on future cash flows","They fix company revenue","They control dividends","They set tax rates"],"correct_index":0,"explanation":"Rates determine the discount rate applied to future cash flows."},
    {"question":"Cheaper AI inference mainly shifts competition toward what?","options":["Model size","Data and distribution","Office locations","Chip design"],"correct_index":1,"explanation":"When serving is cheap, advantage comes from proprietary data and reach."},
    {"question":"What most often breaks compounding?","options":["Slow starts","Interruptions and resets","Small inputs","Long time horizons"],"correct_index":1,"explanation":"Interruptions that reset the balance destroy the compounding curve."},
    {"question":"Rising data-centre power demand makes which theme investable?","options":["Retail property","Grid and energy infrastructure","Consumer staples","Airlines"],"correct_index":1,"explanation":"Compute growth converts into demand for power generation and grid capacity."}
  ]'::jsonb,
  '{"summary":"Equities drifted higher on steady rates; energy and utilities led.","level":"Risk appetite: moderate"}'::jsonb
);
