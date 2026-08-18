import type { ExpertInsight } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

export function InsightCard({ insight }: { insight: ExpertInsight }) {
  return (
    <section>
      <SectionHeading label="Expert insight" />
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-base font-semibold leading-snug">{insight.title}</h3>
        {insight.source ? (
          <p className="mt-1 text-xs text-muted-foreground">{insight.source}</p>
        ) : null}
        {insight.key_idea ? (
          <div className="mt-3 border-l-2 border-primary pl-3">
            <p className="eyebrow">Key idea</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{insight.key_idea}</p>
          </div>
        ) : null}
        {insight.application ? (
          <div className="mt-3">
            <p className="eyebrow">Application</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{insight.application}</p>
          </div>
        ) : null}
      </article>
    </section>
  );
}
