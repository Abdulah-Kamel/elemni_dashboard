export function validateNextParam(next: string | undefined, locale: string): string {
  const fallback = `/${locale}/dashboard`;
  if (!next) return fallback;

  if (
    next.startsWith("http://") ||
    next.startsWith("https://") ||
    next.startsWith("//") ||
    next.startsWith("javascript:")
  ) {
    return fallback;
  }

  if (!next.startsWith("/")) return fallback;

  return next;
}