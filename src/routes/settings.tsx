import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/today/SectionPage";
import { AGE_RANGES, FOCUS_TOPICS, GENDER_OPTIONS, MAX_FOCUS_TOPICS, saveOnboarding, signOut, useAuth } from "@/lib/auth";
import { fetchCompanies, fetchMyTrackedCompanyIds, setTrackedCompanies } from "@/lib/tracking";

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
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });
  const trackedQuery = useQuery({ queryKey: ["tracked-companies"], queryFn: fetchMyTrackedCompanyIds });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setAgeRange(profile.age_range);
    setGender(profile.gender);
    setTopics(profile.focus_topics ?? []);
  }, [profile]);

  useEffect(() => {
    if (trackedQuery.data) setCompanyIds([...trackedQuery.data]);
  }, [trackedQuery.data]);

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

  const save = async () => {
    if (!ageRange || !gender) {
      toast.error("Pick an age range and gender first.");
      return;
    }
    setBusy(true);
    try {
      await saveOnboarding({ name, ageRange, gender, focusTopics: topics });
      await setTrackedCompanies(companyIds);
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

        {companiesQuery.data?.length ? (
          <div>
            <Label>Companies you track</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {companiesQuery.data.map((c) => (
                <Chip key={c.id} label={c.name} active={companyIds.includes(c.id)} onClick={() => toggleCompany(c.id)} />
              ))}
            </div>
          </div>
        ) : null}

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
