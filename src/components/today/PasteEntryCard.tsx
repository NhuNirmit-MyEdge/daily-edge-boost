import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EntryParseError, parseEntryJSON, upsertDailyEntry } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

export function PasteEntryCard({
  entryDate,
  onSaved,
}: {
  entryDate: string;
  onSaved: () => void | Promise<unknown>;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setError(null);
    setBusy(true);
    try {
      const entry = parseEntryJSON(text, entryDate);
      await upsertDailyEntry(entry);
      toast.success("Today's edge is loaded");
      setText("");
      await onSaved();
    } catch (err) {
      if (err instanceof EntryParseError) {
        setError(err.message);
      } else {
        setError("Couldn't save that content. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionHeading label="Load today" hint={entryDate} />
      <div className="rounded-2xl border border-border bg-card p-4">
        <label htmlFor="paste-entry" className="text-sm font-medium">
          Paste today&apos;s MyEdge content
        </label>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Expects: entry_date, news_brief (10 stories — 2 each from Healthcare, Technology,
          Business, Venture Capital, Global Affairs, each with category, headline, what_happened,
          why_it_matters, why_it_matters_to_you, watch_next), lesson, task, quiz.
        </p>
        <textarea
          id="paste-entry"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={'{"entry_date":"2026-08-19","news_brief":[{"category":"Healthcare","headline":"…","what_happened":"…","why_it_matters":"…","why_it_matters_to_you":"…","watch_next":"…"}],"lesson":{},"task":"…","quiz":[]}'}
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? (
          <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}
        <Button className="mt-3 w-full" onClick={onSave} disabled={busy || text.trim().length === 0}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
