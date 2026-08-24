import { getTranslations, setRequestLocale } from "next-intl/server"
import { Placeholder } from "@/features/shell/components/placeholder"
import { verifySession } from "@/lib/auth/dal"
import { StudentRoster } from "@/features/students/components/student-roster"
import { listTeacherSubscriptions } from "@/features/students/queries"
import { listCourses } from "@/features/course-management/queries"
import type { ApiError } from "@/lib/api/errors"
import type { CourseOut } from "@/features/shell/schema"
import type { TeacherSubscription } from "@/features/students/schema"

export const dynamic = "force-dynamic"

type StudentsPageResult =
  | {
      kind: "ready"
      subscriptions: TeacherSubscription[]
      courses: CourseOut[]
    }
  | { kind: "error"; error: ApiError }

async function loadStudentsData(
  teacherProfileId: number
): Promise<StudentsPageResult> {
  try {
    const [subscriptions, courses] = await Promise.all([
      listTeacherSubscriptions(),
      listCourses(teacherProfileId),
    ])

    return { kind: "ready", subscriptions, courses }
  } catch (err) {
    return {
      kind: "error",
      error: toPageError(err),
    }
  }
}

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "student" })

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

  const result = await loadStudentsData(user.id)

  if (result.kind === "error") {
    return <Placeholder state="error" error={result.error} />
  }

  return (
    <div className="space-y-7">
      <header className="border-b border-border pb-5">
        <h1 className="text-headline-md font-bold text-on-surface">
          {t("page_title")}
        </h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          {t("page_subtitle", { count: result.subscriptions.length })}
        </p>
      </header>
      <StudentRoster
        subscriptions={result.subscriptions}
        courses={result.courses}
      />
    </div>
  )
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
