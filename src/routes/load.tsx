import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";

import { PasteEntryCard } from "@/components/today/PasteEntryCard";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import { todayISO } from "@/lib/today";
import { useAuth } from "@/lib/auth";

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
  const { profile } = useAuth();

  if (!profile?.is_admin) {
    return (
      <PageShell title="Load Today">
        <EmptyState
          title="Admin only"
          body="Only the MyEdge admin can load the day's shared content. Everyone else's News, Learn, Quiz and other sections update automatically once it's loaded."
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Load Today" section="load">
      <Link
        to="/admin-users"
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        View subscribers &amp; their interests
      </Link>
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
