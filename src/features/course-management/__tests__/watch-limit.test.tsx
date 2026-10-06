import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import messages from "@/i18n/messages/en.json"
import { itemOutSchema, itemUpdateSchema, itemCreateSchema } from "../items-schema"
import { parseWatchLimit } from "../watch-limit"
import { ItemCard } from "../components/item-card"
import { CreateItemDialog } from "../components/create-item-dialog"
import { useCreateItemFlow } from "../hooks/use-create-item-flow"

const actions = vi.hoisted(() => ({ updateItem: vi.fn() }))
vi.mock("@/features/course-management/items-actions", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/course-management/items-actions")>(),
  updateItem: actions.updateItem,
}))

const base = { id: 1, lesson_id: 2, title: "V", bunny_stream_id: "g", bunny_stream_status: "ready", document_path: null, exam_id: null, order: 1 }

function mount(children: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <NextIntlClientProvider locale="en" messages={messages}>{children}</NextIntlClientProvider>
    </QueryClientProvider>
  )
}

function mountCard(limit: number | null) {
  mount(<ItemCard item={itemOutSchema.parse({ ...base, max_watch_count: limit })} courseId={57} lessonId={2} onUpdate={vi.fn()} />)
}

function mountCreate(onSubmit = vi.fn()) {
  mount(<CreateItemDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} uploading={false} videoStatus="idle" documentStatus="idle" videoProgress={0} error={null} />)
  fireEvent.change(screen.getByRole("textbox", { name: "Item title" }), { target: { value: "V" } })
  fireEvent.change(document.getElementById("create-item-video-upload")!, { target: { files: [new File(["video"], "v.mp4", { type: "video/mp4" })] } })
  return onSubmit
}

describe("watch limit", () => {
  beforeEach(() => {
    actions.updateItem.mockReset().mockResolvedValue({ success: true, data: { ...base, max_watch_count: null } })
  })

  it("parses items with and without max_watch_count", () => {
    expect(itemOutSchema.parse({ ...base, max_watch_count: 3 }).max_watch_count).toBe(3)
    expect(itemOutSchema.parse(base).max_watch_count).toBeNull()
  })
  it.each([["", { ok: true, value: null }], ["  ", { ok: true, value: null }], ["3", { ok: true, value: 3 }], ["1000", { ok: true, value: 1000 }],
    ["0", { ok: false }], ["-2", { ok: false }], ["1001", { ok: false }], ["2.5", { ok: false }], ["abc", { ok: false }]] as const)(
    "empty limit saves null / parses %j", (input, expected) => { expect(parseWatchLimit(input)).toEqual(expected) })
  it("update/create schemas accept null and reject out-of-range", () => {
    expect(itemUpdateSchema.parse({ max_watch_count: null })).toEqual({ max_watch_count: null })
    expect(itemCreateSchema.parse({ title: "V", max_watch_count: null })).toEqual({ title: "V", max_watch_count: null })
    for (const schema of [itemUpdateSchema, itemCreateSchema]) {
      for (const max_watch_count of [0, -2, 1001, 2.5]) {
        expect(schema.safeParse({ title: "V", max_watch_count }).success).toBe(false)
      }
    }
  })
  it.each([[3, "3", "3 views"], [null, "∞", "Unlimited views"]] as const)(
    "shows a compact video badge with a full accessible label for %j", (limit, value, label) => {
      mountCard(limit)
      const badge = screen.getByLabelText(label)
      expect(badge.textContent).toBe(value)
      expect(badge.getAttribute("title")).toBe(label)
      expect(badge.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
    }
  )
  it("overlays desktop row actions while retaining their natural keyboard order", () => {
    mountCard(3)
    const upload = screen.getByRole("button", { name: "Upload Document" }) as HTMLButtonElement
    const edit = screen.getByRole("button", { name: "Edit item" }) as HTMLButtonElement
    const remove = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement
    const group = upload.parentElement!
    const row = group.parentElement!

    expect(row.classList.contains("relative")).toBe(true)
    for (const token of ["md:absolute", "md:inset-y-0", "md:end-2", "md:my-auto", "md:h-fit"]) {
      expect(group.classList.contains(token)).toBe(true)
    }
    expect(group.classList.contains("absolute")).toBe(false)
    expect(group.classList.contains("md:opacity-0")).toBe(true)
    expect(group.classList.contains("md:group-hover:opacity-100")).toBe(true)
    expect(group.classList.contains("md:group-focus-within:opacity-100")).toBe(true)
    expect(Array.from(group.querySelectorAll("button"))).toEqual([upload, edit, remove])
    for (const button of [upload, edit, remove]) {
      expect(button.disabled).toBe(false)
      expect(button.tabIndex).toBe(0)
      act(() => button.focus())
      expect(document.activeElement).toBe(button)
    }
  })
  it("empty limit saves null through updateItem", async () => {
    mountCard(3)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    const field = screen.getByRole("spinbutton", { name: "Max views per student" }) as HTMLInputElement
    expect(field.value).toBe("3")
    fireEvent.change(field, { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(actions.updateItem).toHaveBeenCalledWith(57, 1, { title: "V", max_watch_count: null }))
  })
  it("saves a number when an unlimited video gets a limit", async () => {
    mountCard(null)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    fireEvent.change(screen.getByRole("spinbutton", { name: "Max views per student" }), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(actions.updateItem).toHaveBeenCalledWith(57, 1, { title: "V", max_watch_count: 3 }))
  })
  it.each(["0", "-2", "1001", "2.5"])("rejects invalid edited limit %s", (value) => {
    mountCard(3)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    fireEvent.change(screen.getByRole("spinbutton", { name: "Max views per student" }), { target: { value } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(screen.getByText("Enter a whole number from 1 to 1000, or leave it empty.")).toBeDefined()
    expect(actions.updateItem).not.toHaveBeenCalled()
  })
  it("keeps watch limits out of non-video edits", () => {
    mount(<ItemCard item={itemOutSchema.parse({ ...base, bunny_stream_id: null })} courseId={57} lessonId={2} onUpdate={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit item" }))
    expect(screen.queryByRole("spinbutton", { name: "Max views per student" })).toBeNull()
    expect(screen.queryByText("Unlimited views")).toBeNull()
  })
  it("includes a non-empty watch limit in the create payload", () => {
    const onSubmit = mountCreate()
    fireEvent.change(screen.getByRole("spinbutton", { name: "Max views per student" }), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "V", max_watch_count: 3 }))
  })
  it("omits an empty watch limit in the create payload", () => {
    const onSubmit = mountCreate()
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("max_watch_count")
  })
  it.each(["0", "-2", "1001", "2.5"])("rejects invalid create limit %s", (value) => {
    const onSubmit = mountCreate()
    fireEvent.change(screen.getByRole("spinbutton", { name: "Max views per student" }), { target: { value } })
    fireEvent.click(screen.getByRole("button", { name: "Create item" }))
    expect(screen.getByText("Enter a whole number from 1 to 1000, or leave it empty.")).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it("forwards the create limit through the upload flow", async () => {
    const createItem = vi.fn().mockResolvedValue({ ...base, max_watch_count: 3 })
    function Flow() {
      const flow = useCreateItemFlow({ courseId: 57, lessonId: 2, createItem, onItemUpdated: vi.fn(), onCurriculumCommitted: vi.fn(), onComplete: vi.fn(), uploadErrorMessage: "Failed" })
      return <button onClick={() => void flow.submit({ title: "V", videoFile: null, documentFile: null, max_watch_count: 3 })}>Submit flow</button>
    }
    mount(<Flow />)
    fireEvent.click(screen.getByRole("button", { name: "Submit flow" }))
    await waitFor(() => expect(createItem).toHaveBeenCalledWith({ title: "V", max_watch_count: 3 }))
  })
})
