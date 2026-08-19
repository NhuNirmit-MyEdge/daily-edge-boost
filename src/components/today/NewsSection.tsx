import type { NewsItem } from "@/lib/today";
import { NEWS_CATEGORIES } from "@/lib/today";
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

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {item.category ? (
        <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-secondary-foreground">
          {item.category}
        </span>
      ) : null}
      <h3 className="mt-2 text-base font-semibold leading-snug">{item.headline}</h3>
      <div className="mt-3 space-y-3">
        <Field label="What happened" value={item.what_happened} />
        <Field label="Why it matters" value={item.why_it_matters} />
        <Field
          label="Why it matters to me"
          value={item.why_it_matters_to_you ?? item.why_it_matters_to_me}
        />
        <Field label="What to watch next" value={item.watch_next ?? item.what_to_watch_next} />
      </div>
    </article>
  );
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;

  const known = NEWS_CATEGORIES.filter((c) =>
    items.some((i) => i.category?.toLowerCase() === c.toLowerCase()),
  );
  const uncategorised = items.filter(
    (i) => !known.some((c) => c.toLowerCase() === i.category?.toLowerCase()),
  );

  return (
    <section>
      <SectionHeading label="News" hint={`${items.length} stories`} />
      <div className="space-y-6">
        {known.map((category) => (
          <div key={category} className="space-y-3">
            <p className="eyebrow">{category}</p>
            {items
              .filter((i) => i.category?.toLowerCase() === category.toLowerCase())
              .map((item, index) => (
                <NewsCard key={`${category}-${index}`} item={item} />
              ))}
          </div>
        ))}
        {uncategorised.length ? (
          <div className="space-y-3">
            {uncategorised.map((item, index) => (
              <NewsCard key={`other-${index}`} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
