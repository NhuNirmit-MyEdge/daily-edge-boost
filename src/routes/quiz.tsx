import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { QuizSection } from "@/components/today/QuizSection";
import { EntrySection } from "@/components/today/SectionPage";
import { EmptyState } from "@/components/today/SectionPage";
import { fetchProfile, normalizeQuiz } from "@/lib/today";

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
      render={(entry, entryDate) => {
        const questions = normalizeQuiz(entry.quiz ?? []);
        if (questions.length === 0) {
          return (
            <EmptyState
              title="No quiz for today yet"
              body="Today's entry has no quiz questions saved. Paste today's JSON in Load Today — each question needs question, options, correct_index and explanation."
            />
          );
        }
        return <QuizSection questions={questions} entryDate={entryDate} streak={streak} />;
      }}
    />
  );
}
