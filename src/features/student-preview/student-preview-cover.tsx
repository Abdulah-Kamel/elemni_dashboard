"use client"
/* eslint-disable @next/next/no-img-element -- dashboard previews support local object URLs */

import { useState } from "react"
import { getSubjectArt } from "./subject-art"

export function StudentPreviewCover({
  src,
  subject,
  alt,
}: {
  src: string | null
  subject: string | null
  alt: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const { Icon, tone } = getSubjectArt(subject)
  return src && src !== failedSrc ? (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 flex items-center justify-center ${tone}`}
    >
      <Icon className="size-12" strokeWidth={1.5} aria-hidden="true" />
    </div>
  )
}
