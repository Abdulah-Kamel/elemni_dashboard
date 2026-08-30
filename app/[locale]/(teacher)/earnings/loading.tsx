export default function EarningsLoading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-5 p-1 sm:gap-6"
      aria-label="Loading earnings"
    >
      <div className="h-64 rounded-3xl bg-surface-strong" />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-28 bg-surface" key={index} />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-border bg-surface" />
      <div className="h-[34rem] rounded-2xl border border-border bg-surface" />
    </div>
  )
}
