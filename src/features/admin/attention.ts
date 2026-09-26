// "Needs attention" rows for the admin overview. Every count comes straight
// from an API field or an API `total`; this module only decides which rows
// to show, in what order, and where each one links. A count that could not
// be loaded (null) is never guessed — the row is simply omitted.
import type { AdminTeacherPage } from "./schema"
import {
  listHref,
  serializeSubscriptionFilters,
  serializeTeacherFilters,
  parseSubscriptionFilters,
  parseTeacherFilters,
  type PaymentStatusFilter,
} from "./url-state"

export type AdminAttentionCounts = {
  /** `total` of GET /admin/subscriptions?payment_status=duplicate_paid */
  duplicatePayments: number | null
  /** `total` of GET /admin/subscriptions?payment_status=failed */
  failedPayments: number | null
  /** `has_library === false` across the full teacher list (null if the list was truncated). */
  teachersWithoutLibrary: number | null
  /** `total` of GET /admin/teachers?is_active=false */
  inactiveTeachers: number | null
  /** `total` of GET /admin/subscriptions?payment_status=pending */
  pendingPayments: number | null
}

export type AttentionKind = keyof AdminAttentionCounts

export type AttentionDescriptor = {
  id: AttentionKind
  count: number
  href: string
  tone: "warning" | "primary" | "destructive"
}

const NO_PARAMS = { get: () => null }

function subscriptionsHref(status: PaymentStatusFilter) {
  return listHref("/admin/subscriptions", serializeSubscriptionFilters({ ...parseSubscriptionFilters(NO_PARAMS), status }))
}

function teachersHref(patch: Partial<ReturnType<typeof parseTeacherFilters>>) {
  return listHref("/admin/teachers", serializeTeacherFilters({ ...parseTeacherFilters(NO_PARAMS), ...patch }))
}

/** Ordered most-urgent first: money problems, then setup gaps, then follow-ups. */
const RULES: { id: AttentionKind; tone: AttentionDescriptor["tone"]; href: string }[] = [
  { id: "duplicatePayments", tone: "destructive", href: subscriptionsHref("duplicate_paid") },
  { id: "failedPayments", tone: "destructive", href: subscriptionsHref("failed") },
  { id: "teachersWithoutLibrary", tone: "warning", href: teachersHref({ library: "missing" }) },
  { id: "inactiveTeachers", tone: "warning", href: teachersHref({ status: "inactive" }) },
  { id: "pendingPayments", tone: "primary", href: subscriptionsHref("pending") },
]

export function deriveAdminAttention(counts: AdminAttentionCounts): AttentionDescriptor[] {
  return RULES.flatMap(({ id, tone, href }) => {
    const count = counts[id]
    return count !== null && count > 0 ? [{ id, count, href, tone }] : []
  })
}

/**
 * Teachers whose video library has not been created. Only meaningful when the
 * page holds every teacher; otherwise the count would be a silent undercount.
 */
export function countTeachersWithoutLibrary(page: AdminTeacherPage | null): number | null {
  if (!page || page.items.length < page.total) return null
  return page.items.filter((teacher) => !teacher.has_library).length
}
