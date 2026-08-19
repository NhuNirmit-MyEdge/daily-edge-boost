import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { QuizSection } from "@/components/today/QuizSection";
import { EntrySection } from "@/components/today/SectionPage";
import { fetchProfile } from "@/lib/today";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Daily Quiz — MyEdge" },
      {
        name: "description",
        content: "Five questions on today's briefing, with instant feedback and your streak.",
      },
      { property: "og:title", content: "Daily Quiz — MyEdge" },
      { property: "og:description", content: "Five questions a day to lock in what you read." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const streak = profileQuery.data?.streak_count ?? 0;

  return (
    <EntrySection
      title="Quiz"
      render={(entry, entryDate) => (
        <QuizSection questions={entry.quiz ?? []} entryDate={entryDate} streak={streak} />
      )}
    />
  );
}
