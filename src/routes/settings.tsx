import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/today/SectionPage";
import {
  AGE_RANGES,
  FOCUS_TOPICS,
  GENDER_OPTIONS,
  MAX_FOCUS_TOPICS,
  saveOnboarding,
  signOut,
  useAuth,
} from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — MyEdge" }],
  }),
  component: SettingsPage,
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

function SettingsPage() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setAgeRange(profile.age_range);
    setGender(profile.gender);
    setTopics(profile.focus_topics ?? []);
  }, [profile]);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_FOCUS_TOPICS) return prev;
      return [...prev, topic];
    });
  };

  const save = async () => {
    if (!ageRange || !gender) {
      toast.error("Pick an age range and gender first.");
      return;
    }
    setBusy(true);
    try {
      await saveOnboarding({ name, ageRange, gender, focusTopics: topics });
      await refreshProfile();
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Settings">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="eyebrow">Signed in as</p>
        <p className="mt-1 text-sm font-medium">{session?.user.email}</p>
        {profile?.is_admin ? (
          <p className="mt-1 text-xs text-muted-foreground">Admin — you can edit shared content</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
            Pick up to {MAX_FOCUS_TOPICS} ({topics.length}/{MAX_FOCUS_TOPICS} selected)
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

        <Button onClick={save} disabled={busy} className="w-full">
          Save changes
        </Button>

        <Link
          to="/companies"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Companies you track
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>

      <Button
        variant="outline"
        className="mt-8 w-full"
        onClick={async () => {
          await signOut();
          await navigate({ to: "/login" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        Sign out
      </Button>
    </PageShell>
  );
}
