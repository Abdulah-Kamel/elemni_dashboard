"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { createTaxonomyItem, updateTaxonomyItem, deleteTaxonomyItem } from "@/features/admin/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyMutations(kind: TaxonomyKind) {
  const qc = useQueryClient();
  const invalidateOnSuccess = (result: { success: boolean }) => {
    if (result.success) {
      return qc.invalidateQueries({ queryKey: adminKeys.taxonomy(kind) });
    }
  };

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => createTaxonomyItem(kind, data),
    onSuccess: invalidateOnSuccess,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateTaxonomyItem(kind, id, data),
    onSuccess: invalidateOnSuccess,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteTaxonomyItem(kind, id),
    onSuccess: invalidateOnSuccess,
  });

  return { create, update, remove };
}
