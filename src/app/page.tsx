import { Suspense } from "react";
import { getDashboardData } from "@/lib/queries";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">Agent Maxxing Index</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading stats…</p>}>
        <Stats />
      </Suspense>
    </div>
  );
}

async function Stats() {
  const rows = await getDashboardData();

  const totals = rows.reduce(
    (acc, row) => {
      acc[row.source] = (acc[row.source] ?? 0) + row.value;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex gap-8">
      {Object.entries(totals).map(([source, total]) => (
        <div key={source} className="text-center">
          <p className="text-muted-foreground text-sm">{source}</p>
          <p className="text-3xl font-semibold tabular-nums">
            {total.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
