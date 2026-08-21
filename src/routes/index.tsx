import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardPaste,
  HelpCircle,
  Newspaper,
  Play,
  Target,
  Users,
} from "lucide-react";


import { fetchDailyEntry, fetchProfile, formatToday, todayISO } from "@/lib/today";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyEdge — Your daily intelligence briefing" },
      {
        name: "description",
        content:
          "MyEdge is a personal daily dashboard: news that matters to you, a lesson, one action and a five-question quiz.",
      },
      { property: "og:title", content: "MyEdge — Your daily intelligence briefing" },
      {
        property: "og:description",
        content: "News, a lesson, one action and a daily quiz — your edge, every morning.",
      },
    ],
  }),
  component: Today,
});

const SECTIONS = [
  { to: "/news", label: "News", icon: Newspaper, blurb: "10 stories, 5 categories" },
  { to: "/learn", label: "Let's Learn", icon: BookOpen, blurb: "Today's lesson" },
  { to: "/action", label: "Today's Action", icon: Target, blurb: "One thing to do" },
  { to: "/quiz", label: "Quiz", icon: HelpCircle, blurb: "5 questions" },
  { to: "/companies", label: "Companies to Follow", icon: Building2, blurb: "Tracked updates" },
  { to: "/influencers", label: "Influencers to Follow", icon: Users, blurb: "2 people today" },
  { to: "/video", label: "Video Recommendation", icon: Play, blurb: "Under 20 minutes" },
  { to: "/events", label: "Events & Conferences", icon: CalendarDays, blurb: "2026 calendar" },
  { to: "/load", label: "Load Today", icon: ClipboardPaste, blurb: "Paste today's content" },
] as const;


function Today() {
  const entryDate = todayISO();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entryQuery = useQuery({
    queryKey: ["daily-entry", entryDate],
    queryFn: () => fetchDailyEntry(entryDate),
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const ready = Boolean(entryQuery.data);
  const streak = profileQuery.data?.streak_count ?? 0;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-10">
      <header>
        <p className="eyebrow">MyEdge</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good morning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mounted ? formatToday(entryDate) : "\u00a0"}
        </p>
      </header>

      <p className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {entryQuery.isLoading
          ? "Loading today's edge…"
          : ready
            ? `Today's edge is ready · ${streak} day streak`
            : "Today's edge is still being prepared — use Load Today to paste it in."}
      </p>

      <nav className="mt-6 grid grid-cols-2 gap-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="group flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary/50"
          >
            <section.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                {section.label}
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{section.blurb}</span>
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
