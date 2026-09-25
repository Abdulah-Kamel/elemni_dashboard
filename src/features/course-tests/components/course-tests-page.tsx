"use client"

import { useTranslations } from "next-intl"
import { ClipboardList, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCourseTestsQuery } from "../hooks"
import type { ActionResult, CourseTestRow, TestStats } from "../types"
import type { CourseOption } from "./copy-test-dialog"
import { NewTestOptions } from "./new-test-options"
import { TestsKpis, TestsKpisSkeleton } from "./tests-kpis"
import { TestsTable, TestsTableSkeleton } from "./tests-table"

type Overview = { rows: CourseTestRow[]; stats: TestStats }

/** Tests tab body (Teacher-Tests design): KPI cards, tests table, "start a new test". */
export function CourseTestsOverview({ courseId, courses, initial }: { courseId: number; courses: CourseOption[]; initial?: Overview }) {
  const t = useTranslations("courseTests")
  const query = useCourseTestsQuery<Overview>(
    async (client): Promise<ActionResult<Overview>> => {
      const [rows, stats] = await Promise.all([client.listTests(courseId), client.getStats(courseId)])
      if (!rows.ok) return rows
      if (!stats.ok) return stats
      return { ok: true, data: { rows: rows.data, stats: stats.data } }
    },
    [courseId],
    initial,
  )

  return (
    <div className="flex flex-col gap-5.5">
      {query.status === "loading" && (
        <div className="flex flex-col gap-5.5" aria-busy="true">
          <span className="sr-only" role="status">
            {t("page.loading")}
          </span>
          <TestsKpisSkeleton />
          <TestsTableSkeleton />
        </div>
      )}

      {query.status === "error" && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{query.error || t("page.load_error")}</p>
          <Button variant="outline" className="h-11 gap-2 px-4" onClick={query.reload}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t("page.retry")}
          </Button>
        </div>
      )}

      {query.status === "ready" && (
        <>
          <TestsKpis stats={query.data.stats} animate={initial === undefined} />
          {query.data.rows.length === 0 ? (
            <div className="flex animate-slide-up animate-stagger-3 flex-col items-center gap-2 rounded-[20px] border border-dashed border-border-strong bg-card px-6 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-tint text-primary" aria-hidden="true">
                <ClipboardList className="size-6" />
              </span>
              <h2 className="text-base font-semibold">{t("table.empty_title")}</h2>
              <p className="max-w-md text-sm text-on-surface-muted">{t("table.empty_description")}</p>
            </div>
          ) : (
            <TestsTable rows={query.data.rows} />
          )}
        </>
      )}

      <NewTestOptions courseId={courseId} courses={courses} />
    </div>
  )
}
