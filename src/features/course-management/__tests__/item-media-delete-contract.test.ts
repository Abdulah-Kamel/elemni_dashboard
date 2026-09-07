import { describe, expect, it } from "vitest"
import { endpoints } from "@/lib/api/endpoints"

describe("item media deletion routes", () => {
  it("targets video and document assets independently", () => {
    expect(endpoints.courses.items.deleteVideo(101, 202, 303)).toBe(
      "/api/v1/courses/101/lessons/202/items/303/video"
    )
    expect(endpoints.courses.items.deleteDocument(101, 202, 303)).toBe(
      "/api/v1/courses/101/lessons/202/items/303/document"
    )
  })
})
