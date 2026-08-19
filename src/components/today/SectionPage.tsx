import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { fetchDailyEntry, todayISO, type DailyEntry } from "@/lib/today";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Today
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}

export function useTodayEntry() {
  const entryDate = todayISO();
  const query = useQuery({
    queryKey: ["daily-entry", entryDate],
    queryFn: () => fetchDailyEntry(entryDate),
  });
  return { entryDate, query };
}

export function EntrySection({
  title,
  render,
}: {
  title: string;
  render: (entry: DailyEntry, entryDate: string) => ReactNode;
}) {
  const { entryDate, query } = useTodayEntry();

  return (
    <PageShell title={title}>
      {query.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          title="We couldn't load today's edge"
          body="Something went wrong reaching your dashboard. Refresh to try again."
        />
      ) : !query.data ? (
        <EmptyState
          title="Today's edge is still being prepared"
          body="Check back soon — or use Load Today to paste in today's content."
        />
      ) : (
        render(query.data, entryDate)
      )}
    </PageShell>
  );
}
