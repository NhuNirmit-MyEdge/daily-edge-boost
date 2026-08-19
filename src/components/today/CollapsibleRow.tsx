import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleRow({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold leading-snug">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-border px-4 py-3">{children}</div> : null}
    </div>
  );
}
