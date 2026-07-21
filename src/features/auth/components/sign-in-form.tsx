"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { signInAction } from "@/features/auth/actions";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/features/auth/state";
import { AuthError } from "@/features/auth/components/auth-error";
import { AuthField } from "@/features/auth/components/auth-field";

type SignInFormProps = {
  locale: string;
  next?: string;
  /** When true, the user just registered or reset their password — fire a toast. */
  notice?: "registered" | "reset" | "role";
};

export function SignInForm({ locale, next, notice }: SignInFormProps) {
  const t = useTranslations("sign_in");
  const tAuth = useTranslations("auth");
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signInAction,
    INITIAL_AUTH_STATE,
  );

  // Surface transient notices (role mismatch, just-registered, just-reset)
  // via a toast rather than an inline banner — they're one-time messages
  // that don't belong to the form's action state.
  useEffect(() => {
    if (!notice) return;
    const messageKey = `notice_${notice}`;
    const message = tAuth(messageKey);
    if (notice === "role") {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }, [notice, tAuth]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      <AuthField
        id="sign-in-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
        error={state.error?.fields?.includes("email")}
        label={t("email")}
      />

      <AuthField
        id="sign-in-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.error?.fields?.includes("password")}
        label={t("password")}
      />

      <div className="flex items-center justify-end">
        <Link
          href={"/forgot-password" as never}
          className="text-label-md text-label-md--line-height font-medium text-primary hover:underline"
        >
          {t("forgot_password")}
        </Link>
      </div>

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