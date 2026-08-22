import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BulkImportBox } from "@/components/today/BulkImportBox";
import { CollapsibleRow } from "@/components/today/CollapsibleRow";
import { EmptyState, PageShell } from "@/components/today/SectionPage";
import {
  addCompany,
  fetchCompanies,
  fetchCompanyUpdates,
  groupUpdatesByPeriod,
  importCompanyHistory,
  parseCompanyHistoryJSON,
} from "@/lib/tracking";
import { EntryParseError, formatDateShort } from "@/lib/today";

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
            const timeline = updates
              .filter((u) => u.company_id === company.id)
              .slice()
              .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
            const groups = groupUpdatesByPeriod(timeline);
            return (
              <CollapsibleRow
                key={company.id}
                title={company.name}
                subtitle={timeline.length ? `${timeline.length} updates` : undefined}
                open={openId === company.id}
                onToggle={() => setOpenId(openId === company.id ? null : company.id)}
              >
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates logged yet.</p>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div key={group.key}>
                        <p className="eyebrow">{group.label}</p>
                        <ol className="mt-2 space-y-3">
                          {group.items.map((u) => (
                            <li key={u.id} className="border-l-2 border-primary/40 pl-3">
                              <p className="text-xs text-muted-foreground">
                                {formatDateShort(u.entry_date)}
                              </p>
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
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleRow>
            );
          })
        )}
      </div>

      <BulkImportBox
        heading="Import company history"
        instructions='Paste a JSON array (or an object with a "company_updates" array) of items with company_name, entry_date (YYYY-MM-DD), headline, summary and source_url. Companies you are not tracking yet will be created, and re-pasting the same updates will not duplicate them.'
        placeholder={'[{"company_name":"Anthropic","entry_date":"2026-08-20","headline":"New model released","summary":"…","source_url":"https://…"}]'}
        submitLabel="Import history"
        onSubmit={async (text) => {
          const parsed = parseCompanyHistoryJSON(text);
          const result = await importCompanyHistory(parsed);
          await queryClient.invalidateQueries({ queryKey: ["companies"] });
          await queryClient.invalidateQueries({ queryKey: ["company-updates"] });
          return [
            `Parsed ${parsed.length} entries ✓`,
            `${result.createdCompanies} new companies created ✓`,
            `${result.inserted} company updates saved ✓`,
            ...(parsed.length - result.inserted > 0
              ? [`${parsed.length - result.inserted} entries skipped ✗ (could not match a company)`]
              : []),
          ];
        }}
      />
    </PageShell>
  );
}
