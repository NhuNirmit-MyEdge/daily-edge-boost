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

export type TermOfDay = {
  category?: string;
  term?: string;
  definition?: string;
  example_or_context?: string;
};

export type PerspectiveSide = {
  label?: string;
  argument?: string;
};

export type PerspectiveOfDay = {
  category?: string;
  question?: string;
  perspective_one?: PerspectiveSide;
  perspective_two?: PerspectiveSide;
  closing_note?: string;
};

export type DailyEntry = {
  entry_date: string;
  news_brief: NewsItem[] | null;
  lesson: Lesson | null;
  task: string | null;
  quiz: QuizQuestion[] | null;
  influencers?: Influencer[] | null;
  video_recommendation?: VideoRecommendation | null;
  term_of_the_day?: TermOfDay | null;
  perspective_of_the_day?: PerspectiveOfDay | null;
  updated_at?: string;
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

/**
 * Every signed-in user (including the admin) only ever sees their OWN daily entry —
 * daily_entries now holds one row per (user, date), not one shared row per date. RLS
 * already restricts what an admin *could* see to every row, so this filters
 * explicitly rather than relying on RLS alone, otherwise an admin browsing their own
 * home screen could pull back more than one row for the same date and error out.
 */
async function currentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function fetchDailyEntry(entryDate: string) {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("entry_date", entryDate)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyEntry | null) ?? null;
}

export async function fetchAllDailyEntries(): Promise<DailyEntry[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", uid)
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
    { onConflict: "user_id,entry_date,question_index" },
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
    { onConflict: "user_id,entry_date" },
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
      { onConflict: "user_id,entry_date" },
    );
  if (error) throw error;
}

export class EntryParseError extends Error {}

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

/** One person's slice of a paste: which of their fields saved, or why they were skipped entirely. */
export type UserLoadResult = {
  email: string;
  matched: boolean;
  fields: FieldStatus[];
};

export type LoadReport = {
  entryDate: string;
  users: UserLoadResult[];
  companyUpdates: FieldStatus;
  summary: string;
  hasFailures: boolean;
};

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

async function updateEntryField(userId: string, entryDate: string, column: string, value: unknown) {
  const { error } = await supabase
    .from("daily_entries")
    .update({ [column]: value } as never)
    .eq("user_id", userId)
    .eq("entry_date", entryDate);
  if (error) throw error;
}

/** Builds one person's field-by-field save, reusing the same "one field failing never blocks the rest" approach. */
async function loadPastedEntryForUser(
  email: string,
  userId: string,
  entryDate: string,
  u: Record<string, unknown>,
): Promise<UserLoadResult> {
  const fields: FieldStatus[] = [];
  const present = (key: string) => u[key] !== undefined && u[key] !== null;

  const { error: baseError } = await supabase
    .from("daily_entries")
    .upsert({ user_id: userId, entry_date: entryDate }, { onConflict: "user_id,entry_date" });
  if (baseError) {
    return {
      email,
      matched: true,
      fields: [{ key: "_row", label: "entry", status: "failed", detail: errText(baseError) }],
    };
  }

  const saveField = async (key: string, label: string, column: string, value: unknown, detail?: string) => {
    if (!present(key)) {
      fields.push({ key, label, status: "missing" });
      return;
    }
    try {
      await updateEntryField(userId, entryDate, column, value);
      fields.push({ key, label, status: "ok", detail: detail ?? "" });
    } catch (err) {
      fields.push({ key, label, status: "failed", detail: errText(err) });
    }
  };

  const news = Array.isArray(u["news_brief"]) ? (u["news_brief"] as NewsItem[]) : [];
  await saveField("news_brief", "news items", "news_brief", news, `${news.length} news items`);

  await saveField("lesson", "lesson", "lesson", u["lesson"] ?? null, "lesson");
  await saveField("task", "task", "task", typeof u["task"] === "string" ? u["task"] : String(u["task"] ?? ""), "task");

  const quiz = normalizeQuiz(u["quiz"]);
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

  const influencers = Array.isArray(u["influencers"]) ? (u["influencers"] as Influencer[]) : [];
  await saveField("influencers", "influencers", "influencers", influencers, `${influencers.length} influencers`);

  await saveField("video_recommendation", "video", "video_recommendation", u["video_recommendation"] ?? null, "video");
  await saveField("term_of_the_day", "term of the day", "term_of_the_day", u["term_of_the_day"] ?? null, "term of the day");
  await saveField(
    "perspective_of_the_day",
    "perspective of the day",
    "perspective_of_the_day",
    u["perspective_of_the_day"] ?? null,
    "perspective of the day",
  );

  return { email, matched: true, fields };
}

/**
 * Parses one pasted JSON containing a "users" array — one block per signed-up
 * person, matched by email — and saves each person's fields independently under
 * their own account. company_updates stays a single shared block (companies'
 * updates are the same facts for everyone who tracks them). One person's, or one
 * field's, failure never blocks anyone else's.
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
    throw new EntryParseError("Expected a JSON object with an entry_date and a users array.");
  }
  const o = raw as Record<string, unknown>;

  const rawDate = o["entry_date"];
  if (rawDate !== undefined && (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate))) {
    throw new EntryParseError("entry_date must be a date string in YYYY-MM-DD format.");
  }
  const entryDate = (rawDate as string | undefined) ?? fallbackDate;

  const usersRaw = o["users"];
  if (!Array.isArray(usersRaw) || usersRaw.length === 0) {
    throw new EntryParseError(
      'Expected a "users" array — one object per person, each with an "email" plus their content.',
    );
  }

  const { data: profiles, error: profilesError } = await supabase.from("user_profiles").select("id, email");
  if (profilesError) throw profilesError;
  const byEmail = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.email.trim().toLowerCase(), p.id]),
  );

  const userResults: UserLoadResult[] = [];
  for (const item of usersRaw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      userResults.push({
        email: "(invalid entry)",
        matched: false,
        fields: [{ key: "_entry", label: "entry", status: "failed", detail: "not a JSON object" }],
      });
      continue;
    }
    const u = item as Record<string, unknown>;
    const email = typeof u["email"] === "string" ? u["email"].trim() : "";
    if (!email) {
      userResults.push({
        email: "(missing email)",
        matched: false,
        fields: [{ key: "_email", label: "email", status: "failed", detail: "missing an email field" }],
      });
      continue;
    }
    const uid = byEmail.get(email.toLowerCase());
    if (!uid) {
      userResults.push({
        email,
        matched: false,
        fields: [{ key: "_account", label: "account", status: "failed", detail: "no signed-up account with this email yet" }],
      });
      continue;
    }
    userResults.push(await loadPastedEntryForUser(email, uid, entryDate, u));
  }

  // Company updates: one shared block, same as before.
  let companyUpdates: FieldStatus;
  if (o["company_updates"] === undefined || o["company_updates"] === null) {
    companyUpdates = { key: "company_updates", label: "company updates", status: "missing" };
  } else {
    try {
      const applied = await applyCompanyUpdates(parseCompanyUpdatesJSON(text, entryDate));
      companyUpdates = { key: "company_updates", label: "company updates", status: "ok", detail: `${applied} company updates` };
    } catch (err) {
      companyUpdates = { key: "company_updates", label: "company updates", status: "failed", detail: errText(err) };
    }
  }

  const matchedCount = userResults.filter((u) => u.matched).length;
  const userLines = userResults.map((u) => {
    if (!u.matched) return `${u.email} ✗ (${u.fields[0]?.detail ?? "skipped"})`;
    const failed = u.fields.filter((f) => f.status === "failed");
    return failed.length > 0 ? `${u.email} ✗ (${failed.map((f) => f.label).join(", ")})` : `${u.email} ✓`;
  });

  return {
    entryDate,
    users: userResults,
    companyUpdates,
    summary:
      `Loaded for ${formatDateShort(entryDate)} — ${matchedCount}/${userResults.length} accounts matched` +
      (companyUpdates.status === "ok" ? `, ${companyUpdates.detail}` : "") +
      `: ${userLines.join("; ")}`,
    hasFailures:
      userResults.some((u) => !u.matched || u.fields.some((f) => f.status === "failed")) ||
      companyUpdates.status === "failed",
  };
}

/* ---------- Weekly / monthly summary ---------- */

export async function fetchAllQuizResponses() {
  const { data, error } = await supabase
    .from("quiz_responses")
    .select("entry_date, question_index, selected_index, correct");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllTaskCompletions() {
  const { data, error } = await supabase
    .from("task_completions")
    .select("entry_date, completed, completed_at");
  if (error) throw error;
  return data ?? [];
}

export type SummaryWindow = {
  label: string;
  days: number;
  entriesWithContent: number;
  lessonsCovered: number;
  quizAnswered: number;
  quizCorrect: number;
  quizAccuracy: number | null;
  tasksCompleted: number;
  taskCompletionRate: number | null;
};

function withinLastNDays(dateISO: string, n: number, today: string): boolean {
  const start = new Date(today);
  start.setDate(start.getDate() - (n - 1));
  const startISO = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return dateISO >= startISO && dateISO <= today;
}

/** Builds 7-day and 30-day rollups from already-fetched entries/responses/completions. */
export function buildSummary(
  entries: DailyEntry[],
  quizResponses: { entry_date: string; correct: boolean }[],
  taskCompletions: { entry_date: string; completed: boolean }[],
): SummaryWindow[] {
  const today = todayISO();
  return [7, 30].map((n) => {
    const inWindow = (d: string) => withinLastNDays(d, n, today);
    const windowEntries = entries.filter((e) => inWindow(e.entry_date));
    const entriesWithContent = windowEntries.filter(
      (e) => (e.news_brief?.length ?? 0) > 0 || Boolean(e.lesson?.title),
    ).length;
    const lessonsCovered = windowEntries.filter((e) => Boolean(e.lesson?.title)).length;

    const windowQuiz = quizResponses.filter((r) => inWindow(r.entry_date));
    const quizAnswered = windowQuiz.length;
    const quizCorrect = windowQuiz.filter((r) => r.correct).length;

    const windowTasks = taskCompletions.filter((t) => inWindow(t.entry_date) && t.completed);
    const daysWithTask = windowEntries.filter((e) => Boolean(e.task)).length;

    return {
      label: n === 7 ? "Last 7 days" : "Last 30 days",
      days: n,
      entriesWithContent,
      lessonsCovered,
      quizAnswered,
      quizCorrect,
      quizAccuracy: quizAnswered > 0 ? quizCorrect / quizAnswered : null,
      tasksCompleted: windowTasks.length,
      taskCompletionRate: daysWithTask > 0 ? windowTasks.length / daysWithTask : null,
    };
  });
}

/* ---------- Data export ---------- */

export async function buildExportPayload() {
  const [entries, quizResponses, taskCompletions, profile] = await Promise.all([
    fetchAllDailyEntries(),
    fetchAllQuizResponses(),
    fetchAllTaskCompletions(),
    fetchProfile(),
  ]);
  return {
    exported_at: new Date().toISOString(),
    profile,
    daily_entries: entries,
    quiz_responses: quizResponses,
    task_completions: taskCompletions,
  };
}

/** Triggers a browser download of the full MyEdge history as a JSON file. */
export async function downloadMyEdgeData() {
  const payload = await buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myedge-export-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
