import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson } from "@/lib/today";
import { fetchReflection, saveReflection } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

export function LessonCard({ lesson, entryDate }: { lesson: Lesson; entryDate: string }) {
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchReflection(entryDate)
      .then((value) => {
        if (active && value) setAnswer(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [entryDate]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveReflection(entryDate, answer);
      toast.success("Answer saved");
    } catch {
      toast.error("Couldn't save your answer");
    } finally {
      setSaving(false);
    }
  };

  const meta = [lesson.module, lesson.day].filter(Boolean).join(" · ");

  return (
    <section>
      <SectionHeading label="Today's lesson" hint={meta || undefined} />
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-base font-semibold leading-snug">{lesson.title}</h3>
        {lesson.content ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{lesson.content}</p>
        ) : null}

        <div className="mt-4 rounded-xl bg-secondary/60 p-3">
          <label htmlFor="reflection" className="eyebrow">
            Explain this in your own words
          </label>
          <Textarea
            id="reflection"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={4}
            placeholder="In my own words…"
            className="mt-2 resize-none bg-background/60"
          />
          <Button
            onClick={onSave}
            disabled={saving || answer.trim().length === 0}
            size="sm"
            className="mt-3 w-full"
          >
            {saving ? "Saving…" : "Save answer"}
          </Button>
        </div>
      </article>
    </section>
  );
}
