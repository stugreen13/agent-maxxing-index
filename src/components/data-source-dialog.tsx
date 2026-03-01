"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { SourceStats } from "@/lib/dashboard-data";
import { format } from "date-fns";

export function DataSourceDialog({
  sources,
  lastUpdated,
}: {
  sources: SourceStats[];
  lastUpdated: string;
}) {
  const updatedDate = new Date(lastUpdated);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-chart-1 animate-pulse" />
          Data Sources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Data Sources</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last fetch</span>
            <span className="tabular-nums font-medium">
              {format(updatedDate, "MMM d, h:mm a")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Refresh</span>
            <span className="font-medium">Hourly</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {sources.map((source) => (
            <div key={source.key} className="space-y-1">
              <span className="text-sm font-semibold">{source.label}</span>
              <p className="text-muted-foreground text-xs">{source.note}</p>
              <div className="bg-muted/50 px-2.5 py-1.5 text-[11px] font-mono break-all">
                {source.apiUrl}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <p className="text-muted-foreground text-[11px]">
          Server-side fetched, cached hourly. No client-side API calls.
        </p>
      </DialogContent>
    </Dialog>
  );
}
