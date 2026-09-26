import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the overview layout so the page doesn't jump when data lands. */
export function OverviewSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label={label}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-full sm:w-[26rem]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={`h-[6.5rem] rounded-xl ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`} />
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}
