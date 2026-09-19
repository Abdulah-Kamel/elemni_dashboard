import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CourseBuilderBridgeProvider } from "../course-builder-bridge"
import { ItemList } from "../components/item-list"
import type { ItemOut } from "../items-schema"

const bareItem: ItemOut = {
  id: 10,
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
  document_path: "courses/1/lessons/2/items/10.pdf",
}

const videoFile = new File(["video"], "lesson.mp4", { type: "video/mp4" })
const pdfFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" })

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

const mutations = vi.hoisted(() => ({
  create: { mutateAsync: vi.fn() },
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

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useItemsQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
    error: null,
  }),
  useItemMutations: () => ({
    create: mutations.create,
    update: { mutateAsync: vi.fn() },
    reorder: { mutateAsync: vi.fn() },
    remove: { mutateAsync: vi.fn() },
  }),
}))

function renderItemList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <CourseBuilderBridgeProvider enabled={false}>
          <ItemList
            initialItems={[]}
            courseId={1}
            lessonId={2}
            error={null}
          />
        </CourseBuilderBridgeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

function getTitleInput() {
  return screen.getByRole("textbox", { name: "Item title" }) as HTMLInputElement
}

beforeEach(() => {
  vi.resetAllMocks()
  mutations.create.mutateAsync.mockResolvedValue(bareItem)
  actions.requestVideoUpload.mockResolvedValue({
    success: true,
    data: {
      video_id: "video-guid",
      library_id: 42,
      expiration_time: 2_000_000_000,
      signature: "sig",
      embed_url: "https://player.example.test/embed/42/video-guid",
    },
  })
  uploads.uploadVideoToBunnyTus.mockResolvedValue(undefined)
  actions.confirmVideoUpload.mockResolvedValue({
    success: true,
    data: videoItem,
  })
  actions.requestUploadUrl.mockResolvedValue({
    success: true,
    data: {
      upload_url: "https://storage.example.test/signed",
      key: "courses/1/lessons/2/items/10.pdf",
      public_url: "https://cdn.example.test/courses/1/lessons/2/items/10.pdf",
    },
  })
  uploads.uploadToPresignedUrl.mockResolvedValue({ ok: true })
  actions.confirmUpload.mockResolvedValue({
    success: true,
    data: completeItem,
  })
})

describe("ItemList creation integration", () => {
  it("creates one item with both files from Add Item", async () => {
    renderItemList()
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))
    fireEvent.change(getTitleInput(), {
      target: { value: "Lesson resources" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    fireEvent.change(document.getElementById("create-item-attachments")!, {
      target: { files: [videoFile, pdfFile] },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Create item with 2 files" })
    )

    await waitFor(() => expect(mutations.create.mutateAsync).toHaveBeenCalledOnce())
    expect(mutations.create.mutateAsync).toHaveBeenCalledWith({
      title: "Lesson resources",
    })
    await waitFor(() => expect(actions.confirmUpload).toHaveBeenCalledOnce())
    expect(actions.requestVideoUpload.mock.invocationCallOrder[0]).toBeLessThan(
      actions.requestUploadUrl.mock.invocationCallOrder[0]
    )
  })

  it("retries only the failed document after PDF failure", async () => {
    uploads.uploadToPresignedUrl
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true })

    renderItemList()
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))
    fireEvent.change(getTitleInput(), {
      target: { value: "Lesson resources" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    fireEvent.change(document.getElementById("create-item-attachments")!, {
      target: { files: [videoFile, pdfFile] },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Create item with 2 files" })
    )

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retry PDF" })).toBeDefined()
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Retry PDF" })
    )

    await waitFor(() =>
      expect(actions.confirmUpload).toHaveBeenCalledOnce()
    )
    expect(mutations.create.mutateAsync).toHaveBeenCalledOnce()
    expect(actions.requestVideoUpload).toHaveBeenCalledOnce()
    expect(actions.requestUploadUrl).toHaveBeenCalledTimes(2)
  })
})
