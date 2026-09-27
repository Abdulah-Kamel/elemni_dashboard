"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listSubjectsAction, listGradesAction, listStreamsAction } from "@/features/course-management/actions";
import type { GradeOut, StreamOut, SubjectOut } from "@/features/course-management/schema"

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyQuery(
  kind: TaxonomyKind,
  initialData?: GradeOut[] | StreamOut[] | SubjectOut[]
) {
  return useQuery({
    queryKey: adminKeys.taxonomy(kind),
    queryFn: async () => {
      if (kind === "subjects") return await listSubjectsAction();
      if (kind === "grades") return await listGradesAction();
      return await listStreamsAction();
    },
    initialData,
  });
}
