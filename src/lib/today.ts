import { supabase } from "@/integrations/supabase/client";

export const NEWS_CATEGORIES = [
  "Healthcare",
  "Technology",
  "Business",
  "Venture Capital",
  "Global Affairs",
] as const;

export type NewsItem = {
  category?: string;
  headline?: string;
  published_date?: string;
  source?: string;
  what_happened?: string;
  why_it_matters?: string;
  why_it_matters_to_me?: string;
  why_it_matters_to_you?: string;
  what_to_watch_next?: string;
  watch_next?: string;
};

export type Lesson = {
  module?: string;
  day?: string;
  title?: string;
  content?: string;
};

export type QuizQuestion = {
  category?: string;
  question?: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
};

export type Influencer = {
  name?: string;
  role_or_field?: string;
  why_follow?: string;
  why_relevant?: string;
  link?: string;
  url?: string;
};

export type VideoRecommendation = {
  title?: string;
  url?: string;
  duration_note?: string;
};

export type DailyEntry = {
  entry_date: string;
  news_brief: NewsItem[] | null;
  lesson: Lesson | null;
  task: string | null;
  quiz: QuizQuestion[] | null;
  influencers?: Influencer[] | null;
  video_recommendation?: VideoRecommendation | null;
};

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatToday(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function fetchDailyEntry(entryDate: string) {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyEntry | null) ?? null;
}

export async function fetchAllDailyEntries(): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DailyEntry[];
}

export function formatDateShort(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function fetchProfile() {
  const { data, error } = await supabase
    .from("profile")
    .select("streak_count, topics_covered, last_completed_date")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchQuizResponses(entryDate: string) {
  const { data, error } = await supabase
    .from("quiz_responses")
    .select("question_index, selected_index, correct")
    .eq("entry_date", entryDate);
  if (error) throw error;
  return data ?? [];
}

export async function saveQuizResponse(input: {
  entryDate: string;
  questionIndex: number;
  selectedIndex: number;
  correct: boolean;
}) {
  const { error } = await supabase.from("quiz_responses").upsert(
    {
      entry_date: input.entryDate,
      question_index: input.questionIndex,
      selected_index: input.selectedIndex,
      correct: input.correct,
    },
    { onConflict: "entry_date,question_index" },
  );
  if (error) throw error;
}

export async function fetchTaskCompletion(entryDate: string) {
  const { data, error } = await supabase
    .from("task_completions")
    .select("completed, completed_at, note")
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function completeTask(entryDate: string) {
  const { error } = await supabase.from("task_completions").upsert(
    {
      entry_date: entryDate,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "entry_date" },
  );
  if (error) throw error;
}

export async function fetchReflection(entryDate: string) {
  const { data, error } = await supabase
    .from("lesson_reflections")
    .select("answer")
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return data?.answer ?? "";
}

export async function saveReflection(entryDate: string, answer: string) {
  const { error } = await supabase
    .from("lesson_reflections")
    .upsert(
      { entry_date: entryDate, answer, updated_at: new Date().toISOString() },
      { onConflict: "entry_date" },
    );
  if (error) throw error;
}

export class EntryParseError extends Error {}

export function parseEntryJSON(text: string, fallbackDate: string): DailyEntry {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new EntryParseError("That doesn't look like valid JSON. Check for missing quotes, commas or brackets.");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new EntryParseError("Expected a JSON object with keys like entry_date, news_brief and quiz.");
  }
  const o = raw as Record<string, unknown>;

  const entry_date = typeof o["entry_date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o["entry_date"] as string)
    ? (o["entry_date"] as string)
    : fallbackDate;

  if (o["entry_date"] !== undefined && entry_date !== o["entry_date"]) {
    throw new EntryParseError("entry_date must be a date string in YYYY-MM-DD format.");
  }
  if (!Array.isArray(o["news_brief"])) {
    throw new EntryParseError("news_brief is missing or is not a list of news items.");
  }
  const news = o["news_brief"] as unknown[];
  const badItem = news.findIndex(
    (n) => !n || typeof n !== "object" || Array.isArray(n) || !(n as Record<string, unknown>)["headline"],
  );
  if (badItem !== -1) {
    throw new EntryParseError(
      `News story ${badItem + 1} is missing a headline or isn't a JSON object.`,
    );
  }
  if (!Array.isArray(o["quiz"])) {
    throw new EntryParseError("quiz is missing or is not a list of questions.");
  }
  if (o["task"] !== undefined && o["task"] !== null && typeof o["task"] !== "string") {
    throw new EntryParseError("task must be text.");
  }

  return {
    entry_date,
    news_brief: o["news_brief"] as NewsItem[],
    lesson: (o["lesson"] as Lesson | undefined) ?? null,
    task: (o["task"] as string | undefined) ?? null,
    quiz: o["quiz"] as QuizQuestion[],
    influencers: Array.isArray(o["influencers"]) ? (o["influencers"] as Influencer[]) : [],
    video_recommendation:
      o["video_recommendation"] && typeof o["video_recommendation"] === "object" &&
      !Array.isArray(o["video_recommendation"])
        ? (o["video_recommendation"] as VideoRecommendation)
        : null,
  };
}

export type PastedCompanyUpdate = {
  company_name: string;
  entry_date: string;
  headline: string;
  summary: string | null;
  source_url: string | null;
};

export function parseCompanyUpdatesJSON(text: string, fallbackDate: string): PastedCompanyUpdate[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const list = (raw as Record<string, unknown>)["company_updates"];
  if (!Array.isArray(list)) return [];
  const out: PastedCompanyUpdate[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    if (typeof o["company_name"] !== "string" || typeof o["headline"] !== "string") continue;
    out.push({
      company_name: o["company_name"],
      entry_date:
        typeof o["entry_date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o["entry_date"])
          ? o["entry_date"]
          : fallbackDate,
      headline: o["headline"],
      summary: typeof o["summary"] === "string" ? o["summary"] : null,
      source_url: typeof o["source_url"] === "string" ? o["source_url"] : null,
    });
  }
  return out;
}

/** Inserts updates for company names that match a tracked company (case-insensitive). Unknown names are skipped. */
export async function applyCompanyUpdates(updates: PastedCompanyUpdate[]): Promise<number> {
  if (updates.length === 0) return 0;
  const { data, error } = await supabase.from("companies").select("id, name");
  if (error) throw error;
  const byName = new Map<string, string>(
    (data ?? []).map((c: { id: string; name: string }) => [c.name.trim().toLowerCase(), c.id]),
  );
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
  if (rows.length === 0) return 0;
  const { error: insertError } = await supabase
    .from("company_updates")
    .upsert(rows, { onConflict: "company_id,entry_date,headline" });
  if (insertError) throw insertError;
  return rows.length;
}

export async function upsertDailyEntry(entry: DailyEntry) {
  const { error } = await supabase.from("daily_entries").upsert(
    {
      entry_date: entry.entry_date,
      news_brief: entry.news_brief ?? [],
      lesson: entry.lesson,
      task: entry.task,
      quiz: entry.quiz ?? [],
      influencers: entry.influencers ?? [],
      video_recommendation: entry.video_recommendation ?? null,
    },
    { onConflict: "entry_date" },
  );
  if (error) throw error;
}

/* ---------- Robust field-by-field load ---------- */

function errText(err: unknown): string {
  if (err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  try {
    const t = JSON.stringify(err);
    return t && t !== "{}" ? t : "failed to save";
  } catch {
    return "failed to save";
  }
}

export type FieldStatus = {
  key: string;
  label: string;
  status: "ok" | "failed" | "missing";
  detail?: string;
};

export type LoadReport = {
  entryDate: string;
  fields: FieldStatus[];
  summary: string;
  hasFailures: boolean;
};

export const EXPECTED_ENTRY_FIELDS = [
  "entry_date",
  "news_brief",
  "lesson",
  "quiz",
  "task",
  "influencers",
  "video_recommendation",
  "company_updates",
] as const;

/** Accepts common variants for quiz questions and returns a normalised list. */
export function normalizeQuiz(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: QuizQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const question =
      (typeof o["question"] === "string" && o["question"]) ||
      (typeof o["prompt"] === "string" && o["prompt"]) ||
      (typeof o["q"] === "string" && o["q"]) ||
      "";
    const rawOptions = o["options"] ?? o["choices"] ?? o["answers"];
    const options = Array.isArray(rawOptions)
      ? rawOptions.map((opt) =>
          typeof opt === "string"
            ? opt
            : opt && typeof opt === "object" && typeof (opt as Record<string, unknown>)["text"] === "string"
              ? ((opt as Record<string, unknown>)["text"] as string)
              : String(opt),
        )
      : [];
    const rawIndex = o["correct_index"] ?? o["correctIndex"] ?? o["answer_index"] ?? o["correct"];
    let correct_index: number | undefined;
    if (typeof rawIndex === "number") correct_index = rawIndex;
    else if (typeof rawIndex === "string") {
      const n = Number(rawIndex);
      if (Number.isInteger(n)) correct_index = n;
      else {
        const found = options.findIndex((opt) => opt === rawIndex);
        if (found !== -1) correct_index = found;
      }
    }
    if (!question && options.length === 0) continue;
    const normalized: QuizQuestion = { question, options };
    if (typeof o["category"] === "string") normalized.category = o["category"];
    if (correct_index !== undefined) normalized.correct_index = correct_index;
    if (typeof o["explanation"] === "string") normalized.explanation = o["explanation"];
    out.push(normalized);
  }
  return out;
}

async function updateEntryField(entryDate: string, column: string, value: unknown) {
  const { error } = await supabase
    .from("daily_entries")
    .update({ [column]: value } as never)
    .eq("entry_date", entryDate);
  if (error) throw error;
}

/**
 * Parses pasted JSON, saves each present field independently and reports on every field.
 * One field failing never blocks the others.
 */
export async function loadPastedEntry(text: string, fallbackDate: string): Promise<LoadReport> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new EntryParseError(
      "That doesn't look like valid JSON. Check for missing quotes, commas or brackets.",
    );
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new EntryParseError("Expected a JSON object with keys like entry_date, news_brief and quiz.");
  }
  const o = raw as Record<string, unknown>;

  const rawDate = o["entry_date"];
  if (rawDate !== undefined && (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate))) {
    throw new EntryParseError("entry_date must be a date string in YYYY-MM-DD format.");
  }
  const entryDate = (rawDate as string | undefined) ?? fallbackDate;

  const fields: FieldStatus[] = [];
  const present = (key: string) => o[key] !== undefined && o[key] !== null;

  // Ensure the row exists before any per-field update.
  const { error: baseError } = await supabase
    .from("daily_entries")
    .upsert({ entry_date: entryDate }, { onConflict: "entry_date" });
  if (baseError) throw baseError;

  fields.push(
    rawDate
      ? { key: "entry_date", label: "date", status: "ok" }
      : { key: "entry_date", label: "date", status: "ok", detail: "defaulted to today" },
  );

  const saveField = async (
    key: string,
    label: string,
    column: string,
    value: unknown,
    detail?: string,
  ) => {
    if (!present(key)) {
      fields.push({ key, label, status: "missing" });
      return;
    }
    try {
      await updateEntryField(entryDate, column, value);
      fields.push({ key, label, status: "ok", detail: detail ?? "" });
    } catch (err) {
      fields.push({
        key,
        label,
        status: "failed",
        detail: errText(err),
      });
    }
  };

  const news = Array.isArray(o["news_brief"]) ? (o["news_brief"] as NewsItem[]) : [];
  await saveField("news_brief", "news items", "news_brief", news, `${news.length} news items`);

  await saveField("lesson", "lesson", "lesson", o["lesson"] ?? null, "lesson");
  await saveField("task", "task", "task", typeof o["task"] === "string" ? o["task"] : String(o["task"] ?? ""), "task");

  const quiz = normalizeQuiz(o["quiz"]);
  if (present("quiz") && quiz.length === 0) {
    fields.push({
      key: "quiz",
      label: "quiz",
      status: "failed",
      detail: "no usable questions found (need question + options)",
    });
  } else {
    await saveField("quiz", "quiz", "quiz", quiz, `quiz (${quiz.length} questions)`);
  }

  const influencers = Array.isArray(o["influencers"]) ? (o["influencers"] as Influencer[]) : [];
  await saveField(
    "influencers",
    "influencers",
    "influencers",
    influencers,
    `${influencers.length} influencers`,
  );

  await saveField(
    "video_recommendation",
    "video",
    "video_recommendation",
    o["video_recommendation"] ?? null,
    "video",
  );

  // Company updates (separate table).
  if (!present("company_updates")) {
    fields.push({ key: "company_updates", label: "company updates", status: "missing" });
  } else {
    try {
      const applied = await applyCompanyUpdates(parseCompanyUpdatesJSON(text, entryDate));
      fields.push({
        key: "company_updates",
        label: "company updates",
        status: "ok",
        detail: `${applied} company updates`,
      });
    } catch (err) {
      fields.push({
        key: "company_updates",
        label: "company updates",
        status: "failed",
        detail: errText(err),
      });
    }
  }

  const parts = fields
    .filter((f) => f.key !== "entry_date")
    .map((f) => {
      const name = f.detail && f.status === "ok" && f.detail ? f.detail : f.label;
      if (f.status === "ok") return `${name} ✓`;
      if (f.status === "missing") return `${f.label} — (not in paste)`;
      return `${f.label} ✗ (${f.detail ?? "failed to save"})`;
    });

  return {
    entryDate,
    fields,
    summary: `Loaded for ${formatDateShort(entryDate)}: ${parts.join(", ")}`,
    hasFailures: fields.some((f) => f.status === "failed"),
  };
}
