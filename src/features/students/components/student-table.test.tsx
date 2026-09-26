import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { StudentTable, type StudentSubscriptionRow } from "./student-table"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}))

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [null],
}))

const row: StudentSubscriptionRow = {
  enrollmentId: 11,
  studentId: 1,
  name: "Student One",
  initials: "SO",
  email: "student@example.com",
  phone: null,
  studentPhone: null,
  whatsapp: null,
  parentPhone: null,
  courseId: 12,
  course: "Calculus",
  purchasedAt: "2026-09-01T10:00:00+00:00",
  expiresAt: "2026-10-01T10:00:00+00:00",
  totalPaid: 250,
  currency: "EGP",
  status: "duplicate_paid",
  gradeId: null,
  grade: null,
  streamId: null,
  stream: null,
}

describe("StudentTable payment statuses", () => {
  it("uses the shared backend payment status badge for duplicate payments", () => {
    render(<StudentTable students={[row]} />)

    expect(screen.getByTestId("payment-status-duplicate_paid")).toBeTruthy()
  })
})
