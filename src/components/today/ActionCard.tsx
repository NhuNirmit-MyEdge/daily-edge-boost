import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { completeTask, fetchTaskCompletion, type TaskContent } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

export function ActionCard({ task, entryDate }: { task: TaskContent; entryDate: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTaskCompletion(entryDate)
      .then((row) => {
        if (active && row?.completed) setDone(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [entryDate]);

  const onComplete = async () => {
    setBusy(true);
    try {
      await completeTask(entryDate);
      setDone(true);
      toast.success("Nice — action complete");
    } catch {
      toast.error("Couldn't mark it complete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionHeading label="Today's action" />
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {task.category ? <p className="eyebrow">{task.category}</p> : null}
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{task.description}</p>
        {done ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            Completed today
          </div>
        ) : (
          <Button onClick={onComplete} disabled={busy} className="mt-4 w-full">
            {busy ? "Saving…" : "Mark complete"}
          </Button>
        )}
      </article>
    </section>
  );
}
