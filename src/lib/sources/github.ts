/**
 * Fetches the total number of public GitHub push events for a given date.
 * Uses the GitHub Events API via search: counts PushEvents from the events timeline.
 *
 * Since there's no direct "total commits" API, we use the GitHub search API
 * to count commits pushed on a given date across all public repos.
 *
 * Note: GitHub search API has rate limits (30 req/min unauthenticated, 10 req/min for search).
 * Use a PAT and generous pacing (3-4s between calls).
 */
export async function fetchGithubCommits(
  date: string
): Promise<{ date: string; value: number }> {
  const token = process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agent-maxxing-index",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Search for commits on this specific date
  const q = encodeURIComponent(`committer-date:${date}`);
  const url = `https://api.github.com/search/commits?q=${q}&per_page=1`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${res.statusText} - ${body}`);
  }

  const data = await res.json();
  return {
    date,
    value: data.total_count as number,
  };
}

/**
 * Helper to pause between API calls to respect rate limits.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
