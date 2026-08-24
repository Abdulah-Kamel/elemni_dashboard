export type CourseUsageStatus = "published" | "draft"

export interface CourseUsageRow {
  id: number
  title: string
  subject: string | null
  grade: string | null
  stream: string | null
  status: CourseUsageStatus
  lessonCount: number
  itemCount: number
  videoCount: number
  documentCount: number
  examCount: number
  otherCount: number
  subscriptionCount: number
}

export interface UsageSummary {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalLessons: number
  totalItems: number
  totalVideoItems: number
  totalDocumentItems: number
  totalExamItems: number
  totalOtherItems: number
  totalSubscriptions: number
}

export interface UsageDashboardData {
  summary: UsageSummary
  topCourse: CourseUsageRow | null
  courseUsage: CourseUsageRow[]
}
