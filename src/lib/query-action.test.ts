import { describe, expect, it } from "vitest"
import { unwrapActionResult } from "@/lib/query-action"

describe("unwrapActionResult", () => {
  it("returns successful action data", () => {
    expect(unwrapActionResult({ success: true, data: { id: 1 } })).toEqual({
      id: 1,
    })
  })

  it("throws failed action results so query state becomes error", () => {
    expect(() =>
      unwrapActionResult({
        success: false,
        error: { type: "Conflict", message: "Record changed" },
      }),
    ).toThrow("Record changed")
  })
})
