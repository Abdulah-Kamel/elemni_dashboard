"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { createTaxonomyItem, updateTaxonomyItem, deleteTaxonomyItem } from "@/features/admin/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyMutations(kind: TaxonomyKind) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: adminKeys.taxonomy(kind) });

  const create = useMutation({
    mutationFn: (data: Record<string, string>) => createTaxonomyItem(kind, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, string> }) =>
      updateTaxonomyItem(kind, id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteTaxonomyItem(kind, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
