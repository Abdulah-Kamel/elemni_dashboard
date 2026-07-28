"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listSubjectsAction, listGradesAction, listStreamsAction } from "@/features/course-management/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyQuery(kind: TaxonomyKind) {
  return useQuery({
    queryKey: adminKeys.taxonomy(kind),
    queryFn: async () => {
      if (kind === "subjects") return await listSubjectsAction();
      if (kind === "grades") return await listGradesAction();
      return await listStreamsAction();
    },
  });
}
