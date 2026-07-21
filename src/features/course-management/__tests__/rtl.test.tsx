import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseCardActions } from "../components/course-card-actions";

const messages = {
  courses: {
    edit: "تعديل",
    publish: "نشر",
    unpublish: "إلغاء النشر",
  },
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("RTL directional icons", () => {
  it("edit icon has rtl:rotate-180 class", () => {
    const { container } = renderWithIntl(
      <CourseCardActions courseId={1} isPublished={false} teacherProfileId={7} />
    );
    const editIcons = container.querySelectorAll(".rtl\\:rotate-180");
    expect(editIcons.length).toBeGreaterThan(0);
  });
});
