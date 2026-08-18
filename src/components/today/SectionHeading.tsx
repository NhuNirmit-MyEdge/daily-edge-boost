export function SectionHeading({
  label,
  hint,
}: {
  label: string;
  hint?: string | undefined;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="eyebrow">{label}</h2>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
