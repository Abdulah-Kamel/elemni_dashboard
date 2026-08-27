"use client";

import { useState, useCallback } from "react";
import type { StudentCoursePreviewModel, StudentPreviewSection, PreviewDeviceWidth } from "./types";
import { PreviewWorkspace } from "./preview-workspace";
import { StudentCourseDetailPreview } from "./student-course-detail-preview";

interface CourseWorkspaceProps {
  model: StudentCoursePreviewModel;
  locale: string;
  viewer: "guest" | "subscribed";
  initialSections?: StudentPreviewSection[];
}

const COPY = {
  ar: { edit: "تعديل الكورس", guest: "زائر", subscribed: "مشترك", title: "العنوان", description: "الوصف", price: "السعر", viewerLabel: "عرض الكورس", subject: "المادة", grade: "المرحلة", stream: "الشعبة" },
  en: { edit: "Edit Course", guest: "Guest", subscribed: "Subscribed", title: "Title", description: "Description", price: "Price", viewerLabel: "Viewer", subject: "Subject", grade: "Grade", stream: "Stream" },
};

export function CourseWorkspace({
  model,
  locale,
  viewer: initialViewer,
  initialSections,
}: CourseWorkspaceProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en";
  const copy = COPY[lang];

  const [title, setTitle] = useState(model.title);
  const [description, setDescription] = useState(model.description);
  const [price, setPrice] = useState(model.price);
  const [viewer, setViewer] = useState<"guest" | "subscribed">(initialViewer);
  const [sections, setSections] = useState<StudentPreviewSection[]>(initialSections ?? model.sections);
  const [deviceWidth, setDeviceWidth] = useState<PreviewDeviceWidth>("full");

  const previewModel: StudentCoursePreviewModel = {
    ...model,
    title,
    description,
    price,
    sections,
  };

  const handleCurriculumCommitted = useCallback(async (courseId: number) => {
    const { loadCoursePreviewCurriculum } = await import("./server-actions");
    const result = await loadCoursePreviewCurriculum(courseId);
    if (result.success) {
      setSections(result.data);
    }
  }, []);

  const editor = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">{copy.edit}</h2>
      <div>
        <label className="block text-sm font-medium">{copy.title}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.description}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.price}</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.subject}</label>
        <input
          type="text"
          value={model.subject ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.grade}</label>
        <input
          type="text"
          value={model.grade ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.stream}</label>
        <input
          type="text"
          value={model.stream ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">{copy.viewerLabel}</label>
        <div className="flex gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={viewer === "guest"}
            onClick={() => setViewer("guest")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewer === "guest" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {copy.guest}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewer === "subscribed"}
            onClick={() => setViewer("subscribed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewer === "subscribed" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {copy.subscribed}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PreviewWorkspace
      editor={editor}
      preview={
        <StudentCourseDetailPreview
          model={previewModel}
          locale={locale}
          viewer={viewer}
          interactionMode="local-only"
          onCurriculumCommitted={() => handleCurriculumCommitted(model.id as number)}
        />
      }
      locale={locale}
      deviceWidth={deviceWidth}
      onDeviceWidthChange={setDeviceWidth}
    />
  );
}
