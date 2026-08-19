import { createFileRoute } from "@tanstack/react-router";

import { LessonCard } from "@/components/today/LessonCard";
import { EmptyState, EntrySection } from "@/components/today/SectionPage";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Let's Learn — MyEdge" },
      {
        name: "description",
        content: "Today's lesson, plus a prompt to explain the idea in your own words.",
      },
      { property: "og:title", content: "Let's Learn — MyEdge" },
      {
        property: "og:description",
        content: "One lesson a day, with a reflection prompt to make it stick.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <EntrySection
      title="Let's Learn"
      render={(entry, entryDate) =>
        entry.lesson ? (
          <LessonCard lesson={entry.lesson} entryDate={entryDate} />
        ) : (
          <EmptyState
            title="No lesson today"
            body="Today's entry doesn't include a lesson yet."
          />
        )
      }
    />
  );
}
