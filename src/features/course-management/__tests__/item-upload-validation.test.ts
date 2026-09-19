import { describe, expect, it } from "vitest"
import {
  validateItemUploadFile,
  mergeItemAttachmentFiles,
  getItemAttachmentType,
  type ItemAttachmentSelection,
} from "../item-upload-validation"

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

describe("getItemAttachmentType", () => {
  it("returns video for video MIME types", () => {
    expect(
      getItemAttachmentType(new File(["v"], "a.mp4", { type: "video/mp4" }))
    ).toBe("video")
  })

  it("returns document for application/pdf", () => {
    expect(
      getItemAttachmentType(
        new File(["p"], "a.pdf", { type: "application/pdf" })
      )
    ).toBe("document")
  })

  it("returns document for .pdf extension without MIME", () => {
    expect(getItemAttachmentType(new File(["p"], "a.pdf"))).toBe("document")
  })

  it("returns null for unsupported files", () => {
    expect(
      getItemAttachmentType(new File(["t"], "a.txt", { type: "text/plain" }))
    ).toBeNull()
  })
})

describe("mergeItemAttachmentFiles", () => {
  const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
  const secondVideo = new File(["video"], "lesson-2.mp4", { type: "video/mp4" })
  const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
  const secondPdf = new File(["pdf"], "worksheet.pdf", {
    type: "application/pdf",
  })
  const empty: ItemAttachmentSelection = { videoFile: null, documentFile: null }

  it("accepts one video and one PDF in one selection", () => {
    expect(mergeItemAttachmentFiles(empty, [video, pdf])).toEqual({
      selection: { videoFile: video, documentFile: pdf },
      error: null,
    })
  })

  it("adds a missing type without discarding the current type", () => {
    expect(
      mergeItemAttachmentFiles({ videoFile: video, documentFile: null }, [pdf])
    ).toEqual({
      selection: { videoFile: video, documentFile: pdf },
      error: null,
    })
  })

  it("replaces only the newly selected type", () => {
    expect(
      mergeItemAttachmentFiles(
        { videoFile: video, documentFile: pdf },
        [secondVideo]
      )
    ).toEqual({
      selection: { videoFile: secondVideo, documentFile: pdf },
      error: null,
    })
  })

  it.each([
    [[video, secondVideo], "duplicate_video"],
    [[pdf, secondPdf], "duplicate_document"],
    [[video, pdf, secondPdf], "too_many_attachments"],
  ] as const)("rejects invalid combinations atomically", (files, error) => {
    const current = { videoFile: video, documentFile: pdf }
    expect(mergeItemAttachmentFiles(current, [...files])).toEqual({
      selection: current,
      error,
    })
  })

  it("returns current unchanged for empty selection", () => {
    const current: ItemAttachmentSelection = {
      videoFile: video,
      documentFile: pdf,
    }
    expect(mergeItemAttachmentFiles(current, [])).toEqual({
      selection: current,
      error: null,
    })
  })

  it("rejects unsupported files with unsupported_attachment", () => {
    const txt = new File(["t"], "notes.txt", { type: "text/plain" })
    expect(mergeItemAttachmentFiles(empty, [txt])).toEqual({
      selection: empty,
      error: "unsupported_attachment",
    })
  })

  it("preserves current on any error path", () => {
    const current: ItemAttachmentSelection = {
      videoFile: video,
      documentFile: pdf,
    }
    const txt = new File(["t"], "notes.txt", { type: "text/plain" })
    const result = mergeItemAttachmentFiles(current, [txt])
    expect(result.error).toBeTruthy()
    expect(result.selection).toBe(current)
  })

  it("rejects oversized video without mutating current", () => {
    const current: ItemAttachmentSelection = {
      videoFile: video,
      documentFile: pdf,
    }
    const large = new File(["v"], "large.mp4", { type: "video/mp4" })
    Object.defineProperty(large, "size", {
      value: 500 * 1024 * 1024 + 1,
    })
    expect(mergeItemAttachmentFiles(current, [large])).toEqual({
      selection: current,
      error: "video_too_large",
    })
  })
})
