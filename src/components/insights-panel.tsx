"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DashboardData } from "@/lib/dashboard-data";
import { format } from "date-fns";

function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatUTC(date: Date, fmt: string): string {
  const offset = date.getTimezoneOffset();
  const shifted = new Date(date.getTime() + offset * 60_000);
  return format(shifted, fmt);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function InsightsPanel({ data }: { data: DashboardData }) {
  const { aggregate, daily } = data;

  const thisWeek = daily.slice(-7).reduce((sum, d) => sum + d.total, 0);
  const lastWeek = daily.slice(-14, -7).reduce((sum, d) => sum + d.total, 0);
  const wowChange =
    lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

  let biggestDrop = { date: "", percent: 0 };
  let biggestSurge = { date: "", percent: 0 };
  for (let i = 1; i < daily.length; i++) {
    if (daily[i - 1].total > 0) {
      const drop =
        ((daily[i - 1].total - daily[i].total) / daily[i - 1].total) * 100;
      if (drop > biggestDrop.percent)
        biggestDrop = { date: daily[i].date, percent: drop };
      const surge =
        ((daily[i].total - daily[i - 1].total) / daily[i - 1].total) * 100;
      if (surge > biggestSurge.percent)
        biggestSurge = { date: daily[i].date, percent: surge };
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Weekend vs Weekday */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider">
            Weekend vs Weekday
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Average daily activity per source, last 30 days
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const sources = [
              { key: "github" as const, label: "GitHub commits", color: "var(--chart-1)" },
              { key: "npm" as const, label: "npm downloads", color: "var(--chart-3)" },
              { key: "pypi" as const, label: "PyPI downloads", color: "var(--chart-5)" },
            ];

            return sources.map((source) => {
              const weekdayVals = daily.filter((d) => !d.isWeekend && d[source.key] > 0).map((d) => d[source.key]);
              const weekendVals = daily.filter((d) => d.isWeekend && d[source.key] > 0).map((d) => d[source.key]);
              const wdAvg = weekdayVals.length ? Math.round(weekdayVals.reduce((a, b) => a + b, 0) / weekdayVals.length) : 0;
              const weAvg = weekendVals.length ? Math.round(weekendVals.reduce((a, b) => a + b, 0) / weekendVals.length) : 0;
              const change = wdAvg > 0 ? Math.round(((weAvg - wdAvg) / wdAvg) * 100) : 0;

              return (
                <div key={source.key}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="size-2 rounded-[2px]" style={{ backgroundColor: source.color }} />
                    <span className="text-xs font-medium">{source.label}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Mon&ndash;Fri:</span>
                      <span className="tabular-nums font-medium">{formatCompact(wdAvg)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Sat&ndash;Sun:</span>
                      <span className="tabular-nums font-medium">{formatCompact(weAvg)}</span>
                      <Badge
                        variant={change >= 0 ? "outline" : "destructive"}
                        className={`tabular-nums text-[10px] ${change >= 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" : ""}`}
                      >
                        {change >= 0 ? "+" : ""}{change}%
                      </Badge>
                    </div>
                  </div>
                  {source.key !== "pypi" && <Separator className="mt-3" />}
                </div>
              );
            });
          })()}
        </CardContent>
      </Card>

      {/* Trends & Spikes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider">
            Trends
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Total activity across all sources
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Week/week</span>
            <Badge
              variant={wowChange >= 0 ? "outline" : "destructive"}
              className={`tabular-nums ${wowChange >= 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" : ""}`}
            >
              {wowChange >= 0 ? "+" : ""}
              {wowChange.toFixed(1)}%
            </Badge>
          </div>

          {aggregate.maxDay.date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">30d peak</span>
              <span className="text-xs tabular-nums">
                {formatUTC(parseUTCDate(aggregate.maxDay.date), "EEE (MMM d)")} &mdash;{" "}
                {formatCompact(aggregate.maxDay.value)}
              </span>
            </div>
          )}

          {biggestSurge.date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Top surge</span>
              <span className="text-xs tabular-nums">
                {formatUTC(parseUTCDate(biggestSurge.date), "EEE (MMM d)")} +
                {biggestSurge.percent.toFixed(0)}%
              </span>
            </div>
          )}

          {biggestDrop.date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Top drop</span>
              <span className="text-xs tabular-nums">
                {formatUTC(parseUTCDate(biggestDrop.date), "EEE (MMM d)")} -
                {biggestDrop.percent.toFixed(0)}%
              </span>
            </div>
          )}

          {aggregate.spikes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <span className="text-muted-foreground text-xs">
                  Spikes (&gt;20% above avg)
                </span>
                {aggregate.spikes.slice(0, 3).map((spike) => (
                  <div
                    key={spike.date}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="tabular-nums">
                      {formatUTC(parseUTCDate(spike.date), "EEE (MMM d)")}
                    </span>
                    <Badge
                      variant="outline"
                      className="tabular-nums text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20"
                    >
                      +{spike.percentAboveAvg.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
