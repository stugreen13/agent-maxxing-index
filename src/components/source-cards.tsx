"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SourceStats } from "@/lib/dashboard-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart } from "recharts";

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

const SOURCE_COLORS: Record<string, string> = {
  npm: "var(--chart-1)",
  pypi: "var(--chart-3)",
  github_commits: "var(--chart-5)",
};

function SourceCard({ source }: { source: SourceStats }) {
  const color = SOURCE_COLORS[source.key] ?? "var(--chart-1)";
  const tooltipLabel =
    source.key === "github_commits" ? "Commits" : "Downloads";
  const chartConfig: ChartConfig = {
    value: {
      label: tooltipLabel,
      color,
    },
  };

  const sparklineData = source.sparkline.map((v, i) => ({
    idx: i,
    value: v,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-sm cursor-help">
                    {source.label}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>{source.note}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CardDescription>{source.subtitle}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={source.trend >= 0 ? "outline" : "destructive"}
                  className={`shrink-0 tabular-nums ${source.trend >= 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" : ""}`}
                >
                  {source.trend >= 0 ? "+" : ""}
                  {source.trend.toFixed(1)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>vs. prior day</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {formatCompact(source.latest)}
          </span>
          <span className="text-muted-foreground text-xs">
            {source.latestLabel}
          </span>
        </div>

        {/* Sparkline */}
        <ChartContainer
          config={chartConfig}
          className="!aspect-auto h-[48px] w-full"
        >
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient
                id={`fill-${source.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-value)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              fill={`url(#fill-${source.key})`}
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="text-muted-foreground">7d avg</div>
          <div className="text-right tabular-nums font-medium">
            {formatCompact(source.weekAvg)}
          </div>
          <div className="text-muted-foreground">30d avg</div>
          <div className="text-right tabular-nums font-medium">
            {formatCompact(source.monthAvg)}
          </div>
          <div className="text-muted-foreground">30d high</div>
          <div className="text-right tabular-nums font-medium">
            {formatCompact(source.max.value)}
          </div>
          <div className="text-muted-foreground">30d low</div>
          <div className="text-right tabular-nums font-medium">
            {formatCompact(source.min.value)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceCards({ sources }: { sources: SourceStats[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sources.map((source) => (
        <SourceCard key={source.key} source={source} />
      ))}
    </div>
  );
}
