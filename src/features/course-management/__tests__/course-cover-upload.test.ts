import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  courseImageUploadSchema,
  courseUpdateSchema,
} from "@/features/course-management/schema"

const requestUpload = vi.hoisted(() => vi.fn())

vi.mock("@/features/course-management/actions", () => ({
  requestCourseImageUpload: requestUpload,
}))

import { uploadCourseCover } from "@/features/course-management/upload-course-cover"

describe("course cover upload", () => {
  beforeEach(() => {
    requestUpload.mockReset()
    vi.restoreAllMocks()
  })

  it("parses the existing backend upload response", () => {
    expect(
      courseImageUploadSchema.parse({
        upload_url: "https://storage.example.test/signed",
        path: "courses/7",
      })
    ).toEqual({
      upload_url: "https://storage.example.test/signed",
      path: "courses/7",
    })
  })

  it("accepts a nullable image path in course updates", () => {
    expect(courseUpdateSchema.parse({ img: "courses/7" })).toEqual({
      img: "courses/7",
    })
    expect(courseUpdateSchema.parse({ img: null })).toEqual({ img: null })
  })

  it("uploads the file and returns the persisted image path", async () => {
    requestUpload.mockResolvedValue({
      success: true,
      data: {
        upload_url: "https://storage.example.test/signed",
        path: "courses/7",
      },
    })
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }))
    const file = new File(["cover"], "cover.webp", { type: "image/webp" })

    await expect(uploadCourseCover(7, file)).resolves.toBe("courses/7")
    expect(requestUpload).toHaveBeenCalledWith(7, file.name)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example.test/signed",
      expect.objectContaining({
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/webp" },
      })
    )
  })

  it("rejects a failed storage upload", async () => {
    requestUpload.mockResolvedValue({
      success: true,
      data: {
        upload_url: "https://storage.example.test/signed",
        path: "courses/7",
      },
    })
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 })
    )

    await expect(
      uploadCourseCover(
        7,
        new File(["cover"], "cover.png", { type: "image/png" })
      )
    ).rejects.toThrow("Course cover upload failed")
  })
})
