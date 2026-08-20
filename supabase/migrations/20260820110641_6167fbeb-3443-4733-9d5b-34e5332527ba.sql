-- de-duplicate before adding unique keys
DELETE FROM public.company_updates a USING public.company_updates b
WHERE a.ctid < b.ctid AND a.company_id = b.company_id AND a.entry_date = b.entry_date AND a.headline = b.headline;

CREATE UNIQUE INDEX IF NOT EXISTS company_updates_unique_key
  ON public.company_updates (company_id, entry_date, headline);

DELETE FROM public.events a USING public.events b
WHERE a.ctid < b.ctid AND a.name = b.name AND a.start_date IS NOT DISTINCT FROM b.start_date;

CREATE UNIQUE INDEX IF NOT EXISTS events_unique_key
  ON public.events (name, start_date);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_lower_key
  ON public.companies (lower(name));