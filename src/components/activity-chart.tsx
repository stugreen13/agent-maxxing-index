"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts";
import type { DailyDataPoint } from "@/lib/dashboard-data";

const chartConfig = {
  npm: {
    label: "npm downloads",
    color: "var(--chart-3)",
  },
  pypi: {
    label: "PyPI downloads",
    color: "var(--chart-5)",
  },
  github: {
    label: "GitHub commits",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type TimeRange = "7d" | "14d" | "30d";
type SourceFilter = "all" | "npm" | "pypi" | "github";

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function CustomTooltip({
  active,
  payload,
  sourceFilter,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload: DailyDataPoint }>;
  label?: string;
  sourceFilter: SourceFilter;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  const items = [
    { key: "npm", label: "npm downloads", value: point.npm, color: "var(--chart-3)" },
    { key: "pypi", label: "PyPI downloads", value: point.pypi, color: "var(--chart-5)" },
    { key: "github", label: "GitHub commits", value: point.github, color: "var(--chart-1)" },
  ].filter((item) => sourceFilter === "all" || item.key === sourceFilter);

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="border-border/50 bg-background min-w-40 rounded-none border px-2.5 py-2 text-xs shadow-xl">
      <div className="font-medium mb-1.5">
        {point.dayOfWeek}, {point.label}
        {point.isWeekend && (
          <span className="text-muted-foreground ml-1">(weekend)</span>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-medium tabular-nums">
              {formatCompact(item.value)}
            </span>
          </div>
        ))}
      </div>
      {sourceFilter === "all" && (
        <div className="border-t border-border/50 mt-1.5 pt-1.5 flex justify-between font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatCompact(total)}</span>
        </div>
      )}
    </div>
  );
}

const sourceButtons: { key: SourceFilter; label: string; dataKeys: ("npm" | "pypi" | "github")[] }[] = [
  { key: "github", label: "GitHub", dataKeys: ["github"] },
  { key: "npm", label: "npm", dataKeys: ["npm"] },
  { key: "pypi", label: "PyPI", dataKeys: ["pypi"] },
  { key: "all", label: "All", dataKeys: ["npm", "pypi", "github"] },
];

export function ActivityChart({
  daily,
  monthAvg,
}: {
  daily: DailyDataPoint[];
  monthAvg: number;
}) {
  const [range, setRange] = useState<TimeRange>("30d");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("github");

  const filteredData = useMemo(() => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return daily.slice(-days);
  }, [daily, range]);

  const totals = useMemo(() => {
    return {
      all: filteredData.reduce((sum, d) => sum + d.npm + d.pypi + d.github, 0),
      npm: filteredData.reduce((sum, d) => sum + d.npm, 0),
      pypi: filteredData.reduce((sum, d) => sum + d.pypi, 0),
      github: filteredData.reduce((sum, d) => sum + d.github, 0),
    };
  }, [filteredData]);

  const activeAvg = useMemo(() => {
    if (sourceFilter === "all") return monthAvg;
    const vals = filteredData.map((d) =>
      sourceFilter === "npm" ? d.npm : sourceFilter === "pypi" ? d.pypi : d.github
    ).filter((v) => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [filteredData, sourceFilter, monthAvg]);

  const activeKeys = sourceButtons.find((s) => s.key === sourceFilter)!.dataKeys;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-4">
          <CardTitle>Total Daily Activity</CardTitle>
          <CardDescription>Weekends highlighted</CardDescription>
        </div>
        <div className="flex">
          {sourceButtons.map((source) => (
            <button
              key={source.key}
              data-active={sourceFilter === source.key}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
              onClick={() => setSourceFilter(source.key)}
            >
              <span className="text-muted-foreground text-xs">
                {source.label}
              </span>
              <span className="text-base leading-none font-bold sm:text-xl tabular-nums">
                {formatCompact(totals[source.key])}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={filteredData}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={range === "30d" ? 2 : 0}
              angle={range === "30d" ? -45 : 0}
              textAnchor={range === "30d" ? "end" : "middle"}
              height={range === "30d" ? 60 : 30}
              fontSize={11}
              tick={({ x, y, payload, index }: { x: number; y: number; payload: { value: string }; index: number }) => {
                const point = filteredData[index];
                const isWknd = point?.isWeekend;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={range === "30d" ? "end" : "middle"}
                    fontSize={11}
                    fill={isWknd ? "var(--chart-3)" : "var(--muted-foreground)"}
                    fontWeight={isWknd ? 600 : 400}
                    transform={range === "30d" ? `rotate(-45, ${x}, ${y})` : undefined}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompact}
              width={50}
              fontSize={11}
            />
            <ChartTooltip
              content={<CustomTooltip sourceFilter={sourceFilter} />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            {/* Average line */}
            <ReferenceLine
              y={activeAvg}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `avg: ${formatCompact(activeAvg)}`,
                position: "insideTopRight",
                style: {
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
            {activeKeys.includes("npm") && (
              <Bar
                dataKey="npm"
                stackId={sourceFilter === "all" ? "a" : undefined}
                fill="var(--color-npm)"
                radius={sourceFilter === "npm" ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              >
                {filteredData.map((point) => (
                  <Cell
                    key={point.date}
                    fillOpacity={point.isWeekend ? 0.85 : 0.35}
                  />
                ))}
              </Bar>
            )}
            {activeKeys.includes("pypi") && (
              <Bar
                dataKey="pypi"
                stackId={sourceFilter === "all" ? "a" : undefined}
                fill="var(--color-pypi)"
                radius={sourceFilter === "pypi" ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              >
                {filteredData.map((point) => (
                  <Cell
                    key={point.date}
                    fillOpacity={point.isWeekend ? 0.85 : 0.35}
                  />
                ))}
              </Bar>
            )}
            {activeKeys.includes("github") && (
              <Bar
                dataKey="github"
                stackId={sourceFilter === "all" ? "a" : undefined}
                fill="var(--color-github)"
                radius={[2, 2, 0, 0]}
              >
                {filteredData.map((point) => (
                  <Cell
                    key={point.date}
                    fillOpacity={point.isWeekend ? 0.85 : 0.35}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <div className="flex justify-center border-t px-6 py-3">
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as TimeRange)}
        >
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="14d">14D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
}
