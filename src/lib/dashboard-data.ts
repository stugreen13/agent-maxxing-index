import { format, isWeekend as isWeekendFn } from "date-fns";

/** Parse a YYYY-MM-DD string as a UTC Date (avoids local-timezone shift). */
function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a UTC Date using date-fns (temporarily shift so format() reads UTC fields). */
function formatUTC(date: Date, fmt: string): string {
  // date-fns format() reads local fields, so offset to make local === UTC
  const offset = date.getTimezoneOffset();
  const shifted = new Date(date.getTime() + offset * 60_000);
  return format(shifted, fmt);
}

/** Check if a UTC Date falls on Saturday or Sunday. */
function isWeekendUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export type DailyDataPoint = {
  date: string;
  label: string;
  dayOfWeek: string;
  isWeekend: boolean;
  npm: number;
  pypi: number;
  github: number;
  total: number;
};

export type SourceStats = {
  key: string;
  label: string;
  latest: number;
  latestLabel: string;
  yesterday: number;
  weekAvg: number;
  monthAvg: number;
  trend: number;
  sparkline: number[];
  max: { date: string; value: number };
  min: { date: string; value: number };
  subtitle: string;
  apiUrl: string;
  note: string;
};

export type DashboardData = {
  daily: DailyDataPoint[];
  sources: SourceStats[];
  aggregate: {
    latestTotal: number;
    latestTotalLabel: string;
    prevTotal: number;
    weekAvg: number;
    monthAvg: number;
    weekendAvgDrop: number;
    weekdayAvg: number;
    weekendAvg: number;
    tinkeringScore: number;
    maxDay: { date: string; value: number };
    minDay: { date: string; value: number };
    trend: number;
    spikes: { date: string; value: number; percentAboveAvg: number }[];
  };
  lastUpdated: string;
};

type RawRow = {
  id: number;
  date: string;
  source: string;
  value: number;
  createdAt: Date | null;
};

const SOURCE_META: Record<
  string,
  { label: string; subtitle: string; apiUrl: string; note: string }
> = {
  npm: {
    label: "npm downloads",
    subtitle: "All packages, daily total",
    apiUrl: "https://api.npmjs.org/downloads/range/{start}:{end}",
    note: "~1 day finalization delay",
  },
  pypi: {
    label: "PyPI downloads",
    subtitle: "All packages, daily total",
    apiUrl: "https://pypistats.org/api/packages/__all__/overall",
    note: "Mirrors not included",
  },
  github_commits: {
    label: "GitHub commits",
    subtitle: "Public repos",
    apiUrl: "https://api.github.com/search/commits",
    note: "Public repos only, ~1 day finalization delay",
  },
};

export function transformDashboardData(rows: RawRow[], now: Date): DashboardData {
  // Use UTC to match DB date strings (which are UTC-based)
  const todayIso = now.toISOString().split("T")[0];
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayIso = yesterdayDate.toISOString().split("T")[0];

  // Group by date
  const byDate = new Map<string, Record<string, number>>();
  let latestCreatedAt: Date | null = null;

  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, {});
    }
    byDate.get(row.date)![row.source] = row.value;
    if (
      row.createdAt &&
      (!latestCreatedAt || row.createdAt > latestCreatedAt)
    ) {
      latestCreatedAt = row.createdAt;
    }
  }

  // Sort dates ascending, exclude today (always incomplete — APIs finalize next day)
  const sortedDates = Array.from(byDate.keys())
    .filter((d) => d < todayIso)
    .sort();

  // Build daily data points
  const daily: DailyDataPoint[] = sortedDates.map((dateStr) => {
    const values = byDate.get(dateStr)!;
    const d = parseUTCDate(dateStr);
    const npm = values.npm ?? 0;
    const pypi = values.pypi ?? 0;
    const github = values.github_commits ?? 0;
    return {
      date: dateStr,
      label: formatUTC(d, "MMM d"),
      dayOfWeek: formatUTC(d, "EEE"),
      isWeekend: isWeekendUTC(d),
      npm,
      pypi,
      github,
      total: npm + pypi + github,
    };
  });

  // Build source stats (from daily data only)
  const sourceKeys = ["github_commits", "npm", "pypi"] as const;
  const sources: SourceStats[] = sourceKeys.map((key) => {
    const values = daily.map((d) =>
      key === "npm" ? d.npm : key === "pypi" ? d.pypi : d.github
    );
    // Find latest non-zero value (npm can be 0 for multiple recent days)
    let latestIdx = values.length - 1;
    while (latestIdx >= 0 && values[latestIdx] === 0) latestIdx--;
    const latest = latestIdx >= 0 ? values[latestIdx] : 0;
    const latestDateStr = latestIdx >= 0 ? daily[latestIdx].date.split("T")[0] : "";
    const latestLabel = (() => {
      if (latestDateStr === todayIso) return "today";
      if (latestDateStr === yesterdayIso) return "yesterday";
      if (!latestDateStr) return "";
      // Compute days ago in UTC
      const diffMs = Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
      ) - parseUTCDate(latestDateStr).getTime();
      const daysAgo = Math.round(diffMs / 86_400_000);
      return `${daysAgo}d ago`;
    })();

    // Find previous non-zero for trend comparison
    let prevIdx = latestIdx - 1;
    while (prevIdx >= 0 && values[prevIdx] === 0) prevIdx--;
    const prevForTrend = prevIdx >= 0 ? values[prevIdx] : 0;

    const nonZero = values.filter((v) => v > 0);
    const last7 = nonZero.slice(-7);
    const weekAvg = last7.length
      ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length)
      : 0;
    const monthAvg = nonZero.length
      ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length)
      : 0;
    const trend = prevForTrend > 0 ? ((latest - prevForTrend) / prevForTrend) * 100 : 0;

    let maxVal = 0;
    let maxDate = "";
    let minVal = Infinity;
    let minDate = "";
    daily.forEach((d) => {
      const v = key === "npm" ? d.npm : key === "pypi" ? d.pypi : d.github;
      if (v > maxVal) {
        maxVal = v;
        maxDate = d.date;
      }
      if (v < minVal && v > 0) {
        minVal = v;
        minDate = d.date;
      }
    });

    const meta = SOURCE_META[key];
    return {
      key,
      label: meta.label,
      latest,
      latestLabel,
      yesterday: prevForTrend,
      weekAvg,
      monthAvg,
      trend,
      sparkline: values.filter((v) => v > 0).slice(-14),
      max: { date: maxDate, value: maxVal },
      min: { date: minDate, value: minVal === Infinity ? 0 : minVal },
      subtitle: meta.subtitle,
      apiUrl: meta.apiUrl,
      note: meta.note,
    };
  });

  // Aggregate stats — use daily data only for headline numbers
  const totals = daily.map((d) => d.total);
  // Find latest day where at least 2 sources have data (not just github alone)
  let aggIdx = daily.length - 1;
  while (aggIdx >= 0) {
    const d = daily[aggIdx];
    const nonZeroSources = [d.npm, d.pypi, d.github].filter((v) => v > 0).length;
    if (nonZeroSources >= 2) break;
    aggIdx--;
  }
  const latestTotal = aggIdx >= 0 ? totals[aggIdx] : 0;
  const aggDateStr = aggIdx >= 0 ? daily[aggIdx].date.split("T")[0] : "";
  const latestTotalLabel = (() => {
    if (aggDateStr === todayIso) return "today";
    if (aggDateStr === yesterdayIso) return "yesterday";
    if (!aggDateStr) return "N/A";
    const diffMs = Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
    ) - parseUTCDate(aggDateStr).getTime();
    const daysAgo = Math.round(diffMs / 86_400_000);
    return `${daysAgo}d ago`;
  })();
  // Find previous comparable day for trend
  let prevAggIdx = aggIdx - 1;
  while (prevAggIdx >= 0) {
    const d = daily[prevAggIdx];
    const nonZeroSources = [d.npm, d.pypi, d.github].filter((v) => v > 0).length;
    if (nonZeroSources >= 2) break;
    prevAggIdx--;
  }
  const prevTotal = prevAggIdx >= 0 ? totals[prevAggIdx] : 0;

  const nonZeroTotals = totals.filter((t) => t > 0);
  const last7 = nonZeroTotals.slice(-7);
  const weekAvg = last7.length
    ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length)
    : 0;
  const monthAvg = nonZeroTotals.length
    ? Math.round(nonZeroTotals.reduce((a, b) => a + b, 0) / nonZeroTotals.length)
    : 0;

  const weekdays = daily.filter((d) => !d.isWeekend && d.total > 0);
  const weekends = daily.filter((d) => d.isWeekend && d.total > 0);
  const weekdayAvg = weekdays.length
    ? Math.round(weekdays.reduce((a, b) => a + b.total, 0) / weekdays.length)
    : 0;
  const weekendAvg = weekends.length
    ? Math.round(weekends.reduce((a, b) => a + b.total, 0) / weekends.length)
    : 0;
  const weekendAvgDrop =
    weekdayAvg > 0
      ? Math.round(((weekdayAvg - weekendAvg) / weekdayAvg) * 100)
      : 0;

  // Tinkering score: latest total relative to 30d min-max range
  const minTotal = nonZeroTotals.length ? Math.min(...nonZeroTotals) : 0;
  const maxTotal = nonZeroTotals.length ? Math.max(...nonZeroTotals) : 0;
  const range = maxTotal - minTotal;
  const tinkeringScore =
    range > 0 ? Math.round(((latestTotal - minTotal) / range) * 100) : 50;

  let maxDay = { date: "", value: 0 };
  let minDay = { date: "", value: Infinity };
  daily.forEach((d) => {
    if (d.total > maxDay.value) maxDay = { date: d.date, value: d.total };
    if (d.total < minDay.value && d.total > 0)
      minDay = { date: d.date, value: d.total };
  });
  if (minDay.value === Infinity) minDay = { date: "", value: 0 };

  const trend =
    prevTotal > 0
      ? ((latestTotal - prevTotal) / prevTotal) * 100
      : 0;

  // Find spikes (days >20% above monthly average)
  const spikes = daily
    .filter((d) => d.total > 0 && monthAvg > 0)
    .map((d) => ({
      date: d.date,
      value: d.total,
      percentAboveAvg: ((d.total - monthAvg) / monthAvg) * 100,
    }))
    .filter((s) => s.percentAboveAvg > 20)
    .sort((a, b) => b.percentAboveAvg - a.percentAboveAvg)
    .slice(0, 5);

  return {
    daily,
    sources,
    aggregate: {
      latestTotal,
      latestTotalLabel,
      prevTotal,
      weekAvg,
      monthAvg,
      weekendAvgDrop,
      weekdayAvg,
      weekendAvg,
      tinkeringScore: Math.max(0, Math.min(100, tinkeringScore)),
      maxDay,
      minDay,
      trend,
      spikes,
    },
    lastUpdated: latestCreatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
