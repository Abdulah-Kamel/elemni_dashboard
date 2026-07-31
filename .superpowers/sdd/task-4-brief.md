# Task 4: Create React Query hooks (taxonomy + teachers)

**Files:**
- Create: `src/features/admin/hooks/use-taxonomy-queries.ts`
- Create: `src/features/admin/hooks/use-taxonomy-mutations.ts`
- Create: `src/features/admin/hooks/use-teachers-queries.ts`

**Interfaces:**
- Produces: `useTaxonomyQuery(kind)`, `useTaxonomyMutations(kind)`, `useTeachersQuery()`, `useTeacherMutations()`

## Dependencies (already exist)

- `adminKeys` from `@/features/admin/query-keys` (created in Task 2)
- `listSubjectsAction`, `listGradesAction`, `listStreamsAction` from `@/features/course-management/actions`
- `createTaxonomyItem`, `updateTaxonomyItem`, `deleteTaxonomyItem` from `@/features/admin/actions`
- `listTeachersAction`, `createTeacher` from `@/features/admin/actions`

## Steps

- [ ] **Step 1: Create use-taxonomy-queries.ts**

`src/features/admin/hooks/use-taxonomy-queries.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "@/features/admin/query-keys";
import { listSubjectsAction, listGradesAction, listStreamsAction } from "@/features/course-management/actions";

type TaxonomyKind = "grades" | "streams" | "subjects";

export function useTaxonomyQuery(kind: TaxonomyKind) {
  return useQuery({
    queryKey: adminKeys.taxonomy(kind),
    queryFn: () => {
      if (kind === "subjects") return listSubjectsAction();
      if (kind === "grades") return listGradesAction();
      return listStreamsAction();
    },
  });
}
```

- [ ] **Step 2: Create use-taxonomy-mutations.ts**

`src/features/admin/hooks/use-taxonomy-mutations.ts`:

```ts
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
```

- [ ] **Step 3: Create use-teachers-queries.ts**

`src/features/admin/hooks/use-teachers-queries.ts`:

```ts
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
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/
git commit -m "feat: create React Query hooks for admin (taxonomy + teachers)"
```
