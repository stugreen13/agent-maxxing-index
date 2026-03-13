import { cacheLife, cacheTag } from "next/cache";
import { desc, eq, sql as dsql } from "drizzle-orm";
import { db } from "./db";
import { dailyMetrics } from "./db/schema";
import { fetchNpmDownloads } from "./sources/npm";
import { fetchPypiDownloads } from "./sources/pypi";
import { fetchGithubCommits } from "./sources/github";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Fetches dashboard data with hourly caching.
 * On each revalidation:
 * 1. Fetches current day's counts from APIs
 * 2. Upserts current day into database
 * 3. If yesterday's data is missing, backfills it
 * 4. Returns last 30 days from database
 */
export async function getDashboardData() {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  cacheTag("dashboard-data");

  const today = new Date();
  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Fetch current day data from APIs
  try {
    // npm: single day
    const npmData = await fetchNpmDownloads(todayStr, todayStr);
    if (npmData.length > 0) {
      await db
        .insert(dailyMetrics)
        .values({ date: todayStr, source: "npm", value: npmData[0].value })
        .onConflictDoUpdate({
          target: [dailyMetrics.date, dailyMetrics.source],
          set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
        });
    }

    // pypi: fetch all, filter to today
    const pypiData = await fetchPypiDownloads();
    const pypiToday = pypiData.find((d) => d.date === todayStr);
    if (pypiToday) {
      await db
        .insert(dailyMetrics)
        .values({ date: todayStr, source: "pypi", value: pypiToday.value })
        .onConflictDoUpdate({
          target: [dailyMetrics.date, dailyMetrics.source],
          set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
        });
    }

    // github: single day
    const githubToday = await fetchGithubCommits(todayStr);
    await db
      .insert(dailyMetrics)
      .values({
        date: todayStr,
        source: "github_commits",
        value: githubToday.value,
      })
      .onConflictDoUpdate({
        target: [dailyMetrics.date, dailyMetrics.source],
        set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
      });

    // Backfill yesterday if missing
    const yesterdayRows = await db
      .select()
      .from(dailyMetrics)
      .where(eq(dailyMetrics.date, yesterdayStr));

    if (yesterdayRows.length < 3) {
      const npmYesterday = await fetchNpmDownloads(yesterdayStr, yesterdayStr);
      if (npmYesterday.length > 0) {
        await db
          .insert(dailyMetrics)
          .values({
            date: yesterdayStr,
            source: "npm",
            value: npmYesterday[0].value,
          })
          .onConflictDoUpdate({
            target: [dailyMetrics.date, dailyMetrics.source],
            set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
          });
      }

      const pypiYesterday = pypiData.find((d) => d.date === yesterdayStr);
      if (pypiYesterday) {
        await db
          .insert(dailyMetrics)
          .values({
            date: yesterdayStr,
            source: "pypi",
            value: pypiYesterday.value,
          })
          .onConflictDoUpdate({
            target: [dailyMetrics.date, dailyMetrics.source],
            set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
          });
      }

      const githubYesterday = await fetchGithubCommits(yesterdayStr);
      await db
        .insert(dailyMetrics)
        .values({
          date: yesterdayStr,
          source: "github_commits",
          value: githubYesterday.value,
        })
        .onConflictDoUpdate({
          target: [dailyMetrics.date, dailyMetrics.source],
          set: { value: dsql`GREATEST(daily_metrics.value, EXCLUDED.value)` },
        });
    }
  } catch (err) {
    console.error("Error refreshing today's data:", err);
    // Continue to return historical data even if refresh fails
  }

  // Query last 30 days from database
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const cutoff = formatDate(thirtyDaysAgo);

  const allRows = await db
    .select()
    .from(dailyMetrics)
    .orderBy(desc(dailyMetrics.date));

  return {
    rows: allRows.filter((r) => r.date >= cutoff),
    now: today,
  };
}
