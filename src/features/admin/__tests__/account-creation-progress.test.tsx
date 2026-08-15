import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import messages from "@/i18n/messages/en.json"
import { AccountCreationProgress } from "../components/account-creation-progress"

function renderProgress(status: "pending" | "success" | "warning" | "error") {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AccountCreationProgress
        open
        role="student"
        status={status}
        onClose={vi.fn()}
      />
    </NextIntlClientProvider>,
  )
}

describe("AccountCreationProgress", () => {
  it("shows the staged account and email workflow while creating", () => {
    renderProgress("pending")

    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(screen.getByText("Creating student account")).toBeTruthy()
    expect(screen.getByText("Creating account")).toBeTruthy()
    expect(screen.getByText("Preparing access")).toBeTruthy()
    expect(screen.getByText("Sending password email")).toBeTruthy()
  })

  it("announces that the invitation was delivered", () => {
    renderProgress("success")

    expect(screen.getByText("Account ready")).toBeTruthy()
    expect(screen.getByText("The password setup email was sent automatically.")).toBeTruthy()
  })
})
