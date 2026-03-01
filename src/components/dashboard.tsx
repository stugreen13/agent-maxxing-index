"use client";

import type { DashboardData } from "@/lib/dashboard-data";
import { TinkeringGauge } from "@/components/tinkering-gauge";
import { SourceCards } from "@/components/source-cards";
import { ActivityChart } from "@/components/activity-chart";
import { InsightsPanel } from "@/components/insights-panel";
import { DataSourceDialog } from "@/components/data-source-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Stock chart arrow */}
              <path d="M12 8V6L17 1" />
              <path d="M14 1H17V4" />
              {/* Robot head */}
              <rect width="16" height="12" x="4" y="8" rx="2" />
              {/* Ears */}
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              {/* Eyes */}
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
            AGENT MAXXING INDEX
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global developer activity across npm, PyPI, and public GitHub repos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceDialog
            sources={data.sources}
            lastUpdated={data.lastUpdated}
          />
          <ThemeToggle />
        </div>
      </header>

      <Separator />

      {/* Gauge + Source Cards */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <TinkeringGauge
          score={data.aggregate.tinkeringScore}
          prevScore={data.aggregate.prevTinkeringScore}
          trend={data.aggregate.trend}
        />
        <SourceCards sources={data.sources} />
      </div>

      {/* Main Chart */}
      <ActivityChart
        daily={data.daily}
        monthAvg={data.aggregate.monthAvg}
      />

      {/* Insights */}
      <InsightsPanel data={data} />

      {/* Footer */}
      <footer className="text-muted-foreground text-[11px] text-center pb-6">
        <p>
          Inspired by{" "}
          <a
            href="https://x.com/jeff_weinstein/status/2027837552800252338"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            @jeff_weinstein
          </a>
          . Made by{" "}
          <a
            href="https://x.com/stubgreen"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            @stubgreen
          </a>
          . Refreshes hourly.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 font-sans">
          <span className="text-muted-foreground text-[10px]">Sponsored by</span>
          <a
            href="https://instantcli.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <img
              src="/instantcli-icon.ico"
              alt="Instant CLI"
              width={16}
              height={16}
              className="rounded-sm"
            />
            <span className="text-foreground/70 text-[11px] font-semibold tracking-tight">
              InstantCLI
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
