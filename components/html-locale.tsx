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
  const dir = isRtl ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${locale}';document.documentElement.dir='${dir}';document.documentElement.className='${fontVar}'`,
      }}
    />
  );
}
