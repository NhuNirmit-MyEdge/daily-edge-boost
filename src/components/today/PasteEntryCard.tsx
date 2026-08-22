import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EntryParseError, loadPastedEntry, todayISO, type LoadReport } from "@/lib/today";
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
  const [report, setReport] = useState<LoadReport | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setError(null);
    setReport(null);
    setBusy(true);
    try {
      const result = await loadPastedEntry(text, entryDate);
      setReport(result);
      if (result.hasFailures) toast.error("Loaded with some failures — see the details below.");
      else toast.success(result.summary);
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
          Expects these top-level fields: entry_date, news_brief (10 stories — each with category,
          headline, what_happened, why_it_matters, why_it_matters_to_you, watch_next), lesson, quiz
          (question, options, correct_index, explanation), task, influencers (name, why_relevant),
          video_recommendation (title, url, duration_note) and company_updates (company_name,
          entry_date, headline, summary, source_url). Every field present is saved independently —
          you&apos;ll get a per-field confirmation below.
        </p>

        <textarea
          id="paste-entry"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={'{"entry_date":"2026-08-21","news_brief":[…],"lesson":{},"quiz":[{"question":"…","options":["a","b","c","d"],"correct_index":0,"explanation":"…"}],"task":"…","influencers":[],"video_recommendation":{},"company_updates":[]}'}
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? (
          <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}

        {report ? (
          <div className="mt-3 rounded-xl border border-border bg-background p-3">
            <p className="text-xs font-medium">{report.summary}</p>
            <ul className="mt-2 space-y-1">
              {report.fields.map((f) => (
                <li
                  key={f.key}
                  className={
                    f.status === "failed"
                      ? "text-xs text-destructive"
                      : f.status === "missing"
                        ? "text-xs text-muted-foreground"
                        : "text-xs text-foreground/85"
                  }
                >
                  {f.status === "ok" ? "✓" : f.status === "failed" ? "✗" : "—"} {f.label}
                  {f.detail && f.detail !== f.label ? ` · ${f.detail}` : ""}
                </li>
              ))}
            </ul>
            {report.entryDate !== todayISO() ? (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Note: this was saved for {report.entryDate}, not today ({todayISO()}), so the
                section pages — which show today&apos;s entry — won&apos;t display it.
              </p>
            ) : null}
          </div>
        ) : null}

        <Button className="mt-3 w-full" onClick={onSave} disabled={busy || text.trim().length === 0}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
