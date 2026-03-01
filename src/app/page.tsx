import { Suspense } from "react";
import { getDashboardData } from "@/lib/queries";
import { transformDashboardData } from "@/lib/dashboard-data";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardLoader />
      </Suspense>
    </main>
  );
}

async function DashboardLoader() {
  const { rows, now } = await getDashboardData();
  const data = transformDashboardData(rows, now);
  return <Dashboard data={data} />;
}

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="h-[320px]" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
        </div>
      </div>
      <Skeleton className="h-[430px]" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
      </div>
    </div>
  );
}
