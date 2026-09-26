import "server-only"

import {
  getAdminOverview,
  listAdminSubscriptions,
  listAdminTeachers,
} from "@/features/admin/queries"
import type {
  AdminOverview,
  AdminSubscriptionPage,
  AdminTeacherPage,
} from "@/features/admin/schema"
import { logger } from "@/lib/logger"
import type { ApiError } from "@/lib/api/errors"
import {
  countTeachersWithoutLibrary,
  type AdminAttentionCounts,
} from "@/features/admin/attention"

/** The API caps page size at 100; with fewer teachers than that, one call sees them all. */
const TEACHER_SCAN_LIMIT = 100
const LATEST_LIMIT = 6

type AdminPageData =
  | {
      kind: "ready"
      overview: AdminOverview
      teachers: AdminTeacherPage
      subscriptions: AdminSubscriptionPage
      attention: AdminAttentionCounts
    }
  | {
      kind: "error"
      error: ApiError
    }

const adminPageRequests = [
  {
    request: "/api/v1/admin/overview",
    execute: () => getAdminOverview(),
  },
  {
    request: `/api/v1/admin/teachers?skip=0&limit=${TEACHER_SCAN_LIMIT}`,
    execute: () => listAdminTeachers({ limit: TEACHER_SCAN_LIMIT }),
  },
  {
    request: `/api/v1/admin/subscriptions?skip=0&limit=${LATEST_LIMIT}&payment_status=completed`,
    execute: () => listAdminSubscriptions({ limit: LATEST_LIMIT, paymentStatus: "completed" }),
  },
] as const

/**
 * Secondary counts for the attention panel. Each is the `total` of a filtered
 * list request; a failure hides that one row instead of failing the page.
 */
const attentionRequests = [
  {
    key: "inactiveTeachers",
    request: "/api/v1/admin/teachers?skip=0&limit=1&is_active=false",
    execute: () => listAdminTeachers({ limit: 1, isActive: false }),
  },
  {
    key: "pendingPayments",
    request: "/api/v1/admin/subscriptions?skip=0&limit=1&payment_status=pending",
    execute: () => listAdminSubscriptions({ limit: 1, paymentStatus: "pending" }),
  },
  {
    key: "failedPayments",
    request: "/api/v1/admin/subscriptions?skip=0&limit=1&payment_status=failed",
    execute: () => listAdminSubscriptions({ limit: 1, paymentStatus: "failed" }),
  },
  {
    key: "duplicatePayments",
    request: "/api/v1/admin/subscriptions?skip=0&limit=1&payment_status=duplicate_paid",
    execute: () => listAdminSubscriptions({ limit: 1, paymentStatus: "duplicate_paid" }),
  },
] as const

async function loadAttentionTotals() {
  const results = await Promise.allSettled(attentionRequests.map(({ execute }) => execute()))
  const totals: Partial<Record<(typeof attentionRequests)[number]["key"], number | null>> = {}
  results.forEach((result, index) => {
    const { key, request } = attentionRequests[index]
    if (result.status === "fulfilled") {
      totals[key] = result.value.total
      return
    }
    totals[key] = null
    logger.error("Admin attention count failed", serializeAdminPageError(request, result.reason))
  })
  return totals
}

export async function loadAdminPageData(): Promise<AdminPageData> {
  const [results, totals] = await Promise.all([
    Promise.allSettled(adminPageRequests.map(({ execute }) => execute())),
    loadAttentionTotals(),
  ])

  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            request: adminPageRequests[index].request,
            reason: result.reason,
          },
        ]
      : []
  )

  if (failures.length > 0) {
    for (const failure of failures) {
      logger.error(
        "Admin page data load failed",
        serializeAdminPageError(failure.request, failure.reason)
      )
    }

    return {
      kind: "error",
      error: toPageError(failures[0].reason),
    }
  }

  const [overview, teachers, subscriptions] = results.map(
    (result) => (result as PromiseFulfilledResult<unknown>).value
  ) as [AdminOverview, AdminTeacherPage, AdminSubscriptionPage]

  return {
    kind: "ready",
    overview,
    teachers,
    subscriptions,
    attention: {
      duplicatePayments: totals.duplicatePayments ?? null,
      failedPayments: totals.failedPayments ?? null,
      teachersWithoutLibrary: countTeachersWithoutLibrary(teachers),
      inactiveTeachers: totals.inactiveTeachers ?? null,
      pendingPayments: totals.pendingPayments ?? null,
    },
  }
}

function serializeAdminPageError(request: string, err: unknown) {
  const error = err as Error & {
    type?: ApiError["type"]
    status?: number
    requestId?: string
  }

  return {
    request,
    type: error.type ?? "Upstream",
    status: error.status ?? 0,
    message: error.message ?? "Error",
    requestId: error.requestId,
  }
}

function toPageError(err: unknown): ApiError {
  const error = err as Error & {
    type?: ApiError["type"]
    status?: number
  }

  switch (error.type) {
    case "Unauthorized":
      return { type: "Unauthorized", status: 401, message: error.message }
    case "Forbidden":
      return { type: "Forbidden", status: 403, message: error.message }
    case "NotFound":
      return { type: "NotFound", status: 404, message: error.message }
    case "Validation":
      return { type: "Validation", status: 422, message: error.message }
    case "RateLimited":
      return { type: "RateLimited", status: 429, message: error.message }
    case "Conflict":
      return { type: "Conflict", status: 409, message: error.message }
    default:
      return {
        type: "Upstream",
        status: error.status ?? 0,
        message: error.message ?? "Error",
      }
  }
}
