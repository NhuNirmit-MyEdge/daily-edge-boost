import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BulkImportBox } from "@/components/today/BulkImportBox";
import { CollapsibleRow } from "@/components/today/CollapsibleRow";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import {
  fetchEvents,
  formatEventDates,
  isPastEvent,
  parseEventsJSON,
  upsertEvents,
} from "@/lib/tracking";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Conferences — MyEdge" },
      {
        name: "description",
        content: "Relevant global industry events and conferences for 2026, with dates and locations.",
      },
      { property: "og:title", content: "Events & Conferences — MyEdge" },
      { property: "og:description", content: "The 2026 industry events worth knowing about." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const [openId, setOpenId] = useState<string | null>(null);

  const events = (eventsQuery.data ?? [])
    .slice()
    .sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"));

  return (
    <PageShell title="Events & Conferences">
      <div className="space-y-2">
        {eventsQuery.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-card" />)
        ) : events.length === 0 ? (
          <EmptyState
            title="No events yet"
            body="Paste a JSON list of events below to build your 2026 calendar."
          />
        ) : (
          events.map((event) => {
            const past = isPastEvent(event);
            return (
              <div key={event.id} className={past ? "opacity-60" : undefined}>
                <CollapsibleRow
                  title={event.name}
                  subtitle={past ? "Past" : undefined}
                  open={openId === event.id}
                  onToggle={() => setOpenId(openId === event.id ? null : event.id)}
                >
                  <p className="text-sm font-medium">
                    {formatEventDates(event.start_date, event.end_date)}
                  </p>
                  {event.location ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{event.location}</p>
                  ) : null}
                  {event.relevance_note ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {event.relevance_note}
                    </p>
                  ) : null}
                </CollapsibleRow>
              </div>
            );
          })
        )}
      </div>

      <BulkImportBox
        heading="Paste events list"
        instructions="Paste a JSON array of events — each with name, start_date, end_date (YYYY-MM-DD), location and relevance_note. Existing events are updated rather than duplicated."
        placeholder={'[{"name":"HLTH Europe","start_date":"2026-06-15","end_date":"2026-06-18","location":"Amsterdam","relevance_note":"Digital health leaders"}]'}
        submitLabel="Save events"
        onSubmit={async (text) => {
          const parsed = parseEventsJSON(text);
          const count = await upsertEvents(parsed);
          await queryClient.invalidateQueries({ queryKey: ["events"] });
          const dated = parsed.filter((e) => e.start_date).length;
          const located = parsed.filter((e) => e.location).length;
          const noted = parsed.filter((e) => e.relevance_note).length;
          return [
            `Parsed ${parsed.length} events ✓`,
            `${count} events saved ✓`,
            `${dated} with start dates ✓${parsed.length - dated ? ` · ${parsed.length - dated} missing start_date` : ""}`,
            `${located} with locations ✓`,
            `${noted} with relevance notes ✓`,
          ];
        }}
      />
    </PageShell>
  );
}
