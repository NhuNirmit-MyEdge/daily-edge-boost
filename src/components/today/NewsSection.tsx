import type { NewsItem } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{value}</p>
    </div>
  );
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <SectionHeading label="News" hint={`${items.length} stories`} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <article
            key={index}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <h3 className="text-base font-semibold leading-snug">{item.headline}</h3>
            <div className="mt-3 space-y-3">
              <Field label="What happened" value={item.what_happened} />
              <Field label="Why it matters" value={item.why_it_matters} />
              <Field label="Why it matters to me" value={item.why_it_matters_to_me} />
              <Field label="What to watch next" value={item.what_to_watch_next} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
