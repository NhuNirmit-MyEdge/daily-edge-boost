import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson } from "@/lib/today";
import { fetchReflection, saveReflection } from "@/lib/today";

export function LessonCard({
  lesson,
  entryDate,
  defaultOpen = false,
}: {
  lesson: Lesson;
  entryDate: string;
  defaultOpen?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

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
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="flex-1">
          {meta ? <span className="eyebrow block">{meta}</span> : null}
          <span className="mt-1 block text-sm font-semibold leading-snug">{lesson.title}</span>
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="border-t border-border px-4 py-4">
          {lesson.content ? (
            <p className="text-sm leading-relaxed text-foreground/85">{lesson.content}</p>
          ) : null}

          <div className="mt-4 rounded-xl bg-secondary/60 p-3">
            <label htmlFor={`reflection-${entryDate}`} className="eyebrow">
              Explain this in your own words
            </label>
            <Textarea
              id={`reflection-${entryDate}`}
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
        </div>
      ) : null}
    </article>
  );
}
