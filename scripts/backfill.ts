import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { dailyMetrics } from "../src/lib/db/schema";
import { fetchNpmDownloads } from "../src/lib/sources/npm";
import { fetchPypiDownloads } from "../src/lib/sources/pypi";
import { fetchGithubCommits, sleep } from "../src/lib/sources/github";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function backfill() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  console.log(`Backfilling data from ${start} to ${end}...\n`);

  // 1. Fetch npm downloads (1 API call)
  console.log("Fetching npm downloads...");
  const npmData = await fetchNpmDownloads(start, end);
  console.log(`  Got ${npmData.length} days of npm data`);

  // 2. Fetch PyPI downloads (1 API call)
  console.log("Fetching PyPI downloads...");
  const pypiData = await fetchPypiDownloads();
  // Filter to our date range
  const pypiFiltered = pypiData.filter((d) => d.date >= start && d.date <= end);
  console.log(`  Got ${pypiFiltered.length} days of PyPI data`);

  // 3. Fetch GitHub commits (1 API call per day, with pacing)
  console.log("Fetching GitHub commits (this will take ~2 minutes)...");
  const dates: string[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }

  const githubData: { date: string; value: number }[] = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    console.log(`  [${i + 1}/${dates.length}] Fetching commits for ${date}...`);
    try {
      const result = await fetchGithubCommits(date);
      githubData.push(result);
      console.log(`    → ${result.value.toLocaleString()} commits`);
    } catch (err) {
      console.error(`    ✗ Failed for ${date}:`, err);
      githubData.push({ date, value: 0 });
    }
    // Pace requests: 4s between calls to stay well within rate limits
    if (i < dates.length - 1) {
      await sleep(4000);
    }
  }

  // 4. Insert all rows with ON CONFLICT DO UPDATE
  console.log("\nInserting into database...");

  const rows = [
    ...npmData.map((d) => ({ date: d.date, source: "npm" as const, value: d.value })),
    ...pypiFiltered.map((d) => ({
      date: d.date,
      source: "pypi" as const,
      value: d.value,
    })),
    ...githubData.map((d) => ({
      date: d.date,
      source: "github_commits" as const,
      value: d.value,
    })),
  ];

  // Batch insert with upsert
  for (const row of rows) {
    await db
      .insert(dailyMetrics)
      .values(row)
      .onConflictDoUpdate({
        target: [dailyMetrics.date, dailyMetrics.source],
        set: { value: row.value },
      });
  }

  console.log(`\nDone! Inserted/updated ${rows.length} rows.`);
  console.log(
    `  npm: ${npmData.length}, pypi: ${pypiFiltered.length}, github: ${githubData.length}`
  );
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
