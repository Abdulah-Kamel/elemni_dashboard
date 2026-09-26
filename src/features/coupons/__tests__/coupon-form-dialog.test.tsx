import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messagesFor } from "@/i18n/messages/load"
import { CouponFormDialog } from "../components/coupon-form-dialog"
import { coupon } from "./fixtures"

const mutations = vi.hoisted(() => ({
  create: { mutateAsync: vi.fn(), isPending: false },
  update: { mutateAsync: vi.fn(), isPending: false },
}))
vi.mock("../hooks/use-coupons", () => ({ useCouponMutations: () => mutations }))
vi.mock("@/features/admin/hooks/use-teachers-queries", () => ({
  useTeachersQuery: () => ({
    data: { items: [{ teacher_profile_id: 7, name: "Mona Adel", email: "mona@example.com" }], total: 1 },
    isLoading: false,
    isError: false,
  }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderDialog(props: Partial<React.ComponentProps<typeof CouponFormDialog>> = {}) {
  const onOpenChange = vi.fn()
  render(
    <NextIntlClientProvider locale="en" messages={messagesFor("en")}>
      <CouponFormDialog open onOpenChange={onOpenChange} {...props} />
    </NextIntlClientProvider>,
  )
  return { onOpenChange }
}

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement

beforeEach(() => {
  mutations.create.mutateAsync.mockReset()
  mutations.update.mutateAsync.mockReset()
})

describe("CouponFormDialog", () => {
  it("validates before calling the API", async () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Create coupon" }))
    expect(await screen.findByText("Check the highlighted fields.")).toBeTruthy()
    expect(screen.getByText("This field is required.")).toBeTruthy()
    expect(field("Code").getAttribute("aria-invalid")).toBe("true")
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled()
  })

  it("generates a code and shows a labelled example preview", () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Generate" }))
    expect(field("Code").value).toMatch(/^[A-Z2-9]{8}$/)
    expect(screen.getByTestId("coupon-example").textContent).toContain("Enter a discount value")
    fireEvent.change(field("Discount value"), { target: { value: "20" } })
    const example = screen.getByTestId("coupon-example").textContent?.replace(/\s/g, " ")
    expect(example).toContain("Example:")
    expect(example).toContain("a course priced EGP 200.00 → EGP 160.00")
    expect(example).toContain("the server calculates the actual discount at checkout")
  })

  it("submits a teacher-scoped coupon", async () => {
    mutations.create.mutateAsync.mockResolvedValue({ ok: true, data: coupon({ code: "TEACH10" }) })
    const onSaved = vi.fn()
    const { onOpenChange } = renderDialog({ onSaved })
    fireEvent.change(field("Code"), { target: { value: "teach10" } })
    fireEvent.change(field("Discount value"), { target: { value: "10" } })
    fireEvent.click(screen.getByRole("button", { name: "Specific teachers" }))
    fireEvent.click(screen.getByRole("checkbox", { name: /Mona Adel/ }))
    fireEvent.click(screen.getByRole("button", { name: "Create coupon" }))
    await waitFor(() => expect(mutations.create.mutateAsync).toHaveBeenCalled())
    expect(mutations.create.mutateAsync.mock.calls[0][0]).toMatchObject({ code: "TEACH10", value: "10", applies_to: "teachers", teacher_ids: [7] })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onSaved).toHaveBeenCalled()
  })

  it("shows the duplicate-code error from the API on the code field", async () => {
    mutations.create.mutateAsync.mockResolvedValue({ ok: false, error: "duplicate_code" })
    renderDialog()
    fireEvent.change(field("Code"), { target: { value: "SAVE20" } })
    fireEvent.change(field("Discount value"), { target: { value: "10" } })
    fireEvent.click(screen.getByRole("button", { name: "Create coupon" }))
    expect(await screen.findByText("This code is already in use.")).toBeTruthy()
    expect(screen.getByRole("alert").textContent).toContain("Pick another one")
  })

  it("edits without letting the code change", async () => {
    mutations.update.mutateAsync.mockResolvedValue({ ok: true, data: coupon() })
    renderDialog({ coupon: coupon({ max_uses: 500 }) })
    expect(field("Code").disabled).toBe(true)
    expect(field("Total limit").value).toBe("500")
    fireEvent.change(field("Total limit"), { target: { value: "800" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(mutations.update.mutateAsync).toHaveBeenCalled())
    expect(mutations.update.mutateAsync.mock.calls[0][0]).toMatchObject({ code: "SAVE20", input: { max_uses: 800 } })
  })
})
