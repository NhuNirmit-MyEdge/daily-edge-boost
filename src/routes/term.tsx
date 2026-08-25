import { createFileRoute } from "@tanstack/react-router";

import { HistorySection } from "@/components/today/HistorySection";
import { TermOfDayBody } from "@/components/today/TermOfDayCard";

export const Route = createFileRoute("/term")({
  head: () => ({
    meta: [
      { title: "Term of the Day — MyEdge" },
      {
        name: "description",
        content: "Every Term of the Day so far, newest first — one foundational concept at a time.",
      },
      { property: "og:title", content: "Term of the Day — MyEdge" },
      { property: "og:description", content: "One term a day, explained with a real-world example." },
    ],
  }),
  component: TermPage,
});

function TermPage() {
  return (
    <HistorySection
      title="Term of the day"
      section="term"
      emptyTitle="No terms yet"
      emptyBody="Once you load a day's briefing with a term of the day, it will appear here."
      hasContent={(entry) => Boolean(entry.term_of_the_day?.term)}
      render={(entry) => <TermOfDayBody term={entry.term_of_the_day!} />}
    />
  );
}
