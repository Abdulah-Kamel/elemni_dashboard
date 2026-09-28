/** Formats an amount exactly as the API sent it; no arithmetic. */
export function formatAmount(amount: number, currency: string, locale: string) {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency || "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  try {
    return new Intl.NumberFormat(locale, options).format(amount)
  } catch {
    return new Intl.NumberFormat(locale, { ...options, currency: "EGP" }).format(amount)
  }
}
