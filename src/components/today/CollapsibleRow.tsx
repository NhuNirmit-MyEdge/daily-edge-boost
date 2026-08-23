import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleRow({
  title,
  subtitle,
  open,
  onToggle,
  badge = false,
  badgeLabel = "New update today",
  actions,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  open: boolean;
  onToggle: () => void;
  badge?: boolean;
  badgeLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-start">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex flex-1 items-start justify-between gap-3 p-4 text-left"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold leading-snug">
            {title}
            {badge ? (
              <span
                title={badgeLabel}
                aria-label={badgeLabel}
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            ) : null}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {actions ? <div className="flex items-center py-4 pr-3">{actions}</div> : null}
      </div>
      {open ? <div className="border-t border-border px-4 py-3">{children}</div> : null}
    </div>
  );
}
