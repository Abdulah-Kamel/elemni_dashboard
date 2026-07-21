"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/features/auth/actions";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/features/auth/state";
import { AuthError } from "@/features/auth/components/auth-error";
import { AuthField } from "@/features/auth/components/auth-field";

type ResetPasswordFormProps = {
  locale: string;
  token: string;
};

export function ResetPasswordForm({ locale, token }: ResetPasswordFormProps) {
  const t = useTranslations("reset_password");
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />

      <AuthField
        id="reset-password"
        name="new_password"
        type="password"
        autoComplete="new-password"
        required
        hint={t("password_hint")}
        error={state.error?.fields?.includes("new_password")}
        label={t("new_password")}
      />

      <AuthField
        id="reset-password-confirm"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
        error={state.error?.fields?.includes("confirm_password")}
        label={t("confirm_password")}
      />

      <AuthError state={state} />

      <SubmitButton label={t("button")} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? "…" : label}
    </Button>
  );
}
