import { describe, expect, it } from "vitest"
import { validateItemUploadFile } from "../item-upload-validation"

describe("validateItemUploadFile", () => {
  it("accepts valid videos and PDFs", () => {
    expect(
      validateItemUploadFile(
        new File(["video"], "lesson.mp4", { type: "video/mp4" }),
        "video"
      )
    ).toBeNull()
    expect(
      validateItemUploadFile(
        new File(["pdf"], "notes.pdf", { type: "application/pdf" }),
        "document"
      )
    ).toBeNull()
  })

  it("rejects the wrong type for each attachment slot", () => {
    expect(
      validateItemUploadFile(
        new File(["text"], "notes.txt", { type: "text/plain" }),
        "video"
      )
    ).toBe("invalid_video")
    expect(
      validateItemUploadFile(
        new File(["image"], "page.png", { type: "image/png" }),
        "document"
      )
    ).toBe("invalid_document")
  })

  it("rejects videos larger than 500 MB", () => {
    const file = new File(["video"], "large.mp4", { type: "video/mp4" })
    Object.defineProperty(file, "size", { value: 500 * 1024 * 1024 + 1 })

    expect(validateItemUploadFile(file, "video")).toBe("video_too_large")
  })
})
