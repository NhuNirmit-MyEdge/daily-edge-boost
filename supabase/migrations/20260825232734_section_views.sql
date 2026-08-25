-- Per-section daily view tracking, powering the mini progress bars on the home screen.
CREATE TABLE IF NOT EXISTS public.section_views (
  section text NOT NULL,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (section, view_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_views TO anon, authenticated;
GRANT ALL ON public.section_views TO service_role;
ALTER TABLE public.section_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "section_views_all" ON public.section_views FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
