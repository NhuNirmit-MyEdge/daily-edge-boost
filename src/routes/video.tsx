import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { HistorySection } from "@/components/today/HistorySection";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Video Recommendation — MyEdge" },
      {
        name: "description",
        content: "Every short YouTube video recommendation so far — each under 20 minutes.",
      },
      { property: "og:title", content: "Video Recommendation — MyEdge" },
      { property: "og:description", content: "Short video picks, newest first." },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  return (
    <HistorySection
      title="Videos"
      section="video"
      emptyTitle="No videos yet"
      emptyBody="Load a briefing that includes a video recommendation and it'll show up here."
      hasContent={(entry) =>
        Boolean(entry.video_recommendation?.title || entry.video_recommendation?.url)
      }
      render={(entry) => {
        const video = entry.video_recommendation!;
        return (
          <div>
            <Play className="h-5 w-5 text-primary" aria-hidden="true" />
            {video.category ? <p className="mt-2 eyebrow">{video.category}</p> : null}
            <h3 className="mt-2 text-sm font-semibold leading-snug">
              {video.title ?? "Watch this"}
            </h3>
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
          </div>
        );
      }}
    />
  );
}
