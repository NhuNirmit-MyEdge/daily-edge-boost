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
