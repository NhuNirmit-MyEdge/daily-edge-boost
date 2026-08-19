import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CollapsibleRow } from "@/components/today/CollapsibleRow";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import { addCompany, fetchCompanies, fetchCompanyUpdates } from "@/lib/tracking";
import { EntryParseError } from "@/lib/today";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies to Follow — MyEdge" },
      {
        name: "description",
        content: "Track the companies you follow and a dated timeline of updates for each one.",
      },
      { property: "og:title", content: "Companies to Follow — MyEdge" },
      { property: "og:description", content: "A tracked list of companies and their latest updates." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });
  const updatesQuery = useQuery({ queryKey: ["company-updates"], queryFn: fetchCompanyUpdates });
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const addMutation = useMutation({
    mutationFn: (value: string) => addCompany(value),
    onSuccess: () => {
      setName("");
      toast.success("Company added");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (err) =>
      toast.error(err instanceof EntryParseError ? err.message : "Couldn't add that company."),
  });

  const companies = companiesQuery.data ?? [];
  const updates = updatesQuery.data ?? [];

  return (
    <PageShell title="Companies to Follow">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addMutation.mutate(name);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a company"
          aria-label="Add a company"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={addMutation.isPending || name.trim().length === 0}>
          Add
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {companiesQuery.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-card" />)
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies yet"
            body="Add a company above to start tracking updates about it."
          />
        ) : (
          companies.map((company) => {
            const timeline = updates.filter((u) => u.company_id === company.id);
            return (
              <CollapsibleRow
                key={company.id}
                title={company.name}
                open={openId === company.id}
                onToggle={() => setOpenId(openId === company.id ? null : company.id)}
              >
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates logged yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {timeline.map((u) => (
                      <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                        <p className="text-xs text-muted-foreground">{u.entry_date}</p>
                        <p className="text-sm font-medium leading-snug">{u.headline}</p>
                        {u.summary ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {u.summary}
                          </p>
                        ) : null}
                        {u.source_url ? (
                          <a
                            href={u.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-primary underline"
                          >
                            Source
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </CollapsibleRow>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
