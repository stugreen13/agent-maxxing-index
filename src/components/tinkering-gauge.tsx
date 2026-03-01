"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getLevel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "MAXIMUM", color: "var(--chart-1)" };
  if (score >= 60) return { label: "HIGH", color: "var(--chart-2)" };
  if (score >= 40) return { label: "MODERATE", color: "var(--chart-3)" };
  if (score >= 20) return { label: "LOW", color: "var(--chart-4)" };
  return { label: "MINIMAL", color: "var(--chart-5)" };
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function TinkeringGauge({
  score,
  latestTotal,
  latestTotalLabel,
  trend,
}: {
  score: number;
  latestTotal: number;
  latestTotalLabel: string;
  trend: number;
}) {
  const level = useMemo(() => getLevel(score), [score]);

  const radius = 80;
  const strokeWidth = 12;
  const centerX = 100;
  const centerY = 90;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const fillAngle = startAngle + (score / 100) * totalAngle;

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number
  ) {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const bgArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
  const fillArc = describeArc(centerX, centerY, radius, startAngle, fillAngle);
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider">
            Maxxing Index
          </CardTitle>
          <Badge variant={trend >= 0 ? "outline" : "destructive"} className={`tabular-nums ${trend >= 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" : ""}`}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <svg
          viewBox="0 0 200 130"
          className="w-full max-w-[320px]"
          role="img"
          aria-label={`Maxxing Index: ${score}/100 — ${level.label}`}
        >
          <path
            d={bgArc}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={fillArc}
            fill="none"
            stroke={level.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {ticks.map((tick) => {
            const angle = startAngle + (tick / 100) * totalAngle;
            const inner = polarToCartesian(
              centerX,
              centerY,
              radius + strokeWidth / 2 + 2,
              angle
            );
            const outer = polarToCartesian(
              centerX,
              centerY,
              radius + strokeWidth / 2 + 8,
              angle
            );
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                opacity={0.5}
              />
            );
          })}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            className="fill-foreground text-3xl font-bold"
            style={{ fontSize: "36px", fontFamily: "var(--font-sans)" }}
          >
            {score}
          </text>
          <text
            x={centerX}
            y={centerY + 14}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "11px", fontFamily: "var(--font-sans)" }}
          >
            / 100
          </text>
        </svg>

        <div className="flex flex-col items-center gap-1 -mt-2">
          <span
            className="text-sm font-bold tracking-widest"
            style={{ color: level.color }}
          >
            {level.label}
          </span>
          <span className="text-foreground text-lg font-semibold tabular-nums mt-1">
            {formatCompact(latestTotal)}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              {latestTotalLabel}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
