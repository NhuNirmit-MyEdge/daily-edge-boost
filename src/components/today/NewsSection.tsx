import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { NewsItem } from "@/lib/today";
import { NEWS_CATEGORIES } from "@/lib/today";

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
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <h3 className="flex-1 text-sm font-semibold leading-snug">{item.headline}</h3>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <Field label="What happened" value={item.what_happened} />
          <Field label="Why it matters" value={item.why_it_matters} />
          <Field
            label="Why it matters to me"
            value={item.why_it_matters_to_you ?? item.why_it_matters_to_me}
          />
          <Field label="What to watch next" value={item.watch_next ?? item.what_to_watch_next} />
        </div>
      ) : null}
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
    <section className="space-y-6">
      {known.map((category) => (
        <div key={category} className="space-y-2">
          <p className="eyebrow">{category}</p>
          {items
            .filter((i) => i.category?.toLowerCase() === category.toLowerCase())
            .map((item, index) => (
              <NewsCard key={`${category}-${index}`} item={item} />
            ))}
        </div>
      ))}
      {uncategorised.length ? (
        <div className="space-y-2">
          {known.length ? <p className="eyebrow">More</p> : null}
          {uncategorised.map((item, index) => (
            <NewsCard key={`other-${index}`} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
