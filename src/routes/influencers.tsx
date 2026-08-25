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
      title="Influencers"
      section="influencers"
      emptyTitle="No suggestions yet"
      emptyBody="Load a briefing that includes influencers and they'll show up here."
      hasContent={(entry) => (entry.influencers ?? []).length > 0}
      render={(entry) => (
        <div className="space-y-3">
          {(entry.influencers ?? []).map((person, i) => {
            const why = person.why_follow ?? person.why_relevant ?? "";
            const link = person.link ?? person.url ?? null;
            return (
              <div key={i}>
                <h3 className="text-sm font-semibold">{person.name ?? "Unnamed"}</h3>
                {person.role_or_field ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{person.role_or_field}</p>
                ) : null}
                {why ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                    {why}
                  </p>
                ) : null}
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-primary underline"
                  >
                    Profile
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    />
  );
}
