import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPERIENCE_LEVELS, FOCUS_TOPICS, saveOnboarding, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up MyEdge" }],
  }),
  component: OnboardingPage,
});

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [topics, setTopics] = useState<string[]>([]);
  const [level, setLevel] = useState<string>(EXPERIENCE_LEVELS[1]);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await saveOnboarding({ focusTopics: topics, experienceLevel: level, roleTitle: role });
      await refreshProfile();
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-10">
      <h1 className="text-2xl font-semibold tracking-tight">A few quick questions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This tailors what you see — you can change it any time from Settings.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <Label>What are you most interested in?</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            News gets ordered to put these topics first for you.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FOCUS_TOPICS.map((topic) => (
              <Chip key={topic} label={topic} active={topics.includes(topic)} onClick={() => toggleTopic(topic)} />
            ))}
          </div>
        </div>

        <div>
          <Label>How would you describe your experience level?</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXPERIENCE_LEVELS.map((l) => (
              <Chip key={l} label={l} active={level === l} onClick={() => setLevel(l)} />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Your role or goal (optional)</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Product manager, founder, investor…"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          Continue
        </Button>
      </form>
    </main>
  );
}
