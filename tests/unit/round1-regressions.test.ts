import { describe, expect, it } from "vitest"
import ar from "@/i18n/messages/ar.json"
import en from "@/i18n/messages/en.json"
import { ApiErrorImpl } from "@/lib/api/errors"
import { isApiNotFound, parsePositiveRouteId, sanitizeNextPath } from "@/lib/routes"
import { lessonCreateSchema } from "@/features/course-management/lessons-schema"
import { titleValidationError } from "@/features/course-management/title-validation"
import { displayPosition } from "@/features/course-management/display-position"

describe("round-one regression helpers", () => {
  it("maps typed API NotFound and parses positive route ids", () => {
    const notFound = new ApiErrorImpl({ type: "NotFound", status: 404, message: "missing" })
    expect(isApiNotFound(notFound)).toBe(true)
    expect(isApiNotFound(new Error("missing"))).toBe(false)
    expect(parsePositiveRouteId("99999")).toBe(99999)
    expect(parsePositiveRouteId("abc")).toBeNull()
    expect(parsePositiveRouteId("0")).toBeNull()
  })

  it("returns a localized title_too_long validation result without throwing", () => {
    const parsed = lessonCreateSchema.safeParse({ title: "x".repeat(250) })
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const result = titleValidationError("ar", parsed.error.issues)
    expect(result.success).toBe(false)
    expect(result.error).toMatchObject({ type: "Validation", code: "title_too_long" })
    expect(result.error.message).toContain("200")
  })

  it("renders curriculum positions as one-based numbers", () => {
    expect(displayPosition(0)).toBe(1)
    expect(displayPosition(1)).toBe(2)
  })

  it("keeps auth upstream errors translated in both locales", () => {
    expect(ar.auth.error_upstream).toBeTruthy()
    expect(en.auth.error_upstream).toBeTruthy()
  })

  it("accepts only locale-relative next paths", () => {
    expect(sanitizeNextPath("ar", "/ar/courses/6?x=1")).toBe("/ar/courses/6?x=1")
    expect(sanitizeNextPath("ar", "//evil.com")).toBeNull()
    expect(sanitizeNextPath("ar", "https://evil.com")).toBeNull()
    expect(sanitizeNextPath("ar", "/\\evil")).toBeNull()
  })
})
