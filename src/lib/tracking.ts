import { supabase } from "@/integrations/supabase/client";
import { EntryParseError } from "@/lib/today";

export type Company = { id: string; name: string; date_added: string };
export type CompanyUpdate = {
  id: string;
  company_id: string;
  entry_date: string;
  headline: string;
  summary: string | null;
  source_url: string | null;
};
export type EventItem = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  relevance_note: string | null;
};

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, date_added")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Company[];
}

export async function fetchCompanyUpdates(): Promise<CompanyUpdate[]> {
  const { data, error } = await supabase
    .from("company_updates")
    .select("id, company_id, entry_date, headline, summary, source_url")
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CompanyUpdate[];
}

export async function addCompany(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new EntryParseError("Enter a company name.");
  const { error } = await supabase.from("companies").insert({ name: trimmed });
  if (error) {
    if (error.code === "23505") throw new EntryParseError("You're already tracking that company.");
    throw error;
  }
}

export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, start_date, end_date, location, relevance_note")
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as EventItem[];
}

export type ParsedEvent = {
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  relevance_note: string | null;
};

function asDate(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function parseEventsJSON(text: string): ParsedEvent[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new EntryParseError("That doesn't look like valid JSON.");
  }
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>)["events"])
      ? ((raw as Record<string, unknown>)["events"] as unknown[])
      : null;
  if (!list) throw new EntryParseError("Expected a JSON array of events.");
  return list.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new EntryParseError(`Event ${i + 1} isn't a JSON object.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o["name"] !== "string" || !o["name"].trim()) {
      throw new EntryParseError(`Event ${i + 1} is missing a name.`);
    }
    return {
      name: o["name"],
      start_date: asDate(o["start_date"]),
      end_date: asDate(o["end_date"]),
      location: typeof o["location"] === "string" ? o["location"] : null,
      relevance_note: typeof o["relevance_note"] === "string" ? o["relevance_note"] : null,
    };
  });
}

export async function replaceEvents(events: ParsedEvent[]) {
  const { error: delError } = await supabase
    .from("events")
    .delete()
    .not("id", "is", null);
  if (delError) throw delError;
  if (events.length === 0) return;
  const { error } = await supabase.from("events").insert(events);
  if (error) throw error;
}

export function formatEventDates(start: string | null, end: string | null): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, day ?? 1).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return "Dates TBC";
}

/* ---------- Bulk company history import ---------- */

export type ImportedCompanyUpdate = {
  company_name: string;
  entry_date: string;
  headline: string;
  summary: string | null;
  source_url: string | null;
};

export function parseCompanyHistoryJSON(text: string): ImportedCompanyUpdate[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new EntryParseError("That doesn't look like valid JSON.");
  }
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" &&
        Array.isArray((raw as Record<string, unknown>)["company_updates"])
      ? ((raw as Record<string, unknown>)["company_updates"] as unknown[])
      : null;
  if (!list) throw new EntryParseError('Expected a JSON object with a "company_updates" array.');
  return list.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new EntryParseError(`Entry ${i + 1} isn't a JSON object.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o["company_name"] !== "string" || !o["company_name"].trim()) {
      throw new EntryParseError(`Entry ${i + 1} is missing company_name.`);
    }
    if (typeof o["headline"] !== "string" || !o["headline"].trim()) {
      throw new EntryParseError(`Entry ${i + 1} is missing a headline.`);
    }
    const date = asDate(o["entry_date"]);
    if (!date) throw new EntryParseError(`Entry ${i + 1} needs entry_date as YYYY-MM-DD.`);
    return {
      company_name: o["company_name"].trim(),
      entry_date: date,
      headline: o["headline"].trim(),
      summary: typeof o["summary"] === "string" ? o["summary"] : null,
      source_url: typeof o["source_url"] === "string" ? o["source_url"] : null,
    };
  });
}

/** Creates any missing companies, then upserts the updates (no duplicates on re-paste). */
export async function importCompanyHistory(
  updates: ImportedCompanyUpdate[],
): Promise<{ inserted: number; createdCompanies: number }> {
  if (updates.length === 0) return { inserted: 0, createdCompanies: 0 };

  const existing = await fetchCompanies();
  const byName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c.id]));

  const missing = Array.from(
    new Set(
      updates
        .map((u) => u.company_name)
        .filter((n) => !byName.has(n.trim().toLowerCase())),
    ),
  );
  if (missing.length > 0) {
    const { data, error } = await supabase
      .from("companies")
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    if (error) throw error;
    for (const c of (data ?? []) as Company[]) byName.set(c.name.trim().toLowerCase(), c.id);
  }

  const rows = updates
    .map((u) => {
      const id = byName.get(u.company_name.trim().toLowerCase());
      if (!id) return null;
      return {
        company_id: id,
        entry_date: u.entry_date,
        headline: u.headline,
        summary: u.summary,
        source_url: u.source_url,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const { error } = await supabase
    .from("company_updates")
    .upsert(rows, { onConflict: "company_id,entry_date,headline" });
  if (error) throw error;
  return { inserted: rows.length, createdCompanies: missing.length };
}

/** Groups updates (already sorted oldest→newest) by month for the last 24 months, by year beyond that. */
export function groupUpdatesByPeriod(updates: CompanyUpdate[]) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const groups: { key: string; label: string; items: CompanyUpdate[] }[] = [];
  for (const u of updates) {
    const [y, m] = u.entry_date.split("-").map(Number);
    const d = new Date(y ?? 1970, (m ?? 1) - 1, 1);
    const recent = d >= new Date(cutoff.getFullYear(), cutoff.getMonth(), 1);
    const key = recent ? `${y}-${m}` : `${y}`;
    const label = recent
      ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : String(y);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(u);
    else groups.push({ key, label, items: [u] });
  }
  return groups;
}

/* ---------- Events bulk import ---------- */

export async function upsertEvents(events: ParsedEvent[]) {
  if (events.length === 0) return 0;
  const { error } = await supabase.from("events").upsert(events, { onConflict: "name,start_date" });
  if (error) throw error;
  return events.length;
}

export function isPastEvent(event: EventItem): boolean {
  const end = event.end_date ?? event.start_date;
  if (!end) return false;
  const today = new Date();
  const todayISOStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return end < todayISOStr;
}
