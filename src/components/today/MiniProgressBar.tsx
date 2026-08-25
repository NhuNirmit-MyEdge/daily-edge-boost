/** A compact 7-day view history: one segment per day, filled if that section was viewed that day. */
export function MiniProgressBar({ history }: { history: boolean[] | undefined }) {
  if (!history) return null;
  const viewedCount = history.filter(Boolean).length;

  return (
    <div className="mt-2 flex items-center gap-1.5" aria-label={`Viewed ${viewedCount} of ${history.length} days this week`}>
      <div className="flex gap-0.5">
        {history.map((viewed, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${viewed ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      <span className="text-[0.625rem] text-muted-foreground">{viewedCount}/{history.length}</span>
    </div>
  );
}
