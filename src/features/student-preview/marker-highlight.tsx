import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Local copy of the student site's marker, kept inside the preview scope. */
export function MarkerHighlight({
  children,
  color = "yellow",
}: {
  children: ReactNode
  color?: "yellow" | "sky" | "pink"
}) {
  return (
    <span className="relative z-0 inline-block px-1.5">
      <span
        aria-hidden="true"
        className={cn(
          "preview-marker pointer-events-none absolute start-0 end-0 bottom-1 -z-10 h-[52%] scale-x-105 -rotate-1 skew-x-2",
          `preview-marker-${color}`
        )}
        style={{ borderRadius: "30% 70% 20% 80% / 70% 30% 80% 20%" }}
      />
      {children}
    </span>
  )
}
