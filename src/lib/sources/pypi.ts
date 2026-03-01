/**
 * Fetches total PyPI download counts per day using the PyPI stats API.
 * Uses pypistats.org: https://pypistats.org/api/packages/__all__/overall
 * Returns an array of { date, value } objects for the last 30 days.
 */
export async function fetchPypiDownloads(): Promise<
  { date: string; value: number }[]
> {
  const url =
    "https://pypistats.org/api/packages/__all__/overall?mirrors=true";
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`PyPI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // Aggregate "with_mirrors" and "without_mirrors" rows by date
  const byDate = new Map<string, number>();
  for (const row of data.data as {
    category: string;
    date: string;
    downloads: number;
  }[]) {
    if (row.category === "with_mirrors") {
      byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.downloads);
    }
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
