import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { ActionCard } from "@/components/today/ActionCard";
import { InsightCard } from "@/components/today/InsightCard";
import { LessonCard } from "@/components/today/LessonCard";
import { NewsSection } from "@/components/today/NewsSection";
import { PasteEntryCard } from "@/components/today/PasteEntryCard";
import { QuizSection } from "@/components/today/QuizSection";
import { fetchDailyEntry, fetchProfile, formatToday, todayISO } from "@/lib/today";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyEdge — Your daily intelligence briefing" },
      {
        name: "description",
        content:
          "MyEdge is a personal daily dashboard: news that matters to you, an expert insight, a lesson, one action and a five-question quiz.",
      },
      { property: "og:title", content: "MyEdge — Your daily intelligence briefing" },
      {
        property: "og:description",
        content:
          "News, an expert insight, a lesson, one action and a daily quiz — your edge, every morning.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const entryDate = todayISO();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entryQuery = useQuery({
    queryKey: ["daily-entry", entryDate],
    queryFn: () => fetchDailyEntry(entryDate),
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const entry = entryQuery.data;
  const streak = profileQuery.data?.streak_count ?? 0;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-10">
      <header>
        <p className="eyebrow">MyEdge</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good morning</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mounted ? formatToday(entryDate) : "\u00a0"}</p>
      </header>

      <div className="mt-8 space-y-8">
        {entryQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : entryQuery.isError ? (
          <EmptyState
            title="We couldn't load today's edge"
            body="Something went wrong reaching your dashboard. Pull down or refresh to try again."
          />
        ) : !entry ? (
          <>
            <PasteEntryCard entryDate={entryDate} onSaved={() => entryQuery.refetch()} />
            <EmptyState
              title="Today's edge is still being prepared"
              body="Check back soon — or paste today's content above to load it now."
            />
          </>

        ) : (
          <>
            <NewsSection items={entry.news_brief ?? []} />
            {entry.expert_insight ? <InsightCard insight={entry.expert_insight} /> : null}
            {entry.lesson ? <LessonCard lesson={entry.lesson} entryDate={entryDate} /> : null}
            {entry.task ? <ActionCard task={entry.task} entryDate={entryDate} /> : null}
            <QuizSection
              questions={entry.quiz ?? []}
              entryDate={entryDate}
              streak={streak}
            />
            {entry.market_note?.summary ? (
              <p className="rounded-2xl border border-border bg-card/60 p-4 text-xs leading-relaxed text-muted-foreground">
                {entry.market_note.summary}
                {entry.market_note.level ? ` · ${entry.market_note.level}` : ""}
              </p>
            ) : null}
            <PasteEntryCard entryDate={entryDate} onSaved={() => entryQuery.refetch()} />
          </>
        )}
      </div>
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
