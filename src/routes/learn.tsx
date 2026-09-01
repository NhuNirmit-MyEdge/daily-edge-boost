import { createFileRoute } from "@tanstack/react-router";

import { HistorySection } from "@/components/today/HistorySection";
import { LessonBody } from "@/components/today/LessonCard";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Let's Learn — MyEdge" },
      {
        name: "description",
        content: "Every lesson so far, newest first, each with a prompt to explain it in your own words.",
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
    <HistorySection
      title="Learn"
      section="learn"
      emptyTitle="No lessons yet"
      emptyBody="Once you load a day's briefing with a lesson, it will appear here."
      hasContent={(entry) => Boolean(entry.lesson?.title || entry.lesson?.content)}
      render={(entry) => {
        const lesson = entry.lesson!;
        const meta = [lesson.category, lesson.module, lesson.day].filter(Boolean).join(" · ");
        return (
          <div>
            {meta ? <p className="eyebrow">{meta}</p> : null}
            <h2 className="mt-1 text-sm font-semibold leading-snug">{lesson.title}</h2>
            <div className="mt-3">
              <LessonBody lesson={lesson} entryDate={entry.entry_date} />
            </div>
          </div>
        );
      }}
    />
  );
}
