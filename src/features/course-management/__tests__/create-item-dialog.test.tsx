import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import {
  CreateItemDialog,
  type AttachmentUploadStatus,
} from "../components/create-item-dialog"

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof CreateItemDialog>> = {}
) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    uploading: false,
    videoStatus: "idle" as AttachmentUploadStatus,
    documentStatus: "idle" as AttachmentUploadStatus,
    videoProgress: 0,
    error: null,
  }
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CreateItemDialog {...defaults} {...overrides} />
    </NextIntlClientProvider>
  )
}

function getTitleInput() {
  return screen.getByRole("textbox", { name: "Item title" }) as HTMLInputElement
}

function getNextButton() {
  return screen.getByRole("button", { name: "Next" })
}

function goToAttachments(title: string) {
  fireEvent.change(getTitleInput(), { target: { value: title } })
  fireEvent.click(getNextButton())
}

function selectFiles(files: File[]) {
  fireEvent.change(document.getElementById("create-item-attachments")!, {
    target: { files },
  })
}

describe("CreateItemDialog", () => {
  it("submits one payload after selecting video and PDF together", () => {
    const onSubmit = vi.fn()
    renderDialog({ onSubmit })
    goToAttachments("Lesson resources")
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

    selectFiles([video, pdf])
    fireEvent.click(
      screen.getByRole("button", { name: "Create item with 2 files" })
    )

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Lesson resources",
      videoFile: video,
      documentFile: pdf,
    })
  })

  it("shows an error and preserves files when two videos are selected", () => {
    renderDialog()
    goToAttachments("Duplicate videos")
    const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    selectFiles([pdf])
    selectFiles([
      new File(["one"], "one.mp4", { type: "video/mp4" }),
      new File(["two"], "two.mp4", { type: "video/mp4" }),
    ])

    expect(screen.getByText("Choose only one video.")).toBeDefined()
    expect(screen.getByText("notes.pdf")).toBeDefined()
  })

  it("shows an error for two PDFs", () => {
    renderDialog()
    goToAttachments("Two PDFs")
    selectFiles([
      new File(["a"], "a.pdf", { type: "application/pdf" }),
      new File(["b"], "b.pdf", { type: "application/pdf" }),
    ])

    expect(screen.getByText("Choose only one PDF.")).toBeDefined()
  })

  it("shows an error for more than two files", () => {
    renderDialog()
    goToAttachments("Too many")
    selectFiles([
      new File(["v"], "v.mp4", { type: "video/mp4" }),
      new File(["a"], "a.pdf", { type: "application/pdf" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ])

    expect(screen.getByText("Choose no more than two files.")).toBeDefined()
  })

  it("shows an error for unsupported files", () => {
    renderDialog()
    goToAttachments("Bad file")
    selectFiles([
      new File(["t"], "readme.txt", { type: "text/plain" }),
    ])

    expect(screen.getByText("Choose a video or PDF file.")).toBeDefined()
  })

  it("submits with only a video when no document selected", () => {
    const onSubmit = vi.fn()
    renderDialog({ onSubmit })
    goToAttachments("Video only")

    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    selectFiles([video])
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Video only",
      videoFile: video,
      documentFile: null,
    })
  })

  it("submits with only a document when no video selected", () => {
    const onSubmit = vi.fn()
    renderDialog({ onSubmit })
    goToAttachments("Doc only")

    const docFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    selectFiles([docFile])
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Doc only",
      videoFile: null,
      documentFile: docFile,
    })
  })

  it("replaces only the video when a new video is selected incrementally", () => {
    renderDialog()
    goToAttachments("Incremental")

    const v1 = new File(["v1"], "first.mp4", { type: "video/mp4" })
    const pdf = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    selectFiles([v1, pdf])

    expect(screen.getByText("first.mp4")).toBeDefined()
    expect(screen.getByText("notes.pdf")).toBeDefined()

    const v2 = new File(["v2"], "second.mp4", { type: "video/mp4" })
    selectFiles([v2])

    expect(screen.getByText("second.mp4")).toBeDefined()
    expect(screen.getByText("notes.pdf")).toBeDefined()
    expect(screen.queryByText("first.mp4")).toBeNull()
  })

  it("replaces only the PDF when a new PDF is selected incrementally", () => {
    renderDialog()
    goToAttachments("Incremental PDF")

    const video = new File(["v"], "lesson.mp4", { type: "video/mp4" })
    const d1 = new File(["p1"], "old.pdf", { type: "application/pdf" })
    selectFiles([video, d1])

    expect(screen.getByText("old.pdf")).toBeDefined()

    const d2 = new File(["p2"], "new.pdf", { type: "application/pdf" })
    selectFiles([d2])

    expect(screen.getByText("new.pdf")).toBeDefined()
    expect(screen.getByText("lesson.mp4")).toBeDefined()
    expect(screen.queryByText("old.pdf")).toBeNull()
  })

  it("removes the video via picker", () => {
    renderDialog()
    goToAttachments("Remove video")

    const video = new File(["v"], "lesson.mp4", { type: "video/mp4" })
    selectFiles([video])
    expect(screen.getByText("lesson.mp4")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /delete video/i }))
    expect(screen.queryByText("lesson.mp4")).toBeNull()
  })

  it("removes the PDF via picker", () => {
    renderDialog()
    goToAttachments("Remove PDF")

    const pdf = new File(["p"], "notes.pdf", { type: "application/pdf" })
    selectFiles([pdf])
    expect(screen.getByText("notes.pdf")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /delete document/i }))
    expect(screen.queryByText("notes.pdf")).toBeNull()
  })

  it("does not allow replacing an already uploaded video", () => {
    renderDialog({ videoStatus: "uploaded" })
    goToAttachments("Locked video")

    const video = new File(["v"], "new.mp4", { type: "video/mp4" })
    selectFiles([video])

    expect(
      screen.getByText("The video is already uploaded and cannot be replaced here.")
    ).toBeDefined()
  })

  it("does not allow replacing an already uploaded PDF", () => {
    renderDialog({ documentStatus: "uploaded" })
    goToAttachments("Locked PDF")

    const pdf = new File(["p"], "new.pdf", { type: "application/pdf" })
    selectFiles([pdf])

    expect(
      screen.getByText("The PDF is already uploaded and cannot be replaced here.")
    ).toBeDefined()
  })

  it("does not dismiss while an upload is active", () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange, uploading: true })

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("shows Retry PDF when only document status is failed", () => {
    renderDialog({ documentStatus: "failed" })
    goToAttachments("Retry doc")

    expect(
      screen.getByRole("button", { name: "Retry PDF" })
    ).toBeDefined()
  })

  it("shows Retry video when only video status is failed", () => {
    renderDialog({ videoStatus: "failed" })
    goToAttachments("Retry vid")

    expect(
      screen.getByRole("button", { name: "Retry video" })
    ).toBeDefined()
  })

  it("shows Retry failed uploads when both statuses are failed", () => {
    renderDialog({ videoStatus: "failed", documentStatus: "failed" })
    goToAttachments("All failed")

    expect(
      screen.getByRole("button", { name: "Retry failed uploads" })
    ).toBeDefined()
  })

  it("resets state on programmatic close and reopen", () => {
    const { rerender } = renderDialog()

    goToAttachments("Stale title")
    const video = new File(["v"], "lesson.mp4", { type: "video/mp4" })
    selectFiles([video])
    expect(screen.getByText("lesson.mp4")).toBeDefined()

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CreateItemDialog
          open={false}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          uploading={false}
          videoStatus="idle"
          documentStatus="idle"
          videoProgress={0}
          error={null}
        />
      </NextIntlClientProvider>
    )

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CreateItemDialog
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          uploading={false}
          videoStatus="idle"
          documentStatus="idle"
          videoProgress={0}
          error={null}
        />
      </NextIntlClientProvider>
    )

    expect(getTitleInput().value).toBe("")
    expect(screen.queryByText("lesson.mp4")).toBeNull()
    expect(screen.getByRole("button", { name: "Next" })).toBeDefined()
  })
})
