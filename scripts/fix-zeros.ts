import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { dailyMetrics } from "../src/lib/db/schema";
import { fetchNpmDownloads } from "../src/lib/sources/npm";
import { fetchPypiDownloads } from "../src/lib/sources/pypi";
import { fetchGithubCommits, sleep } from "../src/lib/sources/github";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Finds all rows in daily_metrics where value = 0 and retries fetching
 * data from the original source. Only updates if the new value is > 0.
 */
async function fixZeros() {
  // Find all zero-value rows
  const zeros = await db
    .select()
    .from(dailyMetrics)
    .where(eq(dailyMetrics.value, 0));

  if (zeros.length === 0) {
    console.log("No zero-value rows found. Nothing to fix.");
    return;
  }

  console.log(`Found ${zeros.length} zero-value row(s):\n`);
  for (const row of zeros) {
    console.log(`  ${row.date} / ${row.source}`);
  }
  console.log();

  // Group by source for efficient fetching
  const npmDates = zeros.filter((r) => r.source === "npm").map((r) => r.date);
  const pypiDates = zeros.filter((r) => r.source === "pypi").map((r) => r.date);
  const githubDates = zeros
    .filter((r) => r.source === "github_commits")
    .map((r) => r.date);

  let fixed = 0;

  // Fix npm zeros — fetch a range covering all bad dates
  if (npmDates.length > 0) {
    console.log(`Retrying ${npmDates.length} npm date(s)...`);
    const sorted = [...npmDates].sort();
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    try {
      const data = await fetchNpmDownloads(start, end);
      const lookup = new Map(data.map((d) => [d.date, d.value]));
      for (const date of npmDates) {
        const value = lookup.get(date);
        if (value && value > 0) {
          await db
            .update(dailyMetrics)
            .set({ value })
            .where(
              and(eq(dailyMetrics.date, date), eq(dailyMetrics.source, "npm"))
            );
          console.log(`  ✓ npm ${date} → ${value.toLocaleString()}`);
          fixed++;
        } else {
          console.log(`  ✗ npm ${date} — API still returned ${value ?? "no data"}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ npm fetch failed:`, err);
    }
  }

  // Fix PyPI zeros
  if (pypiDates.length > 0) {
    console.log(`Retrying ${pypiDates.length} PyPI date(s)...`);
    try {
      const data = await fetchPypiDownloads();
      const lookup = new Map(data.map((d) => [d.date, d.value]));
      for (const date of pypiDates) {
        const value = lookup.get(date);
        if (value && value > 0) {
          await db
            .update(dailyMetrics)
            .set({ value })
            .where(
              and(eq(dailyMetrics.date, date), eq(dailyMetrics.source, "pypi"))
            );
          console.log(`  ✓ pypi ${date} → ${value.toLocaleString()}`);
          fixed++;
        } else {
          console.log(`  ✗ pypi ${date} — API still returned ${value ?? "no data"}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ PyPI fetch failed:`, err);
    }
  }

  // Fix GitHub zeros — one API call per date with pacing
  if (githubDates.length > 0) {
    console.log(`Retrying ${githubDates.length} GitHub date(s)...`);
    for (let i = 0; i < githubDates.length; i++) {
      const date = githubDates[i];
      try {
        const result = await fetchGithubCommits(date);
        if (result.value > 0) {
          await db
            .update(dailyMetrics)
            .set({ value: result.value })
            .where(
              and(
                eq(dailyMetrics.date, date),
                eq(dailyMetrics.source, "github_commits")
              )
            );
          console.log(`  ✓ github ${date} → ${result.value.toLocaleString()}`);
          fixed++;
        } else {
          console.log(`  ✗ github ${date} — API still returned 0`);
        }
      } catch (err) {
        console.error(`  ✗ github ${date} failed:`, err);
      }
      if (i < githubDates.length - 1) {
        await sleep(4000);
      }
    }
  }

  console.log(`\nDone! Fixed ${fixed} of ${zeros.length} zero-value row(s).`);
}

fixZeros().catch((err) => {
  console.error("fix-zeros failed:", err);
  process.exit(1);
});
