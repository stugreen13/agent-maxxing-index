/**
 * Fetches npm download counts for all packages combined.
 * Uses the npm registry API: https://api.npmjs.org/downloads/range/{start}:{end}
 * Returns an array of { date, value } objects.
 */
export async function fetchNpmDownloads(
  startDate: string,
  endDate: string
): Promise<{ date: string; value: number }[]> {
  const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`npm API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.downloads as { day: string; downloads: number }[]).map((d) => ({
    date: d.day,
    value: d.downloads,
  }));
}
