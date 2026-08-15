import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AdminActionDialog } from "../components/admin-action-dialog"

describe("AdminActionDialog", () => {
  it("requires explicit confirmation before running an action", () => {
    const onConfirm = vi.fn()
    render(
      <AdminActionDialog
        open
        title="Deactivate account?"
        description="The user will lose access."
        confirmLabel="Deactivate"
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    )

    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("locks both actions while a mutation is pending", () => {
    render(
      <AdminActionDialog
        open
        pending
        title="Delete student?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )

    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true)
  })
})
