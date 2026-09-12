// src/features/coupons/schema.ts
import { z } from "zod";
export const couponCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, "invalid_code");
function percentageRangeRefine(c: { type: string; value: number }, ctx: z.RefinementCtx) {
  if (c.type === "percentage" && (c.value < 1 || c.value > 100))
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "percentage_1_100" });
}
// NOTE: zod v4 forbids .omit() on schemas with refinements, so create/update
// derive from the unrefined base; the percentage 1-100 rule is applied to both.
const couponBaseSchema = z.object({
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
});
export const couponSchema = couponBaseSchema.superRefine(percentageRangeRefine);
const createCouponBaseSchema = couponBaseSchema.omit({ usedCount: true, createdAt: true, currency: true });
export const createCouponSchema = createCouponBaseSchema.superRefine(percentageRangeRefine);
export const updateCouponSchema = createCouponBaseSchema.partial().extend({ code: couponCodeSchema });
export type Coupon = z.infer<typeof couponSchema>;
export type CouponStatus = "active" | "inactive" | "expired" | "exhausted";
