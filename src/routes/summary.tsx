import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/components/today/SectionPage";
import { Button } from "@/components/ui/button";
import {
  buildSummary,
  downloadMyEdgeData,
  fetchAllDailyEntries,
  fetchAllQuizResponses,
  fetchAllTaskCompletions,
  fetchProfile,
  type SummaryWindow,
} from "@/lib/today";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Your Progress — MyEdge" },
      {
        name: "description",
        content: "A weekly and monthly rollup of your streak, quiz accuracy and task completion.",
      },
      { property: "og:title", content: "Your Progress — MyEdge" },
      { property: "og:description", content: "How you're doing this week and this month." },
    ],
  }),
  component: SummaryPage,
});

function pct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

function WindowCard({ window }: { window: SummaryWindow }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="eyebrow">{window.label}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Days active</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {window.entriesWithContent}
            <span className="text-xs font-normal text-muted-foreground">/{window.days}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lessons covered</dt>
          <dd className="text-lg font-semibold tabular-nums">{window.lessonsCovered}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Quiz accuracy</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {pct(window.quizAccuracy)}
            {window.quizAnswered > 0 ? (
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                ({window.quizCorrect}/{window.quizAnswered})
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Task completion</dt>
          <dd className="text-lg font-semibold tabular-nums">{pct(window.taskCompletionRate)}</dd>
        </div>
      </dl>
    </div>
  );
}

function SummaryPage() {
  const entriesQuery = useQuery({ queryKey: ["daily-entries"], queryFn: fetchAllDailyEntries });
  const quizQuery = useQuery({ queryKey: ["quiz-responses-all"], queryFn: fetchAllQuizResponses });
  const tasksQuery = useQuery({ queryKey: ["task-completions-all"], queryFn: fetchAllTaskCompletions });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const loading = entriesQuery.isLoading || quizQuery.isLoading || tasksQuery.isLoading;
  const windows =
    entriesQuery.data && quizQuery.data && tasksQuery.data
      ? buildSummary(entriesQuery.data, quizQuery.data, tasksQuery.data)
      : [];

  return (
    <PageShell title="Your Progress">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="eyebrow">Current streak</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {profileQuery.data?.streak_count ?? 0}
          <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
        </p>
        {profileQuery.data?.topics_covered?.length ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {profileQuery.data.topics_covered.length} topics covered so far
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : (
          windows.map((w) => <WindowCard key={w.days} window={w} />)
        )}
      </div>

      <Button variant="outline" size="sm" className="mt-6 w-full" onClick={() => downloadMyEdgeData()}>
        Export my data (JSON)
      </Button>
    </PageShell>
  );
}
