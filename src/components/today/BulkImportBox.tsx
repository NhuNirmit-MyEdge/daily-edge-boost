import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/today/SectionHeading";
import { EntryParseError } from "@/lib/today";

export function BulkImportBox({
  heading,
  instructions,
  placeholder,
  submitLabel,
  onSubmit,
}: {
  heading: string;
  instructions: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<string>;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await onSubmit(text);
      setText("");
      setMessage(result);
    } catch (err) {
      setError(
        err instanceof EntryParseError ? err.message : "Couldn't import that. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8">
      <SectionHeading label={heading} />
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{instructions}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          spellCheck={false}
          aria-label={heading}
          placeholder={placeholder}
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? (
          <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{message}</p>
        ) : null}
        <Button className="mt-3 w-full" onClick={submit} disabled={busy || text.trim().length === 0}>
          {busy ? "Importing…" : submitLabel}
        </Button>
      </div>
    </section>
  );
}
