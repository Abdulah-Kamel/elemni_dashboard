"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { signUpAction } from "@/features/auth/actions";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/features/auth/state";
import { AuthError } from "@/features/auth/components/auth-error";
import { AuthField } from "@/features/auth/components/auth-field";

type SignUpFormProps = {
  locale: string;
};

export function SignUpForm({ locale }: SignUpFormProps) {
  const t = useTranslations("sign_up");
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signUpAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <AuthField
        id="sign-up-name"
        name="name"
        autoComplete="name"
        required
        error={state.error?.fields?.includes("name")}
        label={t("name")}
      />

      <AuthField
        id="sign-up-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
        error={state.error?.fields?.includes("email")}
        label={t("email")}
      />

      <AuthField
        id="sign-up-phone"
        name="phone_number"
        type="tel"
        autoComplete="tel"
        required
        inputMode="tel"
        placeholder="+201000000000"
        error={state.error?.fields?.includes("phone_number")}
        label={t("phone")}
      />

      <AuthField
        id="sign-up-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint={t("password_hint")}
        error={state.error?.fields?.includes("password")}
        label={t("password")}
      />

      <AuthField
        id="sign-up-password-confirm"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
        error={state.error?.fields?.includes("confirm_password")}
        label={t("confirm_password")}
      />

      <AuthError state={state} />

      <SubmitButton label={t("button")} />

      <p className="text-center text-label-sm text-label-sm--line-height text-on-surface-muted">
        {t("have_account")}{" "}
        <Link
          href={"/sign-in" as never}
          className="font-semibold text-primary hover:underline"
        >
          {t("sign_in_link")}
        </Link>
      </p>
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
