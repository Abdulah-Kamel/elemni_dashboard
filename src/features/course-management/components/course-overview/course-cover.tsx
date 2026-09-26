"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

/** Calm, flat tints keyed by subject so a teacher's covers are tellable apart. */
const TINTS = [
  "bg-primary-tint text-primary",
  "bg-success-tint text-success",
  "bg-warning-tint text-warning",
  "bg-surface-strong text-on-surface-muted",
] as const

export function subjectTint(subjectId: number | null | undefined, fallbackSeed: string) {
  const seed =
    subjectId ?? [...fallbackSeed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return TINTS[Math.abs(seed) % TINTS.length]
}

/**
 * Real cover when the course has one, otherwise a subject-tinted tile with the
 * subject's first letter. The image is decorative next to the visible title.
 */
export function CourseCover({
  img,
  title,
  subjectId,
  subjectName,
  className,
  size = "card",
}: {
  img?: string | null
  title: string
  subjectId: number | null
  subjectName?: string | null
  className?: string
  size?: "card" | "thumb"
}) {
  const [failed, setFailed] = useState(false)
  const label = (subjectName ?? title).trim()
  const letter = label ? Array.from(label)[0] : ""

  return (
    <span className={cn("relative block overflow-hidden", className)}>
      {img && !failed ? (
        <Image
          src={img}
          alt={title}
          fill
          unoptimized
          sizes={size === "thumb" ? "48px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            subjectTint(subjectId, label)
          )}
        >
          <span
            className={cn(
              "font-heading font-bold opacity-80",
              size === "thumb" ? "text-base" : "text-4xl"
            )}
          >
            {letter}
          </span>
        </span>
      )}
    </span>
  )
}
