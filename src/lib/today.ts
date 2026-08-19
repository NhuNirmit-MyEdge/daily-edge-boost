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
  question?: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
};

export type DailyEntry = {
  entry_date: string;
  news_brief: NewsItem[] | null;
  lesson: Lesson | null;
  task: string | null;
  quiz: QuizQuestion[] | null;
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
  };
}

export async function upsertDailyEntry(entry: DailyEntry) {
  const { error } = await supabase.from("daily_entries").upsert(
    {
      entry_date: entry.entry_date,
      news_brief: entry.news_brief ?? [],
      lesson: entry.lesson,
      task: entry.task,
      quiz: entry.quiz ?? [],
    },
    { onConflict: "entry_date" },
  );
  if (error) throw error;
}
