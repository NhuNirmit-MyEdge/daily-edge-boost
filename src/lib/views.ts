import { supabase } from "@/integrations/supabase/client";

function isoDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Records that a section was viewed today. Best-effort — never blocks or breaks the page. */
export async function recordSectionView(section: string) {
  try {
    const { error } = await supabase
      .from("section_views")
      .upsert({ section, view_date: isoDate(new Date()) }, { onConflict: "section,view_date" });
    if (error) console.error("[views] couldn't record view:", error.message);
  } catch (err) {
    console.error("[views] couldn't record view:", err);
  }
}

/** section -> last `days` days, oldest first, true where that section was viewed that day. */
export type SectionViewHistory = Record<string, boolean[]>;

export async function fetchSectionViewHistory(
  sections: readonly string[],
  days = 7,
): Promise<SectionViewHistory> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startISO = isoDate(start);

  const { data, error } = await supabase
    .from("section_views")
    .select("section, view_date")
    .gte("view_date", startISO);
  if (error) throw error;

  const seen = new Set(
    (data ?? []).map((r: { section: string; view_date: string }) => `${r.section}|${r.view_date}`),
  );
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(isoDate(d));
  }

  const result: SectionViewHistory = {};
  for (const section of sections) {
    result[section] = dates.map((d) => seen.has(`${section}|${d}`));
  }
  return result;
}
