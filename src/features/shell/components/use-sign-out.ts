"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"

const ERROR_KEYS: Record<string, string> = {
  Unauthorized: "error_unauthorized",
  Forbidden: "error_forbidden",
  NotFound: "error_not_found",
  Validation: "error_validation",
  RateLimited: "error_rate_limited",
  Conflict: "error_conflict",
}

function errorKey(type: unknown): string {
  return (typeof type === "string" && ERROR_KEYS[type]) || "error_upstream"
}

/** Signs out through the BFF route and returns to sign-in; errors are localized. */
export function useSignOut() {
  const tError = useTranslations("placeholder")
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const signOut = async () => {
    setError(null)
    setPending(true)
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      })
      const data = await res.json()
      if (data.ok) {
        router.replace("/sign-in")
      } else {
        setError(tError(errorKey(data.error?.type)))
      }
    } catch {
      setError(tError("error_upstream"))
    } finally {
      setPending(false)
    }
  }

  return { signOut, pending, error }
}
