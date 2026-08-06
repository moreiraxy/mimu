import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>

      <Skeleton className="h-32 w-full rounded-card" />

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-neutro-border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-button" />
        <Skeleton className="h-12 rounded-button" />
      </div>
    </div>
  );
}
