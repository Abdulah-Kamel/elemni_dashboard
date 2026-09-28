"use client"
export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return <html lang="ar"><body><main dir="rtl" className="mx-auto flex min-h-dvh max-w-[40rem] flex-col items-center justify-center gap-4 px-6 text-center"><h1>حدث خطأ / Something went wrong</h1><p>تعذر تحميل الصفحة. حاول مرة أخرى. / The page could not be loaded. Please try again.</p><button type="button" onClick={unstable_retry}>إعادة المحاولة / Retry</button></main></body></html>
}
