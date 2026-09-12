# Admin Coupons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins manage coupons (full CRUD + enable/disable toggle + search/filter) at `/admin/coupons` using dummy data persisted to localStorage.

**Architecture:** New feature slice `src/features/coupons/` (zod `schema.ts`, dummy `store.ts` with localStorage, TanStack `hooks/use-coupon-queries.ts`, table `coupons-view.tsx`, three dialogs) following `billing-view.tsx` + `taxonomy-*-dialog.tsx` patterns; new guarded route `app/[locale]/(admin)/admin/coupons/page.tsx`; nav entry in `sidebar.tsx` + mobile nav.

**Tech Stack:** Next.js 16 + React 19, shadcn UI (Card/Table/Dialog/Input/Badge/Button), TanStack Query, zod, next-intl (ar default, en), sonner toasts, vitest.

## Global Constraints

- Same `Coupon` contract as student spec: `{code, type, value, currency: EGP, active, expiresAt, maxUses, usedCount, description?, createdAt}`; code regex `^[A-Z0-9_-]{3,20}$`; percentage 1-100; fixed >0.
- Status derivation: Expired (expiresAt < now) > Exhausted (maxUses reached) > Inactive (!active) > Active.
- Storage keys: `elemni.admin.coupons.v1` (admin source of truth) + mirror to `elemni.coupons.v1` (student read key) on every mutation.
- Seeds identical to student: SAVE20, WELCOME50, EXPIRED10, OFF50.
- No `src/lib/api/endpoints.ts` changes; backend swap later reuses zod schemas.
- TDD + commit per task; bilingual ar/en.

---

### Task 1: Coupon schema + dummy store

**Files:**
- Create: `src/features/coupons/schema.ts`
- Create: `src/features/coupons/store.ts`
- Test: `src/features/coupons/__tests__/store.test.ts`

**Interfaces:**
- Consumes: zod.
- Produces: `couponSchema`, `createCouponSchema`, `updateCouponSchema`, `Coupon`, `CouponStatus`, `deriveStatus(c: Coupon, now?: Date): CouponStatus`, `listCoupons(): Coupon[]`, `createCoupon(input): Coupon`, `updateCoupon(code, patch): Coupon`, `deleteCoupon(code): void`, `toggleCoupon(code): Coupon`, `SEED_COUPONS`, `ADMIN_STORAGE_KEY`, `SHARED_STORAGE_KEY`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/coupons/__tests__/store.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { createCoupon, listCoupons, toggleCoupon, deriveStatus } from "../store";

beforeEach(() => localStorage.clear());

describe("coupon store", () => {
  it("seeds 4 coupons including SAVE20", () => {
    expect(listCoupons().map((c) => c.code)).toContain("SAVE20");
    expect(listCoupons()).toHaveLength(4);
  });
  it("rejects duplicate code", () => {
    expect(() => createCoupon({ code: "SAVE20", type: "percentage", value: 10, active: true, expiresAt: null, maxUses: null, description: "" })).toThrow();
  });
  it("toggles active flag", () => {
    const off = toggleCoupon("SAVE20");
    expect(off.active).toBe(false);
    expect(deriveStatus(off)).toBe("inactive");
  });
  it("derives expired status", () => {
    const c = listCoupons().find((x) => x.code === "EXPIRED10")!;
    expect(deriveStatus(c, new Date("2026-09-12T00:00:00Z"))).toBe("expired");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/coupons/__tests__/store.test.ts`
Expected: FAIL with "Failed to resolve import ../store".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/coupons/schema.ts
import { z } from "zod";
export const couponCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, "invalid_code");
export const couponSchema = z.object({
  code: couponCodeSchema,
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  currency: z.literal("EGP"),
  active: z.boolean(),
  expiresAt: z.string().nullable(),
  maxUses: z.number().int().positive().nullable(),
  usedCount: z.number().int().min(0),
  description: z.string().max(200).optional().default(""),
  createdAt: z.string(),
}).superRefine((c, ctx) => {
  if (c.type === "percentage" && (c.value < 1 || c.value > 100))
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "percentage_1_100" });
});
export const createCouponSchema = couponSchema.omit({ usedCount: true, createdAt: true, currency: true });
export const updateCouponSchema = createCouponSchema.partial().extend({ code: couponCodeSchema });
export type Coupon = z.infer<typeof couponSchema>;
export type CouponStatus = "active" | "inactive" | "expired" | "exhausted";
```

```ts
// src/features/coupons/store.ts (excerpt — full CRUD + localStorage mirror)
import type { Coupon, CouponStatus } from "./schema";
import { createCouponSchema } from "./schema";

export const ADMIN_STORAGE_KEY = "elemni.admin.coupons.v1";
export const SHARED_STORAGE_KEY = "elemni.coupons.v1";
export const SEED_COUPONS: Coupon[] = [ /* same 4 seeds as student spec */ ];

function read(): Coupon[] {
  if (typeof window === "undefined") return [...SEED_COUPONS];
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [...SEED_COUPONS];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [...SEED_COUPONS];
  } catch { return [...SEED_COUPONS]; }
}
function write(all: Coupon[]) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(all));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(all));
}
export function deriveStatus(c: Coupon, now = new Date()): CouponStatus {
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now.getTime()) return "expired";
  if (c.maxUses != null && c.usedCount >= c.maxUses) return "exhausted";
  if (!c.active) return "inactive";
  return "active";
}
export function listCoupons(): Coupon[] { return read(); }
export function createCoupon(input: unknown): Coupon {
  const parsed = createCouponSchema.parse({ ...(input as object), currency: undefined });
  const all = read();
  if (all.some((c) => c.code === parsed.code)) throw new Error("duplicate_code");
  const coupon: Coupon = { ...parsed, currency: "EGP", usedCount: 0, createdAt: new Date().toISOString() };
  write([...all, coupon]);
  return coupon;
}
export function updateCoupon(code: string, patch: unknown): Coupon {
  const all = read();
  const idx = all.findIndex((c) => c.code === code);
  if (idx === -1) throw new Error("not_found");
  const next = { ...all[idx], ...(patch as object), code };
  write(all.map((c, i) => (i === idx ? next : c)));
  return next;
}
export function deleteCoupon(code: string): void {
  write(read().filter((c) => c.code !== code));
}
export function toggleCoupon(code: string): Coupon {
  const all = read();
  const idx = all.findIndex((c) => c.code === code);
  if (idx === -1) throw new Error("not_found");
  const next = { ...all[idx], active: !all[idx].active };
  write(all.map((c, i) => (i === idx ? next : c)));
  return next;
}
```

Copy the exact 4 seeds from the design spec (SAVE20/WELCOME50/EXPIRED10/OFF50).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/coupons/__tests__/store.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/features/coupons/schema.ts src/features/coupons/store.ts src/features/coupons/__tests__/store.test.ts
git commit -m "feat(admin): add coupon schema and dummy store"
```

### Task 2: Query hooks (list + mutations)

**Files:**
- Create: `src/features/coupons/hooks/use-coupon-queries.ts`
- Modify: `src/features/admin/query-keys.ts` (append `coupons` key)
- Test: `src/features/coupons/__tests__/hooks.test.tsx`

**Interfaces:**
- Consumes: `store.ts` + `adminKeys` + TanStack Query + sonner.
- Produces: `useCoupons(search: string, status: string, type: string)` returning filtered list; `useCreateCoupon()`, `useUpdateCoupon()`, `useDeleteCoupon()`, `useToggleCoupon()` mutations that toast + invalidate `adminKeys.coupons()`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/coupons/__tests__/hooks.test.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCoupons } from "../hooks/use-coupon-queries";

describe("useCoupons", () => {
  it("filters by search", async () => {
    const qc = new QueryClient();
    const { result } = renderHook(() => useCoupons("SAVE", "all", "all"), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(result.current.data?.some((c) => c.code === "SAVE20")).toBe(true));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/coupons/__tests__/hooks.test.tsx`
Expected: FAIL with missing module `../hooks/use-coupon-queries`.

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/features/admin/query-keys.ts
coupons: (params?: unknown) => ["admin", "coupons", params ?? {}] as const,
```

```ts
// src/features/coupons/hooks/use-coupon-queries.ts
"use client";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminKeys } from "@/features/admin/query-keys";
import { deriveStatus } from "../store";
import { createCoupon, deleteCoupon, listCoupons, toggleCoupon, updateCoupon } from "../store";

export function useCoupons(search: string, status: string, type: string) {
  return useQuery({
    queryKey: adminKeys.coupons({ search, status, type }),
    queryFn: () => {
      const q = search.trim().toUpperCase();
      return listCoupons().filter((c) => {
        if (q && !c.code.includes(q)) return false;
        if (type !== "all" && c.type !== type) return false;
        if (status !== "all" && deriveStatus(c) !== status) return false;
        return true;
      });
    },
  });
}
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: adminKeys.coupons() });
}
export function useCreateCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (input: unknown) => createCoupon(input),
    onSuccess: () => { toast.success("created"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useUpdateCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ code, patch }: { code: string; patch: unknown }) => updateCoupon(code, patch),
    onSuccess: () => { toast.success("updated"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (code: string) => { deleteCoupon(code); return code; },
    onSuccess: () => { toast.success("deleted"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useToggleCoupon() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (code: string) => toggleCoupon(code),
    onSuccess: () => { toast.success("toggled"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export const __noop = 0;
```

Note: toast keys replaced with i18n in Task 4 dialogs/view (pass translated strings via `t()`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/coupons/__tests__/hooks.test.tsx src/features/coupons/__tests__/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/coupons/hooks/use-coupon-queries.ts src/features/admin/query-keys.ts src/features/coupons/__tests__/hooks.test.tsx
git commit -m "feat(admin): add coupon query hooks with filters"
```

### Task 3: Coupons table view with filters

**Files:**
- Create: `src/features/coupons/components/coupons-view.tsx`
- Test: `src/features/coupons/__tests__/coupons-view.test.tsx`

**Interfaces:**
- Consumes: `useCoupons`, shadcn `Card/Table/Badge/Input/Button`, `useTranslations("coupons")`.
- Produces: `CouponsView()` — header (count + create button via prop `onCreate`), filters (search/status/type), table (Code, Type, Value, Status, Expires, Uses, Actions via render-prop props `onEdit(code)`, `onDelete(code)`, `onToggle(code)`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/coupons/__tests__/coupons-view.test.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CouponsView } from "../components/coupons-view";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "ar" }));

describe("CouponsView", () => {
  it("renders SAVE20 row", () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><CouponsView onCreate={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} /></QueryClientProvider>);
    expect(screen.getByText("SAVE20")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/coupons/__tests__/coupons-view.test.tsx`
Expected: FAIL with missing module.

- [ ] **Step 3: Write minimal implementation**

Follow `billing-view.tsx:101-298` structure: `Card > CardHeader(title + Badge count + Button create) > filters form (Input search + 2 native selects) > Table > footer count`. Columns: Code (font-mono bold), Type badge (`percentage`→blue, `fixed`→green), Value (`20%` or `50 EGP` via `Intl.NumberFormat(locale,{style:currency,currency:EGP})`), Status badge (active emerald / inactive slate / expired red / exhausted amber), Expires (`Intl.DateTimeFormat` or `—`), Uses (`used/max` or `used/∞`), Actions (Edit icon button, Toggle switch, Delete icon button). Loading: `Skeleton` rows; empty: centered `p-8` with `empty` key. Keep client pagination simple: show all (≤50) with `showing {n}` footer — no server paging for dummy.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/coupons/__tests__/coupons-view.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/coupons/components/coupons-view.tsx src/features/coupons/__tests__/coupons-view.test.tsx
git commit -m "feat(admin): add coupons table view with filters"
```

### Task 4: Create / edit / delete dialogs + toggle wiring

**Files:**
- Create: `src/features/coupons/components/coupon-create-dialog.tsx`
- Create: `src/features/coupons/components/coupon-edit-dialog.tsx`
- Create: `src/features/coupons/components/coupon-delete-dialog.tsx`
- Modify: `src/features/coupons/components/coupons-view.tsx` (wire dialogs + `useToggleCoupon`)
- Test: extend `src/features/coupons/__tests__/store.test.ts` with update/delete cases (no new UI test — dialogs follow taxonomy pattern)

**Interfaces:**
- Consumes: `useCreateCoupon/useUpdateCoupon/useDeleteCoupon` (Task 2), shadcn `Dialog/Input/Select/Button`, zod schemas (Task 1).
- Produces: dialog components with props `open, onOpenChange, onSuccess?` (+ `code` for edit/delete).

- [ ] **Step 1: Write the failing test**

```ts
// append to src/features/coupons/__tests__/store.test.ts
it("updates value and deletes", () => {
  const { updateCoupon, deleteCoupon, listCoupons } = await import("../store");
  updateCoupon("SAVE20", { value: 25 });
  expect(listCoupons().find((c) => c.code === "SAVE20")!.value).toBe(25);
  deleteCoupon("OFF50");
  expect(listCoupons().some((c) => c.code === "OFF50")).toBe(false);
});
```

(Write as a real `it()` block appended to the file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/coupons/__tests__/store.test.ts`
Expected: FAIL only if `updateCoupon` merge breaks zod shape — actually store already implements it (Task 1), so this test passes; the gate here is dialogs missing: `ls src/features/coupons/components/coupon-*.tsx` returns nothing.

- [ ] **Step 3: Write minimal implementation**

Copy `src/features/admin/components/taxonomy-create-dialog.tsx` structure for each dialog:
- Create: fields Code (uppercase auto-transform onChange), Type (Select percentage/fixed), Value (number Input; hint `% 1-100` vs `EGP`), Active (checkbox/switch default on), Expires (date Input → ISO or null), MaxUses (number or empty = unlimited), Description (Textarea optional). Validate with `createCouponSchema` client-side; server errors → inline `formError`; success → `toast.success(t("created"))` + `onOpenChange(false)`.
- Edit: same fields minus Code (read-only badge), prefilled from `listCoupons().find(code)`; calls `useUpdateCoupon`.
- Delete: confirm dialog showing code + warning text; calls `useDeleteCoupon`.
- View wiring: `const [createOpen, setCreateOpen] = useState(false); const [editCode, setEditCode] = useState<string|null>(null); const [deleteCode, setDeleteCode] = useState<string|null>(null);` toggle via `useToggleCoupon().mutate(code)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/coupons/__tests__/store.test.ts && npx tsc --noEmit`
Expected: PASS + no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/coupons/components/coupon-create-dialog.tsx src/features/coupons/components/coupon-edit-dialog.tsx src/features/coupons/components/coupon-delete-dialog.tsx src/features/coupons/components/coupons-view.tsx
git commit -m "feat(admin): add coupon CRUD dialogs and toggle"
```

### Task 5: Route + nav + i18n + verification

**Files:**
- Create: `app/[locale]/(admin)/admin/coupons/page.tsx`
- Modify: `src/features/shell/components/sidebar.tsx:37-45` (ADMIN_NAV)
- Modify: `src/features/shell/components/mobile-bottom-nav.tsx` (same entry)
- Modify: `src/i18n/messages/ar.json` (add `coupons`, extend `sidebar`)
- Modify: `src/i18n/messages/en.json` (mirror)

**Interfaces:**
- Consumes: `CouponsView` + dialogs (Tasks 3-4); existing admin layout guard.
- Produces: `/admin/coupons` page rendering the full manager.

- [ ] **Step 1: Write the failing test**

```bash
ls "app/[locale]/(admin)/admin/coupons/page.tsx" && python3 -c "import json; ar=json.load(open('src/i18n/messages/ar.json')); assert 'coupons' in ar, 'coupons i18n missing'"
```

Expected: FAIL (`ls: cannot access ...`, assertion error).

- [ ] **Step 2: Run test to verify it fails**

Run: the command above.
Expected: FAIL as described.

- [ ] **Step 3: Write minimal implementation**

```tsx
// app/[locale]/(admin)/admin/coupons/page.tsx
import { getTranslations } from "next-intl/server";
import { CouponsManager } from "@/features/coupons/components/coupons-manager";
// If CouponsManager not created, inline: "use client" wrapper in coupons-view holding dialog state from Task 4.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coupons" });
  return { title: t("title") };
}
export default function AdminCouponsPage() {
  return <CouponsManager />;
}
```

Create `src/features/coupons/components/coupons-manager.tsx` (`"use client"`) that owns dialog state and renders `<CouponsView onCreate/onEdit/onDelete/onToggle>` + the three dialogs — this is the composition from Task 4 wiring.

Sidebar: add `{ id: "coupons", href: "/admin/coupons", icon: TicketPercent }` to `ADMIN_NAV` (import `TicketPercent` from lucide-react); same in `mobile-bottom-nav.tsx`.

i18n (both locales): `sidebar.coupons`: `الكوبونات`/`Coupons`; `coupons.*`: title `إدارة الكوبونات`/`Coupon management`, subtitle, create/edit/delete/save/cancel, code/type/value/status/expires/uses/actions, search placeholder, filters (all/active/inactive/expired/exhausted, percentage/fixed), toasts (created/updated/deleted/toggled + duplicate_code error), empty state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/coupons && npm run typecheck && npm run lint`
Expected: PASS (all coupon tests green, `tsc --noEmit` clean, eslint clean).

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(admin)/admin/coupons/page.tsx" src/features/coupons/components/coupons-manager.tsx src/features/shell/components/sidebar.tsx src/features/shell/components/mobile-bottom-nav.tsx src/i18n/messages/ar.json src/i18n/messages/en.json
git commit -m "feat(admin): add coupons route, nav, and i18n"
```
