### Task 2: Tighten profile schema

**Files:**
- Modify: `src/features/profile/schema.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `updateProfileRequestSchema` — `img` is now `z.string().url().nullable().optional()` (was unconstrained `z.string()`).

#### Steps

- [ ] **Step 1: Update `updateProfileRequestSchema`**

Read the current file, then edit the `img` field in `updateProfileRequestSchema`:

```ts
export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  img: z.string().url().nullable().optional(),
});
```

Make sure the `cover_subtitle` key that was in the old profile page is NOT referenced from schema (it was only a CSS/UI key, not in schema).

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/schema.ts
git commit -m "feat: tighten profile img field to url().nullable()"
```
