// Shared class recipes for the builder + preview (theme tokens only).

/** Entrance animation; skipped when the user prefers reduced motion. */
export const ENTER = "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
export const ENTER_UP = `${ENTER} motion-safe:slide-in-from-bottom-2`
export const ENTER_SIDE = `${ENTER} motion-safe:slide-in-from-start-2`

export const CARD = "rounded-2xl border border-border bg-card text-card-foreground"

/** The design's "ink" treatment: 2px dark outline + offset shadow. */
export const INK = "border-2 border-foreground shadow-[3px_3px_0_var(--color-foreground)]"

export const PRIMARY_INK_BUTTON =
  "h-11 rounded-xl border-2 border-foreground bg-primary-deep px-5 text-sm font-semibold text-on-primary shadow-[3px_3px_0_var(--color-foreground)] hover:bg-primary-deep/90 disabled:shadow-none"

export const OUTLINE_BUTTON = "h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"

export const ICON_BUTTON = "size-11 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"

export const FIELD_LABEL = "text-xs font-semibold text-foreground/80"

export const CONTROL = "h-11 rounded-xl border-[1.5px] border-border-strong bg-card px-3 text-sm"

export const SUCCESS_TEXT = "text-emerald-700 dark:text-emerald-400"
export const WARNING_TEXT = "text-amber-800 dark:text-amber-300"
export const WARNING_BOX = "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
export const ERROR_TEXT = "text-red-700 dark:text-red-300"
export const ERROR_BOX = "bg-error-tint text-red-700 dark:text-red-300"
