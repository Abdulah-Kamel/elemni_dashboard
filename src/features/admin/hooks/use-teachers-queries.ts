"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listTeachersAction, createTeacher } from "@/features/admin/actions";

export function useTeachersQuery() {
  return useQuery({
    queryKey: adminKeys.teachers,
    queryFn: () => listTeachersAction(),
  });
}

export function useTeacherMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: adminKeys.teachers });

  const create = useMutation({
    mutationFn: (data: unknown) => createTeacher(data),
    onSuccess: invalidate,
  });

  return { create };
}
