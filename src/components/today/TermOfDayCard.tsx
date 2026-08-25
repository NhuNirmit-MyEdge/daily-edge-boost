import type { TermOfDay } from "@/lib/today";

export function TermOfDayBody({ term }: { term: TermOfDay }) {
  return (
    <div>
      {term.category ? <p className="eyebrow">{term.category}</p> : null}
      <h2 className="mt-1 text-sm font-semibold leading-snug">{term.term}</h2>
      {term.definition ? (
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{term.definition}</p>
      ) : null}
      {term.example_or_context ? (
        <div className="mt-3 rounded-xl bg-secondary/60 p-3">
          <p className="eyebrow">In context</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">{term.example_or_context}</p>
        </div>
      ) : null}
    </div>
  );
}
