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

function getFileInput(id: string) {
  return document.getElementById(id) as HTMLInputElement
}

describe("CreateItemDialog", () => {
  it("submits one payload containing both selected files", () => {
    const onSubmit = vi.fn()
    renderDialog({ onSubmit })

    fireEvent.change(getTitleInput(), {
      target: { value: "Lesson resources" },
    })
    fireEvent.click(getNextButton())

    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    const doc = new File(["pdf"], "notes.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [video] },
    })
    fireEvent.change(getFileInput("create-item-document"), {
      target: { files: [doc] },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Create item with 2 files" })
    )

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Lesson resources",
      videoFile: video,
      documentFile: doc,
    })
  })

  it("requires at least one attachment", () => {
    renderDialog()
    fireEvent.change(getTitleInput(), {
      target: { value: "Empty item" },
    })
    fireEvent.click(getNextButton())

    const createBtn = screen.getByRole("button", { name: "Create item" }) as HTMLButtonElement
    expect(createBtn.disabled).toBe(true)
    expect(screen.getByText("Add at least one video or PDF.")).toBeDefined()
  })

  it("does not dismiss while an upload is active", () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange, uploading: true })

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("submits with only a video when no document selected", () => {
    const onSubmit = vi.fn()
    renderDialog({ onSubmit })

    fireEvent.change(getTitleInput(), {
      target: { value: "Video only" },
    })
    fireEvent.click(getNextButton())

    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [video] },
    })
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

    fireEvent.change(getTitleInput(), {
      target: { value: "Doc only" },
    })
    fireEvent.click(getNextButton())

    const docFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    fireEvent.change(getFileInput("create-item-document"), {
      target: { files: [docFile] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Doc only",
      videoFile: null,
      documentFile: docFile,
    })
  })

  it("shows error for invalid video type", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Bad video" },
    })
    fireEvent.click(getNextButton())

    const badFile = new File(["text"], "readme.txt", { type: "text/plain" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [badFile] },
    })

    expect(screen.getByText("Choose a valid video file.")).toBeDefined()
  })

  it("shows error for invalid document type", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Bad doc" },
    })
    fireEvent.click(getNextButton())

    const badFile = new File(["img"], "page.png", { type: "image/png" })
    fireEvent.change(getFileInput("create-item-document"), {
      target: { files: [badFile] },
    })

    expect(screen.getByText("Choose a valid PDF document.")).toBeDefined()
  })

  it("shows Uploaded label when video status is uploaded", () => {
    renderDialog({ videoStatus: "uploaded" })
    fireEvent.change(getTitleInput(), {
      target: { value: "Has video" },
    })
    fireEvent.click(getNextButton())

    expect(screen.getByText("Uploaded")).toBeDefined()
  })

  it("shows Failed label when document status is failed", () => {
    renderDialog({ documentStatus: "failed" })
    fireEvent.change(getTitleInput(), {
      target: { value: "Failed doc" },
    })
    fireEvent.click(getNextButton())

    expect(screen.getByText("Failed")).toBeDefined()
  })

  it("shows Retry PDF when only document status is failed", () => {
    renderDialog({ documentStatus: "failed" })
    fireEvent.change(getTitleInput(), {
      target: { value: "Retry doc" },
    })
    fireEvent.click(getNextButton())

    expect(
      screen.getByRole("button", { name: "Retry PDF" })
    ).toBeDefined()
  })

  it("shows Retry video when only video status is failed", () => {
    renderDialog({ videoStatus: "failed" })
    fireEvent.change(getTitleInput(), {
      target: { value: "Retry vid" },
    })
    fireEvent.click(getNextButton())

    expect(
      screen.getByRole("button", { name: "Retry video" })
    ).toBeDefined()
  })

  it("shows Retry failed uploads when both statuses are failed", () => {
    renderDialog({ videoStatus: "failed", documentStatus: "failed" })
    fireEvent.change(getTitleInput(), {
      target: { value: "All failed" },
    })
    fireEvent.click(getNextButton())

    expect(
      screen.getByRole("button", { name: "Retry failed uploads" })
    ).toBeDefined()
  })

  it("replaces filename when a new valid file is selected", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Replace" },
    })
    fireEvent.click(getNextButton())

    const first = new File(["v1"], "first.mp4", { type: "video/mp4" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [first] },
    })

    expect(screen.getByText("first.mp4")).toBeDefined()

    const second = new File(["v2"], "second.mp4", { type: "video/mp4" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [second] },
    })

    expect(screen.getByText("second.mp4")).toBeDefined()
    expect(screen.queryByText("first.mp4")).toBeNull()
  })

  it("shows Optional when no attachment is selected", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "No files" },
    })
    fireEvent.click(getNextButton())

    const optionals = screen.getAllByText("Optional")
    expect(optionals.length).toBe(2)
  })

  it("shows Selected when a video file is picked", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Has video" },
    })
    fireEvent.click(getNextButton())

    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [video] },
    })

    expect(screen.getByText("Selected")).toBeDefined()
    expect(screen.getAllByText("Optional").length).toBe(1)
  })

  it("shows Selected when a document file is picked", () => {
    renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Has doc" },
    })
    fireEvent.click(getNextButton())

    const doc = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
    fireEvent.change(getFileInput("create-item-document"), {
      target: { files: [doc] },
    })

    expect(screen.getByText("Selected")).toBeDefined()
    expect(screen.getAllByText("Optional").length).toBe(1)
  })

  it("resets state on programmatic close and reopen", () => {
    const { rerender } = renderDialog()

    fireEvent.change(getTitleInput(), {
      target: { value: "Stale title" },
    })
    fireEvent.click(getNextButton())

    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" })
    fireEvent.change(getFileInput("create-item-video"), {
      target: { files: [video] },
    })
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
