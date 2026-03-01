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
  ChartLegend,
  ChartLegendContent,
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
    color: "var(--chart-1)",
  },
  pypi: {
    label: "PyPI downloads",
    color: "var(--chart-3)",
  },
  github: {
    label: "GitHub commits",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type TimeRange = "7d" | "14d" | "30d";

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload: DailyDataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const total = point.npm + point.pypi + point.github;

  return (
    <div className="border-border/50 bg-background min-w-40 rounded-none border px-2.5 py-2 text-xs shadow-xl">
      <div className="font-medium mb-1.5">
        {point.dayOfWeek}, {point.label}
        {point.isWeekend && (
          <span className="text-muted-foreground ml-1">(weekend)</span>
        )}
      </div>
      <div className="space-y-1">
        {[
          { key: "npm", label: "npm downloads", value: point.npm, color: "var(--chart-1)" },
          { key: "pypi", label: "PyPI downloads", value: point.pypi, color: "var(--chart-3)" },
          { key: "github", label: "GitHub commits", value: point.github, color: "var(--chart-5)" },
        ].map((item) => (
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
      <div className="border-t border-border/50 mt-1.5 pt-1.5 flex justify-between font-medium">
        <span>Total</span>
        <span className="tabular-nums">{formatCompact(total)}</span>
      </div>
    </div>
  );
}

export function ActivityChart({
  daily,
  monthAvg,
}: {
  daily: DailyDataPoint[];
  monthAvg: number;
}) {
  const [range, setRange] = useState<TimeRange>("14d");

  const filteredData = useMemo(() => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return daily.slice(-days);
  }, [daily, range]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Total Daily Activity</CardTitle>
          <CardDescription>Weekends shaded</CardDescription>
        </div>
        <CardAction>
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
        </CardAction>
      </CardHeader>
      <CardContent>
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
              content={<CustomTooltip />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Weekend background bands */}
            {filteredData.map(
              (point) =>
                point.isWeekend && (
                  <ReferenceLine
                    key={point.date}
                    x={point.label}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.08}
                    strokeWidth={
                      range === "30d" ? 14 : range === "14d" ? 28 : 48
                    }
                  />
                )
            )}
            {/* Average line */}
            <ReferenceLine
              y={monthAvg}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `avg: ${formatCompact(monthAvg)}`,
                position: "insideTopRight",
                style: {
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
            <Bar dataKey="npm" stackId="a" fill="var(--color-npm)" radius={[0, 0, 0, 0]}>
              {filteredData.map((point) => (
                <Cell
                  key={point.date}
                  fillOpacity={point.isWeekend ? 1 : 0.55}
                />
              ))}
            </Bar>
            <Bar dataKey="pypi" stackId="a" fill="var(--color-pypi)" radius={[0, 0, 0, 0]}>
              {filteredData.map((point) => (
                <Cell
                  key={point.date}
                  fillOpacity={point.isWeekend ? 1 : 0.55}
                />
              ))}
            </Bar>
            <Bar dataKey="github" stackId="a" fill="var(--color-github)" radius={[2, 2, 0, 0]}>
              {filteredData.map((point) => (
                <Cell
                  key={point.date}
                  fillOpacity={point.isWeekend ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
