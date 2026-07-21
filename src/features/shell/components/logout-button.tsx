"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  labelClassName?: string;
  showIcon?: boolean;
  variant?: "menu" | "sidebar";
  onDone?: () => void;
};

export function LogoutButton({
  className,
  labelClassName,
  showIcon = true,
  variant = "menu",
  onDone,
}: LogoutButtonProps) {
  const t = useTranslations("topbar");
  const tError = useTranslations("placeholder");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();

      if (data.ok) {
        onDone?.();
        router.replace("/sign-in");
      } else {
        const errorType = data.error?.type ?? "Upstream";
        setError(tError(`error_${errorType.toLowerCase()}`));
      }
    } catch {
      setError(tError("error_upstream"));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label={t("sign_out")}
        className={cn(
          "gap-3",
          variant === "sidebar" &&
            "rounded-lg px-sm py-2 text-body-md text-body-md--line-height font-medium text-error hover:bg-error-tint",
          variant === "menu" && "w-full justify-start px-md py-3 text-body-md text-error hover:bg-error-tint",
          className,
        )}
      >
        {showIcon && (
          <LogOut
            className={cn(
              "shrink-0 rtl:rotate-180",
              variant === "sidebar" ? "size-5" : "size-4",
            )}
            aria-hidden="true"
          />
        )}
        <span className={labelClassName}>{t("sign_out")}</span>
      </Button>
      {error && (
        <p className="mt-1 text-label-sm text-label-sm--line-height text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
