import { useState } from "react"
import { describe, beforeEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import { CourseBuilderBridgeProvider } from "../course-builder-bridge"
import { ItemCard } from "../components/item-card"
import type { ItemOut } from "../items-schema"

const actions = vi.hoisted(() => ({
  deleteItemDocument: vi.fn(),
  deleteItemVideo: vi.fn(),
}))

const mutations = vi.hoisted(() => ({
  update: { isPending: false, mutateAsync: vi.fn() },
  remove: { isPending: false, mutateAsync: vi.fn() },
}))

vi.mock("@/features/course-management/items-actions", () => ({
  confirmUpload: vi.fn(),
  confirmVideoUpload: vi.fn(),
  deleteItemDocument: actions.deleteItemDocument,
  deleteItemVideo: actions.deleteItemVideo,
  requestUploadUrl: vi.fn(),
  requestVideoUpload: vi.fn(),
}))

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useItemMutations: () => mutations,
}))

const videoOnlyItem: ItemOut = {
  id: 303,
  lesson_id: 202,
  title: "Lesson introduction",
  bunny_stream_id: "video-guid",
  bunny_stream_status: "finished",
  document_path: null,
  exam_id: null,
  order: 1,
}

function StatefulItemCard({ initialItem }: { initialItem: ItemOut }) {
  const [item, setItem] = useState(initialItem)

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <CourseBuilderBridgeProvider enabled={false}>
        <ItemCard
          item={item}
          courseId={101}
          lessonId={202}
          onUpdate={setItem}
        />
      </CourseBuilderBridgeProvider>
    </NextIntlClientProvider>
  )
}

describe("ItemCard media slots", () => {
  beforeEach(() => {
    actions.deleteItemDocument.mockReset()
    actions.deleteItemVideo.mockReset()
    mutations.update.mutateAsync.mockReset()
    mutations.remove.mutateAsync.mockReset()
  })

  it("keeps the document upload available when the item already has a video", () => {
    render(<StatefulItemCard initialItem={videoOnlyItem} />)

    expect(
      screen.getByRole("button", { name: "Upload Document" })
    ).toBeDefined()
    expect(
      screen.queryByRole("button", { name: "Upload Video" })
    ).toBeNull()
  })

  it("removes only the document and reopens its upload slot", async () => {
    const itemWithBothMedia: ItemOut = {
      ...videoOnlyItem,
      document_path: "courses/101/lessons/202/items/303/notes.pdf",
    }
    actions.deleteItemDocument.mockResolvedValue({
      success: true,
      data: { ...itemWithBothMedia, document_path: null },
    })

    render(<StatefulItemCard initialItem={itemWithBothMedia} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete document" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Upload Document" })
      ).toBeDefined()
    })
    expect(actions.deleteItemDocument).toHaveBeenCalledWith(101, 202, 303)
    expect(
      screen.queryByRole("button", { name: "Delete document" })
    ).toBeNull()
    expect(screen.getByRole("button", { name: "Delete video" })).toBeDefined()
  })
})
