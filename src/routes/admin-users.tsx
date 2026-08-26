import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { EmptyState, PageShell } from "@/components/today/SectionPage";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-users")({
  head: () => ({
    meta: [{ title: "Subscribers — MyEdge admin" }],
  }),
  component: AdminUsersPage,
});

type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  age_range: string | null;
  gender: string | null;
  focus_topics: string[];
  onboarded: boolean;
  companies: string[];
};

async function fetchSubscribers(): Promise<SubscriberRow[]> {
  const [{ data: profiles, error: profilesError }, { data: tracked, error: trackedError }, { data: companies, error: companiesError }] =
    await Promise.all([
      supabase.from("user_profiles").select("id, email, name, age_range, gender, focus_topics, onboarded"),
      supabase.from("user_tracked_companies").select("user_id, company_id"),
      supabase.from("companies").select("id, name"),
    ]);
  if (profilesError) throw profilesError;
  if (trackedError) throw trackedError;
  if (companiesError) throw companiesError;

  const companyNameById = new Map<string, string>(
    (companies ?? []).map((c: { id: string; name: string }) => [c.id, c.name]),
  );
  const companiesByUser = new Map<string, string[]>();
  for (const t of (tracked ?? []) as { user_id: string; company_id: string }[]) {
    const name = companyNameById.get(t.company_id);
    if (!name) continue;
    const list = companiesByUser.get(t.user_id) ?? [];
    list.push(name);
    companiesByUser.set(t.user_id, list);
  }

  return ((profiles ?? []) as Omit<SubscriberRow, "companies">[])
    .map((p) => ({ ...p, companies: (companiesByUser.get(p.id) ?? []).sort() }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

function AdminUsersPage() {
  const { profile } = useAuth();
  const query = useQuery({ queryKey: ["admin-subscribers"], queryFn: fetchSubscribers, enabled: Boolean(profile?.is_admin) });

  if (!profile?.is_admin) {
    return (
      <PageShell title="Subscribers">
        <EmptyState title="Admin only" body="This overview is only visible to the MyEdge admin." />
      </PageShell>
    );
  }

  const subscribers = query.data ?? [];

  return (
    <PageShell title="Subscribers">
      <p className="text-sm text-muted-foreground">
        Everyone who's signed up, with what they told you in onboarding — use this each morning to
        write each person's slice of the daily JSON.
      </p>

      <div className="mt-4 space-y-3">
        {query.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)
        ) : subscribers.length === 0 ? (
          <EmptyState title="No one's signed up yet" body="Once people create accounts, they'll show up here." />
        ) : (
          subscribers.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{s.name || "(no name given)"}</p>
                {!s.onboarded ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] font-medium text-secondary-foreground">
                    Hasn&apos;t finished onboarding
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{s.email}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Age · Gender</dt>
                  <dd>{[s.age_range, s.gender].filter(Boolean).join(" · ") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Interests</dt>
                  <dd>{s.focus_topics.length ? s.focus_topics.join(", ") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tracking</dt>
                  <dd>{s.companies.length ? s.companies.join(", ") : "—"}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
