import { supabase } from "@/integrations/supabase/client";

export type NewsItem = {
  headline?: string;
  what_happened?: string;
  why_it_matters?: string;
  why_it_matters_to_me?: string;
  what_to_watch_next?: string;
};

export type ExpertInsight = {
  title?: string;
  source?: string;
  key_idea?: string;
  application?: string;
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

export type MarketNote = {
  summary?: string;
  level?: string;
};

export type DailyEntry = {
  entry_date: string;
  news_brief: NewsItem[] | null;
  expert_insight: ExpertInsight | null;
  lesson: Lesson | null;
  task: string | null;
  quiz: QuizQuestion[] | null;
  market_note: MarketNote | null;
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
