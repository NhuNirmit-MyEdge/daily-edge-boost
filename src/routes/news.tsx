import { createFileRoute } from "@tanstack/react-router";

import { NewsSection } from "@/components/today/NewsSection";
import { EntrySection } from "@/components/today/SectionPage";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Today's News — MyEdge" },
      {
        name: "description",
        content:
          "Ten stories across healthcare, technology, business, venture capital and global affairs, with why each one matters to you.",
      },
      { property: "og:title", content: "Today's News — MyEdge" },
      {
        property: "og:description",
        content: "Ten daily stories across five categories, tap to expand.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <EntrySection
      title="News"
      render={(entry) => <NewsSection items={entry.news_brief ?? []} />}
    />
  );
}
