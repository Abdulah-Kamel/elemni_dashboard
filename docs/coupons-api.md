# Coupons — backend work needed

Coupons are money rules, so the backend must own them end to end. Today both
frontends only have a local mock:

- The **admin dashboard** saved coupons in the admin's own browser
  (localStorage). No student, other admin or other device could ever see them.
- The **student app** checked codes in the browser against hardcoded seeds,
  showed a discounted price, and sent `coupon_code` to checkout — but the
  backend ignores it, so the student was charged the full price after seeing a
  discount.

Both apps are now coded against the endpoints below. In production they call
the API; the old mock only runs with the development flag
`NEXT_PUBLIC_COUPONS_DEMO=1` (or `NEXT_PUBLIC_COURSE_TESTS_DEMO=1`).

## Why this has to live in the backend

1. **Price integrity.** Anything computed in the browser can be edited in dev
   tools. The discount and final price must be computed by the server, and the
   Kashier checkout amount must use the server's number.
2. **Shared state.** Coupons created by an admin must be visible to every
   student on every device.
3. **Usage limits.** `max_uses` and per-student limits need an atomic counter
   across all students; a browser can't count other people's redemptions.
   Increment only when the payment succeeds (Kashier webhook), not when a code
   is typed.
4. **Trusted time.** Expiry must use the server clock, not the student's.
5. **Audit & reporting.** Who redeemed what, for which course, and how much
   discount was given — needed for teacher payouts and commission, which must
   be calculated on the discounted amount.

## Data model

`Coupon`: `code` (unique, `^[A-Z0-9_-]{3,20}$`, stored upper-case),
`type` (`percentage` | `fixed`), `value` (percentage 1–100, or an amount in
EGP), `currency`, `is_active`, `starts_at`, `expires_at`, `max_uses`,
`max_uses_per_student`, `used_count`, `min_price`, `applies_to`
(`all` | `courses` | `teachers`), `course_ids`, `teacher_ids`, `description`,
`created_by`, `created_at`.

`CouponRedemption`: `coupon_code`, `student_id`, `course_id`, `enrollment_id`,
`original_price`, `discount_amount`, `final_price`, `redeemed_at`
(written when the payment completes).

Rules: fixed discounts never exceed the price; the final price never goes
below 0 (a 100% coupon makes the course free → same flow as free courses);
round money consistently with the rest of payments.

## Student endpoints

### `POST /api/v1/coupons/validate` (authenticated student)
Request `{ "code": "SAVE20", "course_id": 12 }`

Response (always 200 for a well-formed request):
```json
{ "valid": true, "code": "SAVE20", "original_price": "200.00",
  "discount_amount": "40.00", "final_price": "160.00", "currency": "EGP",
  "error_code": null }
```
When invalid: `valid: false` and `error_code` one of `NOT_FOUND`, `INACTIVE`,
`EXPIRED`, `EXHAUSTED`, `NOT_APPLICABLE`, `ALREADY_USED`, `MIN_PRICE`.
Money as decimal strings. Rate-limit this endpoint (code guessing).

### `POST /api/v1/payments/checkout` (existing)
Already receives `coupon_code`. It must re-validate the coupon, create the
Kashier order with the **discounted** amount, store the quote on the pending
enrollment, and record the redemption when the payment webhook confirms it.
If the coupon became invalid in between, return 409 with a `detail` message
(the UI shows it and lets the student retry without the coupon).

## Admin endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/coupons?q=&status=&sort_by=&sort_order=&skip=&limit=` | `{ items: Coupon[], total }`; `status` is server-computed: `active`, `inactive`, `expired`, `exhausted`, `scheduled` |
| GET | `/api/v1/admin/coupons/stats` | `{ active, expiring_soon, exhausted, total_redemptions, total_discount_given }` |
| POST | `/api/v1/admin/coupons` | create; 409 on duplicate code |
| PATCH | `/api/v1/admin/coupons/{code}` | edit; changing `type`/`value` after redemptions should be rejected or versioned |
| POST | `/api/v1/admin/coupons/{code}/toggle` | activate / deactivate |
| DELETE | `/api/v1/admin/coupons/{code}` | only when `used_count = 0`, else 409 (deactivate instead) |
| GET | `/api/v1/admin/coupons/{code}/redemptions?skip=&limit=` | `{ items: [{ student_name, course_title, discount_amount, final_price, redeemed_at }], total }` |

## Later (optional)
Teacher-owned coupons (scoped to the teacher's courses), bulk code generation
for campaigns, and first-purchase-only coupons.
