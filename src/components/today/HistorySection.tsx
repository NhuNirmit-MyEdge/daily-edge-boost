import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { CollapsibleRow } from "@/components/today/CollapsibleRow";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import { fetchAllDailyEntries, formatDateShort, todayISO, type DailyEntry } from "@/lib/today";

export function HistorySection({
  title,
  section,
  emptyTitle,
  emptyBody,
  hasContent,
  render,
}: {
  title: string;
  section?: string | undefined;
  emptyTitle: string;
  emptyBody: string;
  hasContent: (entry: DailyEntry) => boolean;
  render: (entry: DailyEntry) => ReactNode;
}) {
  const today = todayISO();
  const query = useQuery({ queryKey: ["daily-entries"], queryFn: fetchAllDailyEntries });
  const [openDate, setOpenDate] = useState<string | null>(today);

  const entries = (query.data ?? []).filter(hasContent);

  return (
    <PageShell title={title} section={section}>
      {query.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <CollapsibleRow
              key={entry.entry_date}
              title={formatDateShort(entry.entry_date)}
              subtitle={entry.entry_date === today ? "Today" : undefined}
              open={openDate === entry.entry_date}
              onToggle={() =>
                setOpenDate(openDate === entry.entry_date ? null : entry.entry_date)
              }
            >
              {render(entry)}
            </CollapsibleRow>
          ))}
        </div>
      )}
    </PageShell>
  );
}
