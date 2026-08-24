import { setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { StorageDashboard } from "@/features/storage/components/storage-dashboard"
import { getUsageDashboard } from "@/features/storage/queries"
import type { ApiError } from "@/lib/api/errors"
import type { UsageDashboardData } from "@/features/storage/types"

export const dynamic = "force-dynamic"

type StoragePageResult =
  | { kind: "ready"; data: UsageDashboardData }
  | { kind: "error"; error: ApiError }

async function loadUsageData(
  teacherProfileId: number
): Promise<StoragePageResult> {
  try {
    const data = await getUsageDashboard(teacherProfileId)
    return { kind: "ready", data }
  } catch (err) {
    return {
      kind: "error",
      error: toPageError(err),
    }
  }
}

export default async function StoragePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await verifySession()

  if (!user) {
    return (
      <Placeholder
        state="error"
        error={
          {
            type: "Unauthorized",
            status: 401,
            message: "No session",
          } satisfies ApiError
        }
      />
    )
  }

  const result = await loadUsageData(user.id)

  if (result.kind === "error") {
    return <Placeholder state="error" error={result.error} />
  }

  return <StorageDashboard data={result.data} />
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
