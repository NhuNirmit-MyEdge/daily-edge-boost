import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardPaste,
  HelpCircle,
  Lightbulb,
  Newspaper,
  Play,
  Quote,
  Settings,
  Target,
  Users,
} from "lucide-react";


import { fetchDailyEntry, fetchProfile, formatToday, todayISO } from "@/lib/today";
import { fetchSectionViewHistory } from "@/lib/views";
import { MiniProgressBar } from "@/components/today/MiniProgressBar";
import { useAuth } from "@/lib/auth";

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

// Order matters: the first and last entries render as thin full-width banners;
// everything between renders in the 2-column grid.
const SECTIONS = [
  { to: "/summary", label: "My Progress", icon: BarChart3, blurb: "Weekly & monthly summary", section: "summary" },
  { to: "/news", label: "News", icon: Newspaper, blurb: "10 stories, 5 categories", section: "news" },
  { to: "/learn", label: "Learn", icon: BookOpen, blurb: "Today's lesson", section: "learn" },
  { to: "/action", label: "Action", icon: Target, blurb: "One thing to do", section: "action" },
  { to: "/quiz", label: "Quiz", icon: HelpCircle, blurb: "5 questions", section: "quiz" },
  { to: "/companies", label: "Companies", icon: Building2, blurb: "Tracked updates", section: "companies" },
  { to: "/influencers", label: "Influencers", icon: Users, blurb: "2 people today", section: "influencers" },
  { to: "/term", label: "Term of the day", icon: Lightbulb, blurb: "One concept, explained", section: "term" },
  { to: "/perspective", label: "Debate", icon: Quote, blurb: "Both sides of a live debate", section: "perspective" },
  { to: "/video", label: "Videos", icon: Play, blurb: "Under 20 minutes", section: "video" },
  { to: "/events", label: "Events", icon: CalendarDays, blurb: "2026 calendar", section: "events" },
  { to: "/load", label: "Load Today", icon: ClipboardPaste, blurb: "Paste today's content", section: "load" },
] as const;

function Today() {
  const entryDate = todayISO();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);

  const entryQuery = useQuery({
    queryKey: ["daily-entry", entryDate],
    queryFn: () => fetchDailyEntry(entryDate),
  });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  // Load Today is an admin-only tool for pasting in the day's content — hide it
  // from everyone else.
  const visibleSections = isAdmin ? SECTIONS : SECTIONS.filter((s) => s.section !== "load");
  const sectionKeys = visibleSections.map((s) => s.section);
  const viewsQuery = useQuery({
    queryKey: ["section-views", sectionKeys.join(",")],
    queryFn: () => fetchSectionViewHistory(sectionKeys),
  });

  const ready = Boolean(entryQuery.data);
  const streak = profileQuery.data?.streak_count ?? 0;
  const updatedAt = entryQuery.data?.updated_at;
  const lastUpdatedLabel =
    mounted && updatedAt
      ? new Date(updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : null;

  const [first, ...rest] = visibleSections;
  const last = rest[rest.length - 1];
  const middle = rest.slice(0, -1);

  const wideTile = (section: (typeof SECTIONS)[number]) => (
    <Link
      key={section.to}
      to={section.to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary/50"
    >
      <section.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-sm font-semibold">
          {section.label}
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{section.blurb}</span>
        <MiniProgressBar history={viewsQuery.data?.[section.section]} />
      </span>
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">MyEdge</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good morning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mounted ? formatToday(entryDate) : " "}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="mt-1 shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      <p className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {entryQuery.isLoading
          ? "Loading today's edge…"
          : ready
            ? `Today's edge is ready · ${streak} day streak`
            : "Today's edge is still being prepared — use Load Today to paste it in."}
        {lastUpdatedLabel ? (
          <span className="mt-1 block text-xs text-muted-foreground/80">
            Last updated {lastUpdatedLabel}
          </span>
        ) : null}
      </p>

      <nav className="mt-6">{wideTile(first)}</nav>

      <nav className="mt-3 grid grid-cols-2 gap-3">
        {middle.map((section) => (
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
              <MiniProgressBar history={viewsQuery.data?.[section.section]} />
            </span>
          </Link>
        ))}
      </nav>

      <nav className="mt-3">{wideTile(last)}</nav>
    </main>
  );
}
