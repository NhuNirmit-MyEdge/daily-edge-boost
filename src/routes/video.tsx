import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { EmptyState, EntrySection } from "@/components/today/SectionPage";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Video Recommendation — MyEdge" },
      {
        name: "description",
        content: "One short YouTube video worth watching today — under 20 minutes.",
      },
      { property: "og:title", content: "Video Recommendation — MyEdge" },
      { property: "og:description", content: "Today's short video pick." },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  return (
    <EntrySection
      title="Video Recommendation"
      render={(entry) => {
        const video = entry.video_recommendation;
        if (!video || (!video.title && !video.url)) {
          return (
            <EmptyState
              title="No video today"
              body="Today's briefing didn't include a video recommendation."
            />
          );
        }
        return (
          <article className="rounded-2xl border border-border bg-card p-4">
            <Play className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-2 text-sm font-semibold leading-snug">{video.title ?? "Watch this"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {video.duration_note ?? "Under 20 minutes"}
            </p>
            {video.url ? (
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block break-all text-sm text-primary underline"
              >
                {video.url}
              </a>
            ) : null}
          </article>
        );
      }}
    />
  );
}
