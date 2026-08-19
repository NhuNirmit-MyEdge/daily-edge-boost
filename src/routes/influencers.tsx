import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, EntrySection } from "@/components/today/SectionPage";

export const Route = createFileRoute("/influencers")({
  head: () => ({
    meta: [
      { title: "Influencers to Follow — MyEdge" },
      {
        name: "description",
        content: "Two people worth following today, with a short note on why they're relevant.",
      },
      { property: "og:title", content: "Influencers to Follow — MyEdge" },
      { property: "og:description", content: "Today's suggested people to follow." },
    ],
  }),
  component: InfluencersPage,
});

function InfluencersPage() {
  return (
    <EntrySection
      title="Influencers to Follow"
      render={(entry) => {
        const people = (entry.influencers ?? []).slice(0, 2);
        if (people.length === 0) {
          return (
            <EmptyState
              title="No suggestions today"
              body="Today's briefing didn't include people to follow. Check back tomorrow."
            />
          );
        }
        return (
          <div className="space-y-3">
            {people.map((person, i) => (
              <article key={i} className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">{person.name ?? "Unnamed"}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {person.why_relevant ?? ""}
                </p>
              </article>
            ))}
          </div>
        );
      }}
    />
  );
}
