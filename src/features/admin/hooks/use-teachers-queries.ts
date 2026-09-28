"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminKeys } from "@/features/admin/query-keys"
import {
  createTeacher,
  getTeacherAction,
  listTeachersAction,
  updateTeacher,
} from "@/features/admin/actions"
import type { PageParams } from "@/features/admin/queries"

export function useTeachersQuery(params: PageParams = {}) {
  return useQuery({
    queryKey: adminKeys.teachers(params),
    queryFn: () => listTeachersAction(params),
    placeholderData: keepPreviousData,
  })
}

/** One teacher for the side panel; skipped when the row is already loaded. */
export function useTeacherQuery(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.teacher(id ?? 0),
    queryFn: () => getTeacherAction(id as number),
    enabled: enabled && id !== null,
  })
}

export function useTeacherMutations() {
  const queryClient = useQueryClient()
  const invalidateOnSuccess = (result: { success: boolean }) => {
    if (result.success) {
      return queryClient.invalidateQueries({ queryKey: adminKeys.all })
    }
  }
  const create = useMutation({ mutationFn: createTeacher, onSuccess: invalidateOnSuccess })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateTeacher(id, data),
    onSuccess: invalidateOnSuccess,
  })
  return { create, update }
}
