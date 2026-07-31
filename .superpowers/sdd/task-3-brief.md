# Task 3: Add server action wrappers and remove revalidateTag

**Files:**
- Modify: `src/features/admin/actions.ts`

**Interfaces:**
- Produces: `listTeachersAction()` — returns `Promise<AdminTeacherListItem[]>`
- Updates: `createTaxonomyItem`, `updateTaxonomyItem`, `deleteTaxonomyItem`, `createTeacher` — no longer call `revalidateTag`

## Context

The current `actions.ts` has `"use server"` functions for admin CRUD. Each mutation action calls `revalidateTag` after success. We need to:
1. Add a new `listTeachersAction()` that delegates to `listTeachers()` from queries
2. Remove the `revalidateTag` calls from the 4 mutation functions (React Query will handle invalidation instead)

## Steps

- [ ] **Step 1: Add listTeachersAction**

Add this import at the top with the other imports (after line 8):
```ts
import { listTeachers as listTeachersQuery } from "@/features/admin/queries";
import type { AdminTeacherListItem } from "@/features/admin/schema";
```

Add this function after the existing `sendSetPasswordEmail` function and before the `TaxonomyKind` type:
```ts
export async function listTeachersAction(): Promise<AdminTeacherListItem[]> {
  return listTeachersQuery();
}
```

- [ ] **Step 2: Remove revalidateTag calls**

In `createTeacher` function: Remove the line `revalidateTag("teachers:all", "default");`

In `createTaxonomyItem` function: Remove the line `revalidateTag(`${kind}:all`, "default");`

In `updateTaxonomyItem` function: Remove the line `revalidateTag(`${kind}:all`, "default");`

In `deleteTaxonomyItem` function: Remove the line `revalidateTag(`${kind}:all`, "default");`

- [ ] **Step 3: Clean up unused import**

After removing all `revalidateTag` calls from admin actions, remove `revalidateTag` from the import line if it's no longer used.

Note: `revalidateTag` is still imported and used in `src/features/course-management/actions.ts` — do NOT touch that file.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/actions.ts
git commit -m "feat: add listTeachersAction, remove revalidateTag from admin actions"
```

## Current file format

The file starts with these imports:
```
"use server";
import { revalidateTag } from "next/cache";  ← remove this line
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { apiFetch } from "@/lib/api/client";
import { z } from "zod";
import { ... } from "@/features/admin/schema";
import { ... } from "@/features/course-management/schema";
import { logger } from "@/lib/logger";
```

The functions are in order:
- `redirectToSignIn()`
- `handleActionResultErr()`
- `createTeacher()` ← has revalidateTag call
- `sendSetPasswordEmail()`
- `TaxonomyKind` type
- `taxonomyOutSchema()`
- `taxonomyPath()`
- `createTaxonomyItem()` ← has revalidateTag call
- `updateTaxonomyItem()` ← has revalidateTag call
- `deleteTaxonomyItem()` ← has revalidateTag call
