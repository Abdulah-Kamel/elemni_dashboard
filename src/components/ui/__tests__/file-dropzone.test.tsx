import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FileDropzone } from "../file-dropzone"

describe("FileDropzone", () => {
  it("renders a clickable browse region", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const region = screen.getByRole("button", { name: /choose a file/i })
    expect(region).toBeDefined()
    expect(region.getAttribute("tabindex")).toBe("0")
  })

  it("has no nested interactive controls inside the drop region", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const region = screen.getByTestId("drop-region")
    const buttonsInside = region.querySelectorAll(
      "[role='button'], button, a, input:not([type='file']), select, textarea"
    )
    expect(buttonsInside).toHaveLength(0)
  })

  it("uses button role on the drop region", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const region = screen.getByTestId("drop-region")
    expect(region.getAttribute("role")).toBe("button")
  })

  it("opens the file picker when the drop region is clicked", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const input = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {})
    fireEvent.click(screen.getByTestId("drop-region"))
    expect(clickSpy).toHaveBeenCalledOnce()
    clickSpy.mockRestore()
  })

  it("opens the file picker from Enter and Space", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const input = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {})
    const region = screen.getByTestId("drop-region")

    fireEvent.keyDown(region, { key: "Enter" })
    fireEvent.keyDown(region, { key: " " })

    expect(clickSpy).toHaveBeenCalledTimes(2)
    clickSpy.mockRestore()
  })

  it("calls onFileSelect when a file is chosen via the hidden input", () => {
    const onFileSelect = vi.fn()
    render(
      <FileDropzone onFileSelect={onFileSelect} locale="en" accept="image/*" />
    )
    const input = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement
    const file = new File(["test"], "test.png", { type: "image/png" })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it("associates the hidden input with an explicit id when inputId is provided", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        inputId="profile-avatar"
      />
    )
    const input = document.getElementById("profile-avatar") as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.type).toBe("file")
  })

  it("does not set an id on the input when inputId is omitted", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const input = document.querySelector(
      "input[type='file']"
    ) as HTMLInputElement
    expect(input.id).toBe("")
  })

  it("shows file metadata when a file is selected", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        selectedFile={new File(["x"], "photo.jpg", { type: "image/jpeg" })}
      />
    )
    expect(screen.getByText("photo.jpg")).toBeDefined()
  })

  it("shows file size for selected file", () => {
    const largeFile = new File([new ArrayBuffer(2048)], "large.png", {
      type: "image/png",
    })
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        selectedFile={largeFile}
      />
    )
    expect(screen.getByText("2.0 KB")).toBeDefined()
  })

  it("shows clear button outside drop region when a file is selected and onClear is provided", () => {
    const onClear = vi.fn()
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        selectedFile={new File(["x"], "photo.jpg", { type: "image/jpeg" })}
        onClear={onClear}
      />
    )
    const clearBtn = screen.getByRole("button", { name: /remove file/i })
    expect(clearBtn).toBeDefined()
    // Clear button is outside the drop region
    const region = screen.getByTestId("drop-region")
    expect(region.contains(clearBtn)).toBe(false)
    fireEvent.click(clearBtn)
    expect(onClear).toHaveBeenCalled()
  })

  it("does not show clear button when onClear is not provided", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        selectedFile={new File(["x"], "photo.jpg", { type: "image/jpeg" })}
      />
    )
    expect(screen.queryByRole("button", { name: /remove file/i })).toBeNull()
  })

  it("shows error description when provided", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        error="File too large"
      />
    )
    expect(screen.getByText("File too large")).toBeDefined()
    expect(screen.getByRole("alert")).toBeDefined()
  })

  it("shows custom description when provided", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        description="JPEG, PNG or WebP, max 5MB"
      />
    )
    expect(screen.getByText("JPEG, PNG or WebP, max 5MB")).toBeDefined()
  })

  it("disables the drop region when disabled prop is true", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        disabled
      />
    )
    const region = screen.getByTestId("drop-region")
    expect(region.getAttribute("aria-disabled")).toBe("true")
    expect(region.getAttribute("tabindex")).toBe("-1")
  })

  it("applies opacity to drop region when disabled", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        disabled
      />
    )
    const region = screen.getByTestId("drop-region")
    expect(region.className).toContain("opacity-50")
  })

  it("renders Arabic labels", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="ar" accept="image/*" />)
    expect(screen.getByText(/اسحب وأفلت/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /اختيار ملف/i })).toBeDefined()
  })

  it("does not call onFileSelect on drop when disabled", () => {
    const onFileSelect = vi.fn()
    render(
      <FileDropzone
        onFileSelect={onFileSelect}
        locale="en"
        accept="image/*"
        disabled
      />
    )
    const region = screen.getByTestId("drop-region")
    const file = new File(["test"], "test.png", { type: "image/png" })
    fireEvent.drop(region, { dataTransfer: { files: [file] } })
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it("calls onFileSelect on drop with a valid file", () => {
    const onFileSelect = vi.fn()
    render(
      <FileDropzone onFileSelect={onFileSelect} locale="en" accept="image/*" />
    )
    const region = screen.getByTestId("drop-region")
    const file = new File(["test"], "test.png", { type: "image/png" })
    fireEvent.drop(region, { dataTransfer: { files: [file] } })
    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it("sets dragOver styling on drag enter and clears on drag leave", () => {
    render(<FileDropzone onFileSelect={vi.fn()} locale="en" accept="image/*" />)
    const region = screen.getByTestId("drop-region")
    expect(region.className).toContain("border-border")

    fireEvent.dragEnter(region)
    expect(region.className).toContain("border-primary")
    expect(region.className).toContain("bg-primary/5")

    fireEvent.dragLeave(region)
    expect(region.className).not.toContain("bg-primary/5")
  })

  it("applies error border style when error is provided", () => {
    render(
      <FileDropzone
        onFileSelect={vi.fn()}
        locale="en"
        accept="image/*"
        error="Invalid file"
      />
    )
    const region = screen.getByTestId("drop-region")
    expect(region.className).toContain("border-destructive/50")
  })
})
