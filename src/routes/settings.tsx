import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/today/SectionPage";
import { EXPERIENCE_LEVELS, FOCUS_TOPICS, saveOnboarding, signOut, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — MyEdge" }],
  }),
  component: SettingsPage,
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

function SettingsPage() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [topics, setTopics] = useState<string[]>([]);
  const [level, setLevel] = useState<string>(EXPERIENCE_LEVELS[1]);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setTopics(profile.focus_topics ?? []);
    setLevel(profile.experience_level ?? EXPERIENCE_LEVELS[1]);
    setRole(profile.role_title ?? "");
  }, [profile]);

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveOnboarding({ focusTopics: topics, experienceLevel: level, roleTitle: role });
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
        <div>
          <Label>What are you most interested in?</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FOCUS_TOPICS.map((topic) => (
              <Chip key={topic} label={topic} active={topics.includes(topic)} onClick={() => toggleTopic(topic)} />
            ))}
          </div>
        </div>

        <div>
          <Label>Experience level</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXPERIENCE_LEVELS.map((l) => (
              <Chip key={l} label={l} active={level === l} onClick={() => setLevel(l)} />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Your role or goal</Label>
          <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>

        <Button onClick={save} disabled={busy} className="w-full">
          Save changes
        </Button>
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
