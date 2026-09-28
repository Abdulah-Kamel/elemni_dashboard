import { Suspense } from "react"
import { setRequestLocale } from "next-intl/server"
import { StudentsList } from "@/features/admin/components/students-list"
import { TableSkeleton } from "@/features/admin/components/list-controls"

export default async function StudentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  // The list reads its filters from the URL (useSearchParams), so it streams in behind a skeleton.
  return (
    <Suspense fallback={<TableSkeleton />}>
      <StudentsList />
    </Suspense>
  )
}
