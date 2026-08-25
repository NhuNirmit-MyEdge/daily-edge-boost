import type { PerspectiveOfDay } from "@/lib/today";

export function PerspectiveOfDayBody({ perspective }: { perspective: PerspectiveOfDay }) {
  return (
    <div>
      {perspective.category ? <p className="eyebrow">{perspective.category}</p> : null}
      <h2 className="mt-1 text-sm font-semibold leading-snug">{perspective.question}</h2>

      <div className="mt-3 space-y-2">
        {perspective.perspective_one ? (
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-foreground">{perspective.perspective_one.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">
              {perspective.perspective_one.argument}
            </p>
          </div>
        ) : null}
        {perspective.perspective_two ? (
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-foreground">{perspective.perspective_two.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">
              {perspective.perspective_two.argument}
            </p>
          </div>
        ) : null}
      </div>

      {perspective.closing_note ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{perspective.closing_note}</p>
      ) : null}
    </div>
  );
}
