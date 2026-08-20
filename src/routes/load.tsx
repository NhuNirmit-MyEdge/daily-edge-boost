import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { PasteEntryCard } from "@/components/today/PasteEntryCard";
import { PageShell } from "@/components/today/SectionPage";
import { todayISO } from "@/lib/today";

export const Route = createFileRoute("/load")({
  head: () => ({
    meta: [
      { title: "Load Today — MyEdge" },
      {
        name: "description",
        content: "Paste today's MyEdge JSON to load or overwrite the day's briefing.",
      },
      { property: "og:title", content: "Load Today — MyEdge" },
      { property: "og:description", content: "Paste today's briefing JSON and save it in one tap." },
    ],
  }),
  component: LoadPage,
});

function LoadPage() {
  const entryDate = todayISO();
  const queryClient = useQueryClient();

  return (
    <PageShell title="Load Today">
      <PasteEntryCard
        entryDate={entryDate}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ["daily-entry", entryDate] });
          await queryClient.invalidateQueries({ queryKey: ["company-updates"] });
        }}
      />
    </PageShell>
  );
}
