import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { BulkImportBox } from "@/components/today/BulkImportBox";
import { Button } from "@/components/ui/button";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import {
  REGIONS,
  SECTORS,
  downloadICS,
  eventDayRange,
  eventDescription,
  eventMatchesInterests,
  eventMonthKey,
  eventMonthLabel,
  eventRegion,
  eventSectors,
  fetchEvents,
  isPastEvent,
  parseEventsJSON,
  setEventStarred,
  upsertEvents,
  type EventItem,
} from "@/lib/tracking";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Conferences — MyEdge" },
      {
        name: "description",
        content:
          "A scrollable 2026 timeline of relevant industry events and conferences, filterable by sector and region.",
      },
      { property: "og:title", content: "Events & Conferences — MyEdge" },
      { property: "og:description", content: "The 2026 industry events worth knowing about." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function EventRow({ event, onToggleStar }: { event: EventItem; onToggleStar: (event: EventItem) => void }) {
  const past = isPastEvent(event);
  const sectors = eventSectors(event);
  const description = eventDescription(event);
  const region = eventRegion(event);

  return (
    <li className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 ${past ? "opacity-50" : ""}`}>
      <div className="relative pt-3 text-right">
        <span className="block text-sm font-semibold tabular-nums leading-tight">
          {eventDayRange(event)}
        </span>
        {past ? (
          <span className="mt-0.5 block text-[0.625rem] uppercase tracking-wide text-muted-foreground">
            Past
          </span>
        ) : null}
      </div>
      <div className="relative border-l border-border pb-4 pl-4">
        <span
          aria-hidden="true"
          className="absolute -left-[4.5px] top-4 h-2 w-2 rounded-full bg-primary"
        />
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug">{event.name}</h3>
            <button
              type="button"
              onClick={() => onToggleStar(event)}
              aria-pressed={event.starred}
              aria-label={event.starred ? "Unstar this event" : "Star this event"}
              className="shrink-0 -mr-1 -mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Star
                className={`h-4 w-4 ${event.starred ? "fill-primary text-primary" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>
          {event.location ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{event.location}</p>
          ) : null}
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
          {sectors.length > 0 || region ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sectors.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.6875rem] font-medium text-primary"
                >
                  {s}
                </span>
              ))}
              {region ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] font-medium text-secondary-foreground">
                  {region}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function EventsPage() {
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const [sector, setSector] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  const starredEvents = (eventsQuery.data ?? []).filter((e) => e.starred);
  const recommended = (eventsQuery.data ?? [])
    .filter((e) => !isPastEvent(e) && eventMatchesInterests(e, profile?.focus_topics ?? []))
    .sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"))
    .slice(0, 3);

  const onToggleStar = async (event: EventItem) => {
    const next = !event.starred;
    queryClient.setQueryData<EventItem[]>(["events"], (prev) =>
      (prev ?? []).map((e) => (e.id === event.id ? { ...e, starred: next } : e)),
    );
    try {
      await setEventStarred(event.id, next);
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  };

  const groups = useMemo(() => {
    const list = (eventsQuery.data ?? [])
      .filter((e) => (sector ? eventSectors(e).includes(sector) : true))
      .filter((e) => (region ? eventRegion(e) === region : true))
      .slice()
      .sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"));

    const out: { key: string; label: string; items: EventItem[] }[] = [];
    for (const e of list) {
      const key = eventMonthKey(e);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(e);
      else out.push({ key, label: eventMonthLabel(e), items: [e] });
    }
    return out;
  }, [eventsQuery.data, sector, region]);

  return (
    <PageShell title="Events" section="events">
      {recommended.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <p className="eyebrow">Matches your interests</p>
          <ul className="mt-2 space-y-1.5">
            {recommended.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{e.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{eventDayRange(e)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="-mx-4 space-y-2 px-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Chip label="All sectors" active={sector === null} onClick={() => setSector(null)} />
          {SECTORS.map((s) => (
            <Chip
              key={s}
              label={s}
              active={sector === s}
              onClick={() => setSector(sector === s ? null : s)}
            />
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Chip label="All regions" active={region === null} onClick={() => setRegion(null)} />
          {REGIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              active={region === r}
              onClick={() => setRegion(region === r ? null : r)}
            />
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={starredEvents.length === 0}
        onClick={() => downloadICS(starredEvents)}
      >
        {starredEvents.length === 0
          ? "Star events to export them to your calendar"
          : `Export ${starredEvents.length} starred event${starredEvents.length === 1 ? "" : "s"} (.ics)`}
      </Button>

      <div className="mt-5">
        {eventsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            title="No events match"
            body="Clear the filters, or paste a JSON list of events below to build your 2026 calendar."
          />
        ) : (
          <div>
            {groups.map((group) => (
              <section key={group.key}>
                <h2 className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  {group.label}
                </h2>
                <ul className="mt-1">
                  {group.items.map((event) => (
                    <EventRow key={event.id} event={event} onToggleStar={onToggleStar} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {isAdmin ? (
        <BulkImportBox
          heading="Paste events list"
          instructions="Paste a JSON array of events — each with name, start_date, end_date (YYYY-MM-DD), location and relevance_note. Prefix relevance_note with sectors in brackets, e.g. [Digital Health/Pharma]. Existing events are updated rather than duplicated."
          placeholder={'[{"name":"HLTH Europe","start_date":"2026-06-15","end_date":"2026-06-18","location":"Amsterdam, Netherlands","relevance_note":"[Digital Health/Health Tech] Digital health leaders"}]'}
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
      ) : null}
    </PageShell>
  );
}
