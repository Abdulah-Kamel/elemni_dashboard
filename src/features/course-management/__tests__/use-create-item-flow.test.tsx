import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { ItemOut } from "../items-schema"
import type { CreateItemPayload } from "../components/create-item-dialog"
import type { UseCreateItemFlowOptions } from "../hooks/use-create-item-flow"

const bareItem: ItemOut = {
  id: 3,
  lesson_id: 2,
  title: "Lesson resources",
  bunny_stream_id: null,
  bunny_stream_status: null,
  document_path: null,
  exam_id: null,
  order: 1,
}
const videoItem: ItemOut = {
  ...bareItem,
  bunny_stream_id: "video-guid",
  bunny_stream_status: "finished",
}
const completeItem: ItemOut = {
  ...videoItem,
  document_path: "courses/1/lessons/2/items/3.pdf",
}
const videoFile = new File(["video"], "lesson.mp4", { type: "video/mp4" })
const pdfFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })
const payloadWithBothFiles: CreateItemPayload = {
  title: "Lesson resources",
  videoFile,
  documentFile: pdfFile,
}
const videoCredentialsResult = {
  success: true as const,
  data: {
    video_id: "video-guid",
    library_id: 42,
    expiration_time: 2_000_000_000,
    signature: "signature",
    embed_url: "https://player.example.test/embed/42/video-guid",
  },
}
const documentUrlResult = {
  success: true as const,
  data: {
    upload_url: "https://storage.example.test/signed",
    key: "courses/1/lessons/2/items/3.pdf",
    public_url: "https://cdn.example.test/courses/1/lessons/2/items/3.pdf",
  },
}

const actions = vi.hoisted(() => ({
  requestVideoUpload: vi.fn(),
  confirmVideoUpload: vi.fn(),
  requestUploadUrl: vi.fn(),
  confirmUpload: vi.fn(),
}))

const uploads = vi.hoisted(() => ({
  uploadVideoToBunnyTus: vi.fn(),
  uploadToPresignedUrl: vi.fn(),
}))

vi.mock("@/features/course-management/items-actions", () => ({
  requestVideoUpload: (...args: unknown[]) => actions.requestVideoUpload(...args),
  confirmVideoUpload: (...args: unknown[]) => actions.confirmVideoUpload(...args),
  requestUploadUrl: (...args: unknown[]) => actions.requestUploadUrl(...args),
  confirmUpload: (...args: unknown[]) => actions.confirmUpload(...args),
}))

vi.mock("@/lib/tus-upload", () => ({
  uploadVideoToBunnyTus: (...args: unknown[]) => uploads.uploadVideoToBunnyTus(...args),
}))

vi.mock("@/lib/upload", () => ({
  uploadToPresignedUrl: (...args: unknown[]) => uploads.uploadToPresignedUrl(...args),
}))

import { useCreateItemFlow } from "../hooks/use-create-item-flow"

const createItem = vi.fn(async () => bareItem)
const onItemUpdated = vi.fn()
const onCurriculumCommitted = vi.fn()
const onComplete = vi.fn()

function flowOptions(
  overrides: Partial<UseCreateItemFlowOptions> = {}
): UseCreateItemFlowOptions {
  return {
    courseId: 1,
    lessonId: 2,
    createItem,
    onItemUpdated,
    onCurriculumCommitted,
    onComplete,
    uploadErrorMessage: "Upload failed",
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  createItem.mockResolvedValue(bareItem)
})

describe("useCreateItemFlow", () => {
  it("creates one item and uploads video before document", async () => {
    const calls: string[] = []
    createItem.mockImplementationOnce(async () => {
      calls.push("create")
      return bareItem
    })
    actions.requestVideoUpload.mockImplementation(async () => {
      calls.push("request-video")
      return videoCredentialsResult
    })
    uploads.uploadVideoToBunnyTus.mockImplementation(async () => {
      calls.push("upload-video")
    })
    actions.confirmVideoUpload.mockImplementation(async () => {
      calls.push("confirm-video")
      return { success: true, data: videoItem }
    })
    actions.requestUploadUrl.mockImplementation(async () => {
      calls.push("request-document")
      return documentUrlResult
    })
    uploads.uploadToPresignedUrl.mockImplementation(async () => {
      calls.push("upload-document")
      return { ok: true }
    })
    actions.confirmUpload.mockImplementation(async () => {
      calls.push("confirm-document")
      return { success: true, data: completeItem }
    })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(calls).toEqual([
      "create",
      "request-video",
      "upload-video",
      "confirm-video",
      "request-document",
      "upload-document",
      "confirm-document",
    ])
    expect(createItem).toHaveBeenCalledOnce()
    expect(result.current.videoStatus).toBe("uploaded")
    expect(result.current.documentStatus).toBe("uploaded")
  })

  it("keeps the item and video, then retries only the failed document", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })
    uploads.uploadToPresignedUrl
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(result.current.videoStatus).toBe("uploaded")
    expect(result.current.documentStatus).toBe("failed")
    expect(createItem).toHaveBeenCalledOnce()
    expect(actions.requestVideoUpload).toHaveBeenCalledOnce()

    await act(() => result.current.submit(payloadWithBothFiles))

    expect(createItem).toHaveBeenCalledOnce()
    expect(actions.requestVideoUpload).toHaveBeenCalledOnce()
    expect(actions.requestUploadUrl).toHaveBeenCalledTimes(2)
    expect(result.current.documentStatus).toBe("uploaded")
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("creates item only when no retained item exists", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(createItem).toHaveBeenCalledOnce()
    await act(() => result.current.submit(payloadWithBothFiles))
    expect(createItem).toHaveBeenCalledOnce()
  })

  it("skips video when no video file selected", async () => {
    const calls: string[] = []
    createItem.mockImplementation(async () => {
      calls.push("create")
      return bareItem
    })
    actions.requestUploadUrl.mockImplementation(async () => {
      calls.push("request-document")
      return documentUrlResult
    })
    uploads.uploadToPresignedUrl.mockImplementation(async () => {
      calls.push("upload-document")
      return { ok: true }
    })
    actions.confirmUpload.mockImplementation(async () => {
      calls.push("confirm-document")
      return { success: true, data: completeItem }
    })

    const payload: CreateItemPayload = {
      title: "Document only",
      videoFile: null,
      documentFile: pdfFile,
    }
    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payload))

    expect(calls).toEqual([
      "create",
      "request-document",
      "upload-document",
      "confirm-document",
    ])
    expect(result.current.videoStatus).toBe("idle")
    expect(result.current.documentStatus).toBe("uploaded")
  })

  it("skips document when no document file selected", async () => {
    const calls: string[] = []
    createItem.mockImplementation(async () => {
      calls.push("create")
      return bareItem
    })
    actions.requestVideoUpload.mockImplementation(async () => {
      calls.push("request-video")
      return videoCredentialsResult
    })
    uploads.uploadVideoToBunnyTus.mockImplementation(async () => {
      calls.push("upload-video")
    })
    actions.confirmVideoUpload.mockImplementation(async () => {
      calls.push("confirm-video")
      return { success: true, data: videoItem }
    })

    const payload: CreateItemPayload = {
      title: "Video only",
      videoFile,
      documentFile: null,
    }
    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payload))

    expect(calls).toEqual([
      "create",
      "request-video",
      "upload-video",
      "confirm-video",
    ])
    expect(result.current.videoStatus).toBe("uploaded")
    expect(result.current.documentStatus).toBe("idle")
  })

  it("marks only the active attachment failed on error", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    uploads.uploadVideoToBunnyTus.mockRejectedValue(new Error("network"))
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(result.current.videoStatus).toBe("failed")
    expect(result.current.documentStatus).toBe("idle")
  })

  it("resets all state", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    act(() => result.current.reset())

    expect(result.current.videoStatus).toBe("idle")
    expect(result.current.documentStatus).toBe("idle")
    expect(result.current.videoProgress).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.uploading).toBe(false)
  })

  it("prevents duplicate submits while uploading", async () => {
    let resolveUpload: () => void
    uploads.uploadVideoToBunnyTus.mockImplementation(
      () => new Promise<void>((resolve) => { resolveUpload = resolve })
    )
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))

    let firstSubmit: Promise<void>
    await act(async () => {
      firstSubmit = result.current.submit(payloadWithBothFiles)
    })
    expect(result.current.uploading).toBe(true)

    await act(() => result.current.submit(payloadWithBothFiles))

    expect(actions.requestVideoUpload).toHaveBeenCalledOnce()
    resolveUpload!()
    await act(() => firstSubmit!)
  })

  it("calls onComplete only when every selected attachment is confirmed", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("calls onComplete for video-only payload", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })

    const payload: CreateItemPayload = {
      title: "Video only",
      videoFile,
      documentFile: null,
    }
    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payload))

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("calls onComplete for document-only payload", async () => {
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const payload: CreateItemPayload = {
      title: "Document only",
      videoFile: null,
      documentFile: pdfFile,
    }
    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payload))

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("notifies curriculum after creation and each confirmation", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(onCurriculumCommitted).toHaveBeenCalledTimes(3)
  })

  it("calls onItemUpdated after each confirmation", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
    actions.confirmUpload.mockResolvedValue({ success: true, data: completeItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(onItemUpdated).toHaveBeenCalledWith(videoItem)
    expect(onItemUpdated).toHaveBeenCalledWith(completeItem)
  })

  it("fails before item creation if createItem throws", async () => {
    createItem.mockRejectedValue(new Error("create failed"))

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(result.current.error).toBe("create failed")
    expect(result.current.uploading).toBe(false)
    expect(actions.requestVideoUpload).not.toHaveBeenCalled()
  })

  it("uses uploadErrorMessage when action error has no message", async () => {
    actions.requestVideoUpload.mockResolvedValue({
      success: false,
      error: { type: "Upstream", message: "" },
    })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit(payloadWithBothFiles))

    expect(result.current.error).toBe("Upload failed")
    expect(result.current.videoStatus).toBe("failed")
  })

  it("passes progress callback to video upload", async () => {
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)
    uploads.uploadVideoToBunnyTus.mockImplementation(async () => {})
    actions.confirmVideoUpload.mockResolvedValue({ success: true, data: videoItem })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit({
      title: "Video",
      videoFile,
      documentFile: null,
    }))

    expect(uploads.uploadVideoToBunnyTus).toHaveBeenCalledWith(
      videoFile,
      videoCredentialsResult.data,
      expect.any(Function)
    )
  })

  it("fails document upload when response.ok is false", async () => {
    actions.requestUploadUrl.mockResolvedValue(documentUrlResult)
    uploads.uploadToPresignedUrl.mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    await act(() => result.current.submit({
      title: "Doc",
      videoFile: null,
      documentFile: pdfFile,
    }))

    expect(result.current.documentStatus).toBe("failed")
    expect(actions.confirmUpload).not.toHaveBeenCalled()
  })

  it("does not reset while uploading", async () => {
    let resolveUpload: () => void
    uploads.uploadVideoToBunnyTus.mockImplementation(
      () => new Promise<void>((resolve) => { resolveUpload = resolve })
    )
    actions.requestVideoUpload.mockResolvedValue(videoCredentialsResult)

    const { result } = renderHook(() => useCreateItemFlow(flowOptions()))
    let firstSubmit: Promise<void>
    await act(async () => {
      firstSubmit = result.current.submit(payloadWithBothFiles)
    })

    act(() => result.current.reset())

    expect(result.current.uploading).toBe(true)
    expect(result.current.videoStatus).toBe("uploading")

    resolveUpload!()
    await act(() => firstSubmit!)
  })
})