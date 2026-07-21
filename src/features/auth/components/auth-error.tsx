"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthFormState } from "@/features/auth/state";

type AuthErrorProps = {
  state: AuthFormState;
  className?: string;
};

export function AuthError({ state, className }: AuthErrorProps) {
  const t = useTranslations("auth");
  if (state.ok || !state.error) return null;
  const message = t(state.error.messageKey, { defaultValue: state.error.messageKey });
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
