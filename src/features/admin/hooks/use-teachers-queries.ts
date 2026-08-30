"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminKeys } from "@/features/admin/query-keys"
import {
  createTeacher,
  listTeachersAction,
  updateTeacher,
} from "@/features/admin/actions"
import type { PageParams } from "@/features/admin/queries"

export function useTeachersQuery(params: PageParams = {}) {
  return useQuery({
    queryKey: adminKeys.teachers(params),
    queryFn: () => listTeachersAction(params),
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
