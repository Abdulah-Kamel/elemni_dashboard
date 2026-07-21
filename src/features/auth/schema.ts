import { z } from "zod";

/**
 * Form-level schemas for the auth flows. These are intentionally lighter
 * than the API contracts (openapi.json) — they only enforce what the UI
 * needs for "fast feedback" before the server has the final say.
 *
 * Article X: the API re-validates everything. A passing client-side parse
 * does NOT grant access. It just keeps the user from seeing a server
 * 422 for a missing field they typed.
 */

export const signInFormSchema = z.object({
  email: z.string().min(1, "email_required").email("email_invalid"),
  password: z.string().min(1, "password_required"),
});
export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z
  .object({
    name: z.string().min(1, "name_required").max(100, "name_too_long"),
    email: z.string().min(1, "email_required").email("email_invalid"),
    phone_number: z.string().min(1, "phone_required").max(20, "phone_too_long"),
    password: z.string().min(8, "password_too_short"),
    confirm_password: z.string().min(1, "password_required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "passwords_mismatch",
    path: ["confirm_password"],
  });
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().min(1, "email_required").email("email_invalid"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    token: z.string().min(1, "token_missing"),
    new_password: z.string().min(8, "password_too_short"),
    confirm_password: z.string().min(1, "password_required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "passwords_mismatch",
    path: ["confirm_password"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
