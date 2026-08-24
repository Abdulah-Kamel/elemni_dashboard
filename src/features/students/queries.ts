import "server-only"

import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  teacherSubscriptionsPageSchema,
  type TeacherSubscription,
} from "@/features/students/schema"

export async function listTeacherSubscriptions(): Promise<TeacherSubscription[]> {
  const pageSize = 100
  const items: TeacherSubscription[] = []
  let skip = 0
  let total = 0

  do {
    const path = `${endpoints.teachers.subscriptions}?payment_status=all&skip=${skip}&limit=${pageSize}`
    const result = await apiFetch(path, teacherSubscriptionsPageSchema, {
      tags: ["teacher-subscriptions"],
    })

    items.push(...result.items)
    total = result.total
    skip += result.items.length

    if (result.items.length === 0) {
      break
    }
  } while (items.length < total)

  return items
}
