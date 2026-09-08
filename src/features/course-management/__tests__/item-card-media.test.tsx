import { useState } from "react"
import { describe, beforeEach, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
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

vi.mock(
  "@/features/course-management/hooks/use-course-management-queries",
  () => ({
    useItemMutations: () => mutations,
  })
)

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
    expect(screen.queryByRole("button", { name: "Upload Video" })).toBeNull()
  })

  it("removes only the document and reopens its upload slot via edit dialog", async () => {
    const itemWithBothMedia: ItemOut = {
      ...videoOnlyItem,
      document_path: "courses/101/lessons/202/items/303/notes.pdf",
    }
    actions.deleteItemDocument.mockResolvedValue({
      success: true,
      data: { ...itemWithBothMedia, document_path: null },
    })

    render(<StatefulItemCard initialItem={itemWithBothMedia} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const editDialog = screen.getByRole("dialog")
    fireEvent.click(
      within(editDialog).getByRole("button", { name: "Delete document" })
    )
    const confirmDialog = screen.getAllByRole("dialog").at(-1)
    fireEvent.click(
      within(confirmDialog!).getByRole("button", { name: "Confirm" })
    )

    await waitFor(() => {
      expect(actions.deleteItemDocument).toHaveBeenCalledWith(101, 202, 303)
    })
    expect(
      within(editDialog).getByRole("button", { name: "Add document" })
    ).toBeDefined()
  })

  it("shows attached files section in edit dialog", () => {
    render(<StatefulItemCard initialItem={videoOnlyItem} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Attached files")).toBeDefined()
    expect(within(dialog).getByText("Video")).toBeDefined()
    expect(within(dialog).getByText("Document")).toBeDefined()
    expect(within(dialog).queryByRole("button", { name: /^Delete$/ })).toBeNull()
  })

  it("updates the item row after saving its title from the edit dialog", async () => {
    const updatedItem = { ...videoOnlyItem, title: "Updated lesson" }
    mutations.update.mutateAsync.mockResolvedValue(updatedItem)

    render(<StatefulItemCard initialItem={videoOnlyItem} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: updatedItem.title },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.getByText(updatedItem.title)).toBeDefined())
  })

  it("row does not expose Delete video or Delete document buttons", () => {
    const itemWithBothMedia: ItemOut = {
      ...videoOnlyItem,
      document_path: "courses/101/lessons/202/items/303/notes.pdf",
    }
    render(<StatefulItemCard initialItem={itemWithBothMedia} />)

    expect(screen.queryByRole("button", { name: "Delete video" })).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Delete document" })
    ).toBeNull()
  })

  it("row still exposes Delete button for the item", () => {
    render(<StatefulItemCard initialItem={videoOnlyItem} />)

    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined()
  })

  it("deletes the item from the row action, not from the edit dialog", async () => {
    const onDelete = vi.fn()
    mutations.remove.mutateAsync.mockResolvedValue(undefined)

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CourseBuilderBridgeProvider enabled={false}>
          <ItemCard
            item={videoOnlyItem}
            courseId={101}
            lessonId={202}
            onUpdate={vi.fn()}
            onDelete={onDelete}
          />
        </CourseBuilderBridgeProvider>
      </NextIntlClientProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(videoOnlyItem.id))
  })

  it("opens upload dialog from edit dialog when slot empty", async () => {
    render(<StatefulItemCard initialItem={videoOnlyItem} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add document" })
    )
    // Expect UploadDialog to open (we can check for its title)
    await waitFor(() => {
      expect(
        screen.getByText("Give this lesson item a clear name.")
      ).toBeDefined()
    })
    const uploadDialog = screen.getAllByRole("dialog").at(-1)
    expect(uploadDialog).toBeDefined()
    fireEvent.click(within(uploadDialog!).getByRole("button", { name: "Next" }))
    expect(
      within(uploadDialog!).queryByRole("button", { name: "Upload Video" })
    ).toBeNull()
    expect(
      within(uploadDialog!).getByRole("button", { name: /^Upload Document/ })
    ).toBeDefined()
  })

  it("deleting one asset leaves the other attached in edit dialog", async () => {
    const itemWithBothMedia: ItemOut = {
      ...videoOnlyItem,
      document_path: "courses/101/lessons/202/items/303/notes.pdf",
    }
    actions.deleteItemDocument.mockResolvedValue({
      success: true,
      data: { ...itemWithBothMedia, document_path: null },
    })

    render(<StatefulItemCard initialItem={itemWithBothMedia} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete document" })
    )
    // Expect confirmation dialog to open (media delete dialog)
    const confirmDialog = screen.getAllByRole("dialog").at(-1)
    expect(confirmDialog).toBeDefined()
    fireEvent.click(
      within(confirmDialog!).getByRole("button", { name: "Confirm" })
    )

    await waitFor(() => {
      expect(actions.deleteItemDocument).toHaveBeenCalledWith(101, 202, 303)
    })
    // After deletion, edit dialog should still be open with video row present
    expect(within(dialog).getByText("Video")).toBeDefined()
    expect(
      within(dialog).getByRole("button", { name: "Add document" })
    ).toBeDefined()
  })
})
