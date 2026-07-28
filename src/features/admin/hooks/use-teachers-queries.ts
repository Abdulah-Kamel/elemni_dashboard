"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listTeachersAction, createTeacher, deleteTeacher } from "@/features/admin/actions";

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

  const remove = useMutation({
    mutationFn: (id: number) => deleteTeacher(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
