import { describe, it, expect, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { ItemAttachmentsPicker } from "../components/item-attachments-picker"
import type { AttachmentUploadStatus } from "../components/item-attachments-picker"

function renderPicker(
  overrides: Partial<React.ComponentProps<typeof ItemAttachmentsPicker>> = {}
) {
  const defaults = {
    videoFile: null,
    documentFile: null,
    videoStatus: "idle" as AttachmentUploadStatus,
    documentStatus: "idle" as AttachmentUploadStatus,
    videoProgress: 0,
    disabled: false,
    error: null,
    onFilesSelect: vi.fn(),
    onRemove: vi.fn(),
  }
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ItemAttachmentsPicker {...defaults} {...overrides} />
    </NextIntlClientProvider>
  )
}

describe("ItemAttachmentsPicker", () => {
  it("uses one multi-file input for video and PDF", () => {
    const { container } = renderPicker()
    const input = container.querySelector(
      "#create-item-attachments"
    ) as HTMLInputElement

    expect(input).not.toBeNull()
    expect(input.multiple).toBe(true)
    expect(input.accept).toBe("video/*,.pdf,application/pdf")
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1)
  })

  it("passes every selected file to the parent", () => {
    const onFilesSelect = vi.fn()
    const { container } = renderPicker({ onFilesSelect })
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

    fireEvent.change(container.querySelector("#create-item-attachments")!, {
      target: { files: [video, pdf] },
    })

    expect(onFilesSelect).toHaveBeenCalledWith([video, pdf])
  })

  it("resets the input value after change so the same files can be re-selected", () => {
    const { container } = renderPicker()
    const input = container.querySelector(
      "#create-item-attachments"
    ) as HTMLInputElement
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })

    fireEvent.change(input, { target: { files: [video] } })

    expect(input.value).toBe("")
  })

  it("calls onRemove with video when clicking the video remove button", () => {
    const onRemove = vi.fn()
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    renderPicker({ videoFile: video, onRemove })

    fireEvent.click(screen.getByRole("button", { name: /delete video/i }))

    expect(onRemove).toHaveBeenCalledWith("video")
  })

  it("calls onRemove with document when clicking the document remove button", () => {
    const onRemove = vi.fn()
    const doc = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    renderPicker({ documentFile: doc, onRemove })

    fireEvent.click(screen.getByRole("button", { name: /delete document/i }))

    expect(onRemove).toHaveBeenCalledWith("document")
  })

  it("shows the video filename when a video file is selected", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    renderPicker({ videoFile: video })

    expect(screen.getByText("lesson.mp4")).toBeDefined()
  })

  it("shows the document filename when a document file is selected", () => {
    const doc = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    renderPicker({ documentFile: doc })

    expect(screen.getByText("notes.pdf")).toBeDefined()
  })

  it("does not show a video row when no video file is selected", () => {
    renderPicker()

    expect(screen.queryByRole("button", { name: /delete video/i })).toBeNull()
  })

  it("does not show a document row when no document file is selected", () => {
    renderPicker()

    expect(
      screen.queryByRole("button", { name: /delete document/i })
    ).toBeNull()
  })

  it("shows Uploaded label when video status is uploaded", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    renderPicker({ videoFile: video, videoStatus: "uploaded" })

    expect(screen.getByText("Uploaded")).toBeDefined()
  })

  it("shows Failed label when document status is failed", () => {
    const doc = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    renderPicker({ documentFile: doc, documentStatus: "failed" })

    expect(screen.getByText("Failed")).toBeDefined()
  })

  it("does not show a remove button for an uploaded video", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    renderPicker({ videoFile: video, videoStatus: "uploaded" })

    expect(
      screen.queryByRole("button", { name: /delete video/i })
    ).toBeNull()
  })

  it("does not show a remove button when the picker is disabled", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    const doc = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    renderPicker({
      videoFile: video,
      documentFile: doc,
      disabled: true,
    })

    expect(
      screen.queryByRole("button", { name: /delete video/i })
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: /delete document/i })
    ).toBeNull()
  })

  it("shows an inline error when error prop is set", () => {
    renderPicker({ error: "Too many attachments" })

    expect(screen.getByText("Too many attachments")).toBeDefined()
  })

  it("applies aria-disabled on the browse region when disabled", () => {
    const { container } = renderPicker({ disabled: true })
    const region = container.querySelector('[role="button"]') as HTMLElement

    expect(region.getAttribute("aria-disabled")).toBe("true")
  })

  it("shows video progress while uploading", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    renderPicker({
      videoFile: video,
      videoStatus: "uploading",
      videoProgress: 42,
    })

    expect(screen.getByText("42%")).toBeDefined()
  })

  it("hides the browse region from assistive tech when disabled", () => {
    const { container } = renderPicker({ disabled: true })
    const region = container.querySelector('[role="button"]') as HTMLElement

    expect(region.tabIndex).toBe(-1)
  })

  it("opens file dialog on Enter keydown", () => {
    const { container } = renderPicker()
    const region = container.querySelector('[role="button"]') as HTMLElement
    const input = container.querySelector(
      "#create-item-attachments"
    ) as HTMLInputElement
    const spy = vi.spyOn(input, "click")

    fireEvent.keyDown(region, { key: "Enter" })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("opens file dialog on Space keydown", () => {
    const { container } = renderPicker()
    const region = container.querySelector('[role="button"]') as HTMLElement
    const input = container.querySelector(
      "#create-item-attachments"
    ) as HTMLInputElement
    const spy = vi.spyOn(input, "click")

    fireEvent.keyDown(region, { key: " " })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("does not open file dialog on unrelated key", () => {
    const { container } = renderPicker()
    const region = container.querySelector('[role="button"]') as HTMLElement
    const input = container.querySelector(
      "#create-item-attachments"
    ) as HTMLInputElement
    const spy = vi.spyOn(input, "click")

    fireEvent.keyDown(region, { key: "Tab" })

    expect(spy).not.toHaveBeenCalled()
  })

  it("is focusable and lacks aria-disabled when enabled", () => {
    const { container } = renderPicker({ disabled: false })
    const region = container.querySelector('[role="button"]') as HTMLElement

    expect(region.tabIndex).toBe(0)
    expect(region.getAttribute("aria-disabled")).toBeNull()
  })

  it("forwards drop events to onFilesSelect", () => {
    const onFilesSelect = vi.fn()
    const { container } = renderPicker({ onFilesSelect })
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })

    const region = container.querySelector('[role="button"]')!
    fireEvent.drop(region, {
      dataTransfer: { files: [video] },
    })

    expect(onFilesSelect).toHaveBeenCalledWith([video])
  })
})
