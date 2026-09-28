import { ApiErrorImpl } from "@/lib/api/errors"

export function parsePositiveRouteId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function isApiNotFound(error: unknown): boolean {
  return error instanceof ApiErrorImpl && error.type === "NotFound"
}

export function sanitizeNextPath(locale: string, value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\") || value.includes("\\")) return null
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null
  try {
    const url = new URL(value, "https://elemni.invalid")
    if (url.origin !== "https://elemni.invalid") return null
    if (!url.pathname.startsWith(`/${locale}/`) && url.pathname !== `/${locale}`) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
