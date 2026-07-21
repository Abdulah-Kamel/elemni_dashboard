"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "@/features/auth/actions";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/features/auth/state";
import { AuthError } from "@/features/auth/components/auth-error";
import { AuthField } from "@/features/auth/components/auth-field";

type ForgotPasswordFormProps = {
  locale: string;
};

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("forgot_password");
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    INITIAL_AUTH_STATE,
  );

  if (state.ok) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <AlertDescription>
            {t("success")}
          </AlertDescription>
        </Alert>
        <Link
          href={"/sign-in" as never}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface text-body-md text-body-md--line-height font-semibold text-foreground transition-colors hover:bg-surface-strong"
        >
          {t("back_to_sign_in")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <AuthField
        id="forgot-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
        error={state.error?.fields?.includes("email")}
        label={t("email")}
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
