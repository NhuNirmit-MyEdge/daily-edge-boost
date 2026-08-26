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
          Expects a top-level entry_date plus a <code>users</code> array — one object per
          signed-up person, each with their email and their own news_brief (category, headline,
          what_happened, why_it_matters, why_it_matters_to_you, watch_next), lesson, quiz (5
          questions), task, influencers, video_recommendation, term_of_the_day and
          perspective_of_the_day, tailored to that person&apos;s interests. company_updates stays a
          single shared list at the top level, outside the users array — those facts are the same
          for everyone tracking that company. Every field, for every person, saves independently —
          one person or one field failing never blocks the rest.
        </p>

        <textarea
          id="paste-entry"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={'{"entry_date":"2026-08-27","users":[{"email":"person@example.com","news_brief":[…],"lesson":{},"quiz":[{"question":"…","options":["a","b","c","d"],"correct_index":0,"explanation":"…"}],"task":"…","influencers":[],"video_recommendation":{}}],"company_updates":[]}'}
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

            <div className="mt-3 space-y-3">
              {report.users.map((u, i) => (
                <div key={`${u.email}-${i}`}>
                  <p className="text-xs font-semibold">{u.matched ? u.email : `${u.email} — not saved`}</p>
                  <ul className="mt-1 space-y-1">
                    {u.fields.map((f) => (
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
                </div>
              ))}
            </div>

            <p
              className={`mt-3 text-xs ${report.companyUpdates.status === "failed" ? "text-destructive" : "text-foreground/85"}`}
            >
              {report.companyUpdates.status === "ok" ? "✓" : report.companyUpdates.status === "failed" ? "✗" : "—"}{" "}
              {report.companyUpdates.label}
              {report.companyUpdates.detail && report.companyUpdates.detail !== report.companyUpdates.label
                ? ` · ${report.companyUpdates.detail}`
                : ""}
            </p>

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
