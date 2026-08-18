import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/today";
import { fetchQuizResponses, saveQuizResponse } from "@/lib/today";
import { SectionHeading } from "./SectionHeading";

type Answers = Record<number, { selected: number; correct: boolean }>;

export function QuizSection({
  questions,
  entryDate,
  streak,
}: {
  questions: QuizQuestion[];
  entryDate: string;
  streak: number;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    let active = true;
    fetchQuizResponses(entryDate)
      .then((rows) => {
        if (!active || !rows.length) return;
        const restored: Answers = {};
        rows.forEach((row) => {
          restored[row.question_index] = {
            selected: row.selected_index,
            correct: row.correct,
          };
        });
        setAnswers(restored);
        const next = questions.findIndex((_, i) => restored[i] === undefined);
        setIndex(next === -1 ? questions.length : next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [entryDate, questions]);

  if (!questions.length) return null;

  const answeredCount = Object.keys(answers).length;
  const score = Object.values(answers).filter((a) => a.correct).length;
  const finished = index >= questions.length;
  const question = questions[index];
  const current = answers[index];

  const onSelect = async (optionIndex: number) => {
    if (current) return;
    const correct = optionIndex === question?.correct_index;
    setAnswers((prev) => ({ ...prev, [index]: { selected: optionIndex, correct } }));
    try {
      await saveQuizResponse({
        entryDate,
        questionIndex: index,
        selectedIndex: optionIndex,
        correct,
      });
    } catch {
      toast.error("Couldn't save that answer");
    }
  };

  return (
    <section>
      <SectionHeading
        label="Quiz"
        hint={finished ? "Complete" : `Question ${index + 1} of ${questions.length}`}
      />
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {finished || !question ? (
          <div className="text-center">
            <p className="eyebrow">Your score</p>
            <p className="mt-1 text-4xl font-semibold text-primary">
              {score}
              <span className="text-xl text-muted-foreground">/{questions.length}</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1.5 text-sm">
              <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
              {streak} day streak
            </div>
            {answeredCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full"
                onClick={() => setIndex(0)}
              >
                Review answers
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold leading-snug">{question.question}</h3>
            <div className="mt-4 space-y-2">
              {(question.options ?? []).map((option, optionIndex) => {
                const isSelected = current?.selected === optionIndex;
                const isCorrect = question.correct_index === optionIndex;
                const reveal = Boolean(current);
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() => void onSelect(optionIndex)}
                    disabled={reveal}
                    className={cn(
                      "w-full rounded-xl border border-border bg-secondary/40 px-3 py-3 text-left text-sm transition-colors",
                      !reveal && "hover:bg-secondary",
                      reveal && isCorrect && "border-success/60 bg-success/15 text-success",
                      reveal &&
                        isSelected &&
                        !isCorrect &&
                        "border-destructive/60 bg-destructive/15 text-destructive",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {current ? (
              <div className="mt-4 rounded-xl bg-secondary/60 p-3">
                <p className={cn("text-sm font-medium", current.correct ? "text-success" : "text-destructive")}>
                  {current.correct ? "Correct" : "Not quite"}
                </p>
                {question.explanation ? (
                  <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                    {question.explanation}
                  </p>
                ) : null}
                <Button className="mt-3 w-full" size="sm" onClick={() => setIndex(index + 1)}>
                  {index + 1 === questions.length ? "See score" : "Next question"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
}
