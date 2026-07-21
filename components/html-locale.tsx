"use client";

import { useEffect } from "react";

export function HtmlLocale({
  locale,
  isRtl,
  fontVar,
}: {
  locale: string
  isRtl: boolean
  fontVar: string
}) {
  useEffect(() => {
    const root = document.documentElement;
    const themeClasses = Array.from(root.classList).filter(
      (c) => c === "dark" || c === "light",
    );
    root.lang = locale;
    root.dir = isRtl ? "rtl" : "ltr";
    root.className = `antialiased font-sans ${fontVar} ${themeClasses.join(" ")}`.trim();
  }, [locale, isRtl, fontVar]);

  return null;
}
