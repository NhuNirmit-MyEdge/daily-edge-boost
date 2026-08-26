import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGE_RANGES, FOCUS_TOPICS, GENDER_OPTIONS, MAX_FOCUS_TOPICS, saveOnboarding, useAuth } from "@/lib/auth";
import { fetchCompanies, setTrackedCompanies } from "@/lib/tracking";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up MyEdge" }],
  }),
  component: OnboardingPage,
});

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });

  const toggleCompany = (id: string) => {
    setCompanyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleTopic = (topic: string) => {
    setTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_FOCUS_TOPICS) return prev;
      return [...prev, topic];
    });
  };

  const canSubmit = name.trim().length > 0 && ageRange && gender && topics.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageRange || !gender) return;
    setError(null);
    setBusy(true);
    try {
      await saveOnboarding({ name, ageRange, gender, focusTopics: topics });
      await setTrackedCompanies(companyIds);
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
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>

        <div>
          <Label>Age</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AGE_RANGES.map((a) => (
              <Chip key={a} label={a} active={ageRange === a} onClick={() => setAgeRange(a)} />
            ))}
          </div>
        </div>

        <div>
          <Label>Gender</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GENDER_OPTIONS.map((g) => (
              <Chip key={g} label={g} active={gender === g} onClick={() => setGender(g)} />
            ))}
          </div>
        </div>

        <div>
          <Label>Categories of interest</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick up to {MAX_FOCUS_TOPICS} — News gets ordered to put these first for you.
            {topics.length > 0 ? ` (${topics.length}/${MAX_FOCUS_TOPICS} selected)` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FOCUS_TOPICS.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                active={topics.includes(topic)}
                disabled={!topics.includes(topic) && topics.length >= MAX_FOCUS_TOPICS}
                onClick={() => toggleTopic(topic)}
              />
            ))}
          </div>
        </div>

        {companiesQuery.data?.length ? (
          <div>
            <Label>Companies you want to track (optional)</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;ll see updates for these on your Companies page — add or remove any time.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {companiesQuery.data.map((c) => (
                <Chip key={c.id} label={c.name} active={companyIds.includes(c.id)} onClick={() => toggleCompany(c.id)} />
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy || !canSubmit}>
          Continue
        </Button>
      </form>
    </main>
  );
}
