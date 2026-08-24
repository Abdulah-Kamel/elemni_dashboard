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

type AdminPageData =
  | {
      kind: "ready"
      overview: AdminOverview
      teachers: AdminTeacherPage
      subscriptions: AdminSubscriptionPage
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
    request: "/api/v1/admin/teachers?skip=0&limit=5",
    execute: () => listAdminTeachers({ limit: 5 }),
  },
  {
    request: "/api/v1/admin/subscriptions?skip=0&limit=5&payment_status=completed",
    execute: () => listAdminSubscriptions({ limit: 5, paymentStatus: "completed" }),
  },
] as const

export async function loadAdminPageData(): Promise<AdminPageData> {
  const results = await Promise.allSettled(
    adminPageRequests.map(({ execute }) => execute())
  )

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
