# Coupons Feature — Design (Dummy Data, Backend-Pending)

Date: 2026-09-12
Scope: student app (`elemni_front_end`) + admin dashboard (`elemni_dashboard`)
Status: Approved design, dummy data until backend finishes.

## 1. Purpose & Success Criteria

- Students can apply a coupon code at purchase time and see discounted price before redirect to payment (Kashier).
- Admins can CRUD coupons (code, type, value, active, expiry, usage limits) with search/filter.
- Dummy data behaves identically in both apps until real backend ships; swap is a single service-layer change.
- Bilingual ar (default) + en via next-intl. RTL-safe.
- Success: apply SAVE20 → 20% off shown in panel + modal; invalid/expired/inactive → clear Arabic/English error; admin create → appears in list + usable by student (localStorage).

## 2. Approaches Considered

### A. Shared mock service + localStorage (RECOMMENDED, chosen)
- Each app gets `lib/coupons/` with same `Coupon` type + seed list + `validateCoupon(code, price)` pure function.
- Admin mutations persist overrides to `localStorage` (`elemni.coupons.v1`); student reads seeds + overrides.
- Pros: zero backend dependency, admin CRUD demo works end-to-end locally, single-file swap to real API later (`couponsApi.validate` → POST `/api/v1/coupons/validate`).
- Cons: not multi-user; acceptable for dummy phase.

### B. Mock API routes matching future backend contract
- Add `POST /api/student/coupons/validate` + admin `/api/*` routes with MSW/static.
- Pros: most realistic, tests transfer directly.
- Cons: heavier (route + schema + auth mocks in two apps), overkill for dummy phase.

### C. UI-only hardcoded codes in components
- Pros: fastest.
- Cons: duplicated logic, no admin CRUD, throwaway code. Rejected.

## 3. Data Model (shared contract)

```ts
type CouponType = "percentage" | "fixed";

interface Coupon {
  code: string;            // uppercase, trimmed, e.g. "SAVE20"
  type: CouponType;        // percentage = 1-100, fixed = EGP amount
  value: number;           // percentage: 20; fixed: 50 (EGP)
  currency: "EGP";
  active: boolean;
  expiresAt: string | null; // ISO date or null = no expiry
  maxUses: number | null;   // null = unlimited
  usedCount: number;        // dummy counter, increments on apply (local only)
  description?: string;
  createdAt: string;        // ISO
}

interface CouponValidation {
  ok: boolean;
  coupon?: Coupon;
  originalPrice: number;
  discount: number;         // computed, capped at originalPrice
  finalPrice: number;       // max(0, original - discount)
  error?: "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";
}
```

Validation rules (pure function, both apps import same logic):
1. Normalize: trim + uppercase.
2. NOT_FOUND if code missing.
3. INACTIVE if `!active`.
4. EXPIRED if `expiresAt` < now.
5. EXHAUSTED if `maxUses != null && usedCount >= maxUses`.
6. Discount: percentage → `round(original * value / 100)`; fixed → `min(value, original)`.
7. `finalPrice = original - discount`.

Seeds (both apps):
- `SAVE20` — 20% off, active, expires +90d, maxUses 500, used 37.
- `WELCOME50` — 50 EGP off, active, expires +30d, maxUses 200, used 12.
- `EXPIRED10` — 10% off, active but expired yesterday (for error demo).
- `OFF50` — 50% off, `active: false` (for inactive demo).

## 4. Student App (`elemni_front_end`)

Existing insertion points (no coupons today):
- `src/features/courses/components/course-purchase-panel.tsx` — price display.
- `src/features/courses/components/checkout-confirmation.tsx` — confirm modal.
- `src/features/courses/components/course-detail.tsx` — `openCheckout/startCheckout` → `POST /api/student/payments/checkout {course_id}`.
- `src/app/api/student/payments/checkout/route.ts` — proxies to backend.

Changes:
1. New `src/lib/coupons/coupons.ts`: `Coupon` types + `SEED_COUPONS` + `validateCoupon`, `formatDiscount`, `loadCouponOverrides()` (localStorage) + `getAvailableCoupons(price)`.
2. New `src/features/courses/components/coupon-input.tsx`: input + Apply/Remove, inline error (`role=alert`), loading-free (sync validation). Props: `price, value, onApply(validation), compact?`.
3. `course-purchase-panel.tsx`: embed `coupon-input`; when valid → show strikethrough original + discounted total + savings badge (`-20%` / `-50 EGP`); invalid → error text under input.
4. `checkout-confirmation.tsx`: accept `couponValidation?: CouponValidation`; show 3-line summary (Original / Discount (CODE) / Total); allow remove; confirm button label shows final price.
5. `course-detail.tsx`: hold `couponValidation` state; `startCheckout` sends `{course_id, coupon_code?}` — Next route forwards `coupon_code` if present (backend ignores for now, ready for real API). Increment dummy `usedCount` locally on success redirect.
6. i18n: add `courseDetail.coupon*` keys to `src/messages/ar.json|en.json` (placeholder, apply, remove, invalid, expired, inactive, exhausted, discount, total, savings).
7. Styling: existing Tailwind v4 custom tokens, no new deps. Mobile-friendly, `dir`-aware.

Out of scope: cart (single-course only), auto-apply best coupon, listing offers page.

## 5. Admin Dashboard (`elemni_dashboard`)

No promo routes today; follow billing/admin CRUD patterns (`billing-view.tsx`, `taxonomy-*-dialog.tsx`).

Changes:
1. New route `app/[locale]/(admin)/admin/coupons/page.tsx` (guarded by existing admin layout) → `<CouponsView/>`. Add `ADMIN_NAV` entry in `src/features/shell/components/sidebar.tsx` + `mobile-bottom-nav.tsx` (Ticket/Percent icon, `admin.coupons` i18n).
2. New feature `src/features/coupons/`:
   - `schema.ts` (zod): `couponSchema`, `createCouponSchema` (code regex `^[A-Z0-9_-]{3,20}$`, percentage 1-100, fixed >0), `updateCouponSchema`.
   - `store.ts`: client dummy store — seeds + localStorage (`elemni.admin.coupons.v1`), functions `listCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon`. Emits to student key too (`elemni.coupons.v1`) so student app sees admin edits on same browser.
   - `hooks/use-coupon-queries.ts`: TanStack `useCoupons(search, statusFilter, typeFilter)` + `useCreate/Update/Delete/ToggleCoupon` mutations with `invalidateQueries(["coupons"])` + `sonner` toasts.
   - `components/coupons-view.tsx`: Card + header (count Badge + Create button) + filters (search Input, status select active/inactive/expired/exhausted, type select) + Table (Code, Type badge, Value, Status badge, Expires, Uses `used/max`, Created, Actions) + footer pagination (`dashboard-pagination.tsx`) + empty state + Skeleton loading.
   - `components/coupon-create-dialog.tsx`, `coupon-edit-dialog.tsx`, `coupon-delete-dialog.tsx`: Dialog + Input/Select pattern from taxonomy dialogs.
   - Status derivation: Expired (date), Exhausted (uses), Inactive, Active — badge colors matching payment-status-badge.
3. i18n: `src/i18n/messages/ar.json|en.json` `admin.coupons.*` (title, create, edit, delete, code, type, value, status, expires, uses, search, filters, toasts).
4. No `src/lib/api/endpoints.ts` change yet; on backend ready: add `coupons` endpoints + swap `store.ts` for `queries.ts/actions.ts` server actions (same zod schemas reused).

## 6. Dummy Sync & Backend Swap Plan

- Storage keys: `elemni.coupons.v1` (shared read shape `Coupon[]` overrides). Admin writes; student reads seeds + overrides (override by `code`).
- Swap checklist (later): implement `POST /api/v1/coupons/validate {code, course_id}` and admin CRUD endpoints → replace `store.ts`/`coupons.ts` internals, keep types + zod schemas + components untouched. Checkout route already forwards `coupon_code`.

## 7. Error Handling

- Student: all 4 error codes mapped to i18n strings, `role=alert`, no redirect on invalid coupon; checkout errors (401/409) unchanged.
- Admin: zod form errors inline; duplicate code → form error; delete → confirm dialog; toggle → optimistic + toast + revert on failure (dummy never fails).

## 8. Testing

- Student: vitest for `validateCoupon` (all branches + math caps), `coupon-input` interaction (apply/remove/error), purchase-panel totals. Follow existing `*.test.tsx` + `fetchMock` patterns.
- Admin: vitest for schema (regex, ranges), store CRUD/toggle, filter logic. Follow `features/billing/__tests__` + msw patterns.
- Manual: ar + en, RTL, mobile 360px, expired/inactive flows.

## 9. Files to Touch (implementation plan input)

Student:
- NEW `src/lib/coupons/coupons.ts`, `src/features/courses/components/coupon-input.tsx`, tests.
- EDIT `course-purchase-panel.tsx`, `checkout-confirmation.tsx`, `course-detail.tsx`, `app/api/student/payments/checkout/route.ts`, `src/messages/ar.json|en.json`.

Admin:
- NEW `app/[locale]/(admin)/admin/coupons/page.tsx`, `src/features/coupons/{schema,store,hooks,components}/*`, tests.
- EDIT `sidebar.tsx`, `mobile-bottom-nav.tsx`, `src/i18n/messages/ar.json|en.json`.

## 10. Self-Review

- No TBD/TODO; numbers concrete (seeds, regex, keys).
- Consistent: percentage+fixed + simple rules (expiry/uses/toggle) everywhere; no course-scoping (deferred).
- Scope: single spec covering two apps is justified (shared contract); implementation can be two parallel workstreams.
- Unambiguous: discount math, error codes, storage keys, swap path all explicit.
