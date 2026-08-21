import { createFileRoute } from "@tanstack/react-router";

import { HistorySection } from "@/components/today/HistorySection";

export const Route = createFileRoute("/influencers")({
  head: () => ({
    meta: [
      { title: "Influencers to Follow — MyEdge" },
      {
        name: "description",
        content: "People worth following, day by day, with a short note on why they're relevant.",
      },
      { property: "og:title", content: "Influencers to Follow — MyEdge" },
      { property: "og:description", content: "Suggested people to follow, newest first." },
    ],
  }),
  component: InfluencersPage,
});

function InfluencersPage() {
  return (
    <HistorySection
      title="Influencers to Follow"
      emptyTitle="No suggestions yet"
      emptyBody="Load a briefing that includes influencers and they'll show up here."
      hasContent={(entry) => (entry.influencers ?? []).length > 0}
      render={(entry) => (
        <div className="space-y-3">
          {(entry.influencers ?? []).slice(0, 2).map((person, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold">{person.name ?? "Unnamed"}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {person.why_relevant ?? ""}
              </p>
            </div>
          ))}
        </div>
      )}
    />
  );
}
