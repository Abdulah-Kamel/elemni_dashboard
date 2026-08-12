import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import messages from "@/i18n/messages/en.json"
import {
  CourseCoverPicker,
  MAX_COURSE_COVER_SIZE,
} from "../components/course-cover-picker"

function renderPicker(onChange = vi.fn()) {
  const result = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CourseCoverPicker file={null} onChange={onChange} />
    </NextIntlClientProvider>
  )
  return { ...result, onChange }
}

describe("CourseCoverPicker", () => {
  it("accepts JPG, PNG, and WebP cover files", () => {
    const { container, onChange } = renderPicker()
    const file = new File(["image"], "cover.webp", { type: "image/webp" })

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })
    expect(onChange).toHaveBeenCalledWith(file)
  })

  it("rejects unsupported file types", () => {
    const { container, onChange } = renderPicker()
    const file = new File(["image"], "cover.gif", { type: "image/gif" })

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("rejects covers larger than 5 MB", () => {
    const { container, onChange } = renderPicker()
    const file = new File(
      [new Uint8Array(MAX_COURSE_COVER_SIZE + 1)],
      "cover.png",
      { type: "image/png" }
    )

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows an existing cover and offers replacement", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CourseCoverPicker
          currentImageUrl="https://cdn.example.test/courses/1"
          file={null}
          onChange={() => {}}
        />
      </NextIntlClientProvider>
    )
    expect(screen.getByRole("button", { name: "Replace cover" })).toBeTruthy()
  })
})
