import { Skeleton } from "@/components/ui/skeleton"

export default function EarningsLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-28 rounded-xl" key={index} />
        ))}
      </div>
      <div className="h-[28rem] rounded-xl border border-border bg-surface" />
    </div>
  )
}
