import { createFileRoute } from "@tanstack/react-router";

import { HistorySection } from "@/components/today/HistorySection";
import { PerspectiveOfDayBody } from "@/components/today/PerspectiveOfDayCard";

export const Route = createFileRoute("/perspective")({
  head: () => ({
    meta: [
      { title: "Perspective of the Day — MyEdge" },
      {
        name: "description",
        content:
          "Every Perspective of the Day so far, newest first — a live debate argued fairly from both sides.",
      },
      { property: "og:title", content: "Perspective of the Day — MyEdge" },
      { property: "og:description", content: "One genuinely unsettled debate a day, both sides argued fairly." },
    ],
  }),
  component: PerspectivePage,
});

function PerspectivePage() {
  return (
    <HistorySection
      title="Debate"
      section="perspective"
      emptyTitle="No perspectives yet"
      emptyBody="Once you load a day's briefing with a perspective of the day, it will appear here."
      hasContent={(entry) => Boolean(entry.perspective_of_the_day?.question)}
      render={(entry) => <PerspectiveOfDayBody perspective={entry.perspective_of_the_day!} />}
    />
  );
}
