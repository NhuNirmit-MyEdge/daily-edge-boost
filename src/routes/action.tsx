import { createFileRoute } from "@tanstack/react-router";

import { ActionCard } from "@/components/today/ActionCard";
import { EmptyState, EntrySection } from "@/components/today/SectionPage";

export const Route = createFileRoute("/action")({
  head: () => ({
    meta: [
      { title: "Today's Action — MyEdge" },
      {
        name: "description",
        content: "The one concrete action to take today, with a tap to mark it complete.",
      },
      { property: "og:title", content: "Today's Action — MyEdge" },
      { property: "og:description", content: "One action a day. Do it, tick it, keep the streak." },
    ],
  }),
  component: ActionPage,
});

function ActionPage() {
  return (
    <EntrySection
      title="Action"
      section="action"
      render={(entry, entryDate) =>
        entry.task ? (
          <ActionCard task={entry.task} entryDate={entryDate} />
        ) : (
          <EmptyState title="No action today" body="Today's entry doesn't include a task yet." />
        )
      }
    />
  );
}
