import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CollapsibleRow } from "@/components/today/CollapsibleRow";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import { SectionHeading } from "@/components/today/SectionHeading";
import { fetchEvents, formatEventDates, parseEventsJSON, replaceEvents } from "@/lib/tracking";
import { EntryParseError } from "@/lib/today";

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
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setError(null);
    setBusy(true);
    try {
      const parsed = parseEventsJSON(text);
      await replaceEvents(parsed);
      setText("");
      toast.success("Events updated");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      setError(
        err instanceof EntryParseError ? err.message : "Couldn't save that list. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const events = eventsQuery.data ?? [];

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
          events.map((event) => (
            <CollapsibleRow
              key={event.id}
              title={event.name}
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
          ))
        )}
      </div>

      <section className="mt-8">
        <SectionHeading label="Paste events list" />
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Paste a JSON array of events — each with name, start_date, end_date (YYYY-MM-DD),
            location and relevance_note. This replaces the current list.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            spellCheck={false}
            aria-label="Paste events list"
            placeholder={'[{"name":"HLTH Europe","start_date":"2026-06-15","end_date":"2026-06-18","location":"Amsterdam","relevance_note":"Digital health leaders"}]'}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
          />
          {error ? (
            <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            className="mt-3 w-full"
            onClick={onSave}
            disabled={busy || text.trim().length === 0}
          >
            {busy ? "Saving…" : "Save events"}
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
