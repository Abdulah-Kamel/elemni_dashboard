import "server-only"

import {
  listCourses,
  listGrades,
  listStreams,
  listSubjects,
} from "@/features/course-management/queries"
import { listItems } from "@/features/course-management/items-queries"
import { listLessons } from "@/features/course-management/lessons-queries"
import { listTeacherSubscriptions } from "@/features/students/queries"
import type {
  CourseUsageRow,
  UsageDashboardData,
  UsageSummary,
} from "@/features/storage/types"

export async function getUsageDashboard(
  teacherProfileId: number
): Promise<UsageDashboardData> {
  const [courses, subscriptions, gradesResult, streamsResult, subjectsResult] =
    await Promise.all([
      listCourses(teacherProfileId),
      listTeacherSubscriptions(),
      listGrades().catch(() => []),
      listStreams().catch(() => []),
      listSubjects().catch(() => []),
    ])

  const gradeNames = new Map(
    gradesResult.map((grade) => [grade.id, grade.name])
  )
  const streamNames = new Map(
    streamsResult.map((stream) => [stream.id, stream.name])
  )
  const subjectNames = new Map(
    subjectsResult.map((subject) => [subject.id, subject.name])
  )
  const subscriptionCounts = new Map<number, number>()

  for (const subscription of subscriptions) {
    subscriptionCounts.set(
      subscription.course.id,
      (subscriptionCounts.get(subscription.course.id) ?? 0) + 1
    )
  }

  const courseUsage = await Promise.all(
    courses.map(async (course) => {
      const lessons = await listLessons(course.id)
      const itemsByLesson = await Promise.all(
        lessons.map((lesson) => listItems(course.id, lesson.id))
      )
      const items = itemsByLesson.flat()

      let videoCount = 0
      let documentCount = 0
      let examCount = 0
      let otherCount = 0

      for (const item of items) {
        if (item.exam_id != null) {
          examCount += 1
        } else if (item.bunny_stream_id) {
          videoCount += 1
        } else if (item.document_path) {
          documentCount += 1
        } else {
          otherCount += 1
        }
      }

      return {
        id: course.id,
        title: course.title,
        subject:
          course.subject_name ??
          (course.subject_id != null
            ? subjectNames.get(course.subject_id)
            : null) ??
          null,
        grade: gradeNames.get(course.grade_id) ?? `Grade ${course.grade_id}`,
        stream:
          streamNames.get(course.stream_id) ?? `Stream ${course.stream_id}`,
        status: course.is_published ? "published" : "draft",
        lessonCount: lessons.length,
        itemCount: items.length,
        videoCount,
        documentCount,
        examCount,
        otherCount,
        subscriptionCount: subscriptionCounts.get(course.id) ?? 0,
      } satisfies CourseUsageRow
    })
  )

  courseUsage.sort((left, right) => {
    if (right.itemCount !== left.itemCount) {
      return right.itemCount - left.itemCount
    }
    if (right.subscriptionCount !== left.subscriptionCount) {
      return right.subscriptionCount - left.subscriptionCount
    }
    if (right.lessonCount !== left.lessonCount) {
      return right.lessonCount - left.lessonCount
    }
    return left.title.localeCompare(right.title)
  })

  const summary = courseUsage.reduce<UsageSummary>(
    (accumulator, course) => {
      accumulator.totalCourses += 1
      accumulator.publishedCourses += course.status === "published" ? 1 : 0
      accumulator.draftCourses += course.status === "draft" ? 1 : 0
      accumulator.totalLessons += course.lessonCount
      accumulator.totalItems += course.itemCount
      accumulator.totalVideoItems += course.videoCount
      accumulator.totalDocumentItems += course.documentCount
      accumulator.totalExamItems += course.examCount
      accumulator.totalOtherItems += course.otherCount
      accumulator.totalSubscriptions += course.subscriptionCount
      return accumulator
    },
    {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalLessons: 0,
      totalItems: 0,
      totalVideoItems: 0,
      totalDocumentItems: 0,
      totalExamItems: 0,
      totalOtherItems: 0,
      totalSubscriptions: 0,
    }
  )

  return {
    summary,
    topCourse: courseUsage[0] ?? null,
    courseUsage,
  }
}
