"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTeacherProfileAction,
  updateTeacherProfile,
} from "@/features/profile/actions"
import type {
  TeacherProfile,
  TeacherProfileOut,
  UpdateProfileRequest,
} from "@/features/profile/schema"
import { profileKeys } from "@/features/profile/query-keys"
import { unwrapActionResult } from "@/lib/query-action"

export function useTeacherProfileQuery(
  initialData?: TeacherProfile,
  enabled = true,
) {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getTeacherProfileAction,
    enabled,
    ...(initialData !== undefined ? { initialData } : {}),
  })
}

export function useProfileMutations() {
  const queryClient = useQueryClient()

  const update = useMutation({
    mutationFn: async (input: UpdateProfileRequest) =>
      unwrapActionResult(await updateTeacherProfile(input)),
    onSuccess: async (profile: TeacherProfileOut) => {
      const current = queryClient.getQueryData<TeacherProfile>(profileKeys.me)
      if (current) {
        queryClient.setQueryData<TeacherProfile>(profileKeys.me, {
          ...current,
          ...profile,
        })
      }
      await queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
  })

  return { update }
}
