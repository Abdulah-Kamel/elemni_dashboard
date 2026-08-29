"use client"

import { useId, useState, useCallback } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import type {
  StudentCoursePreviewModel,
  StudentPreviewSection,
  PreviewDeviceWidth,
} from "./types"
import { PreviewWorkspace } from "./preview-workspace"
import { StudentCourseDetailPreview } from "./student-course-detail-preview"
import { loadCoursePreviewCurriculum } from "./server-actions"

interface CourseWorkspaceProps {
  model: StudentCoursePreviewModel
  locale: string
  viewer: "guest" | "subscribed"
  initialSections?: StudentPreviewSection[]
}

const COPY = {
  ar: {
    edit: "تعديل الكورس",
    guest: "زائر",
    subscribed: "مشترك",
    title: "العنوان",
    description: "الوصف",
    price: "السعر",
    viewerLabel: "عرض الكورس",
    subject: "المادة",
    grade: "المرحلة",
    stream: "الشعبة",
    refresh: "تحديث محتوى المعاينة",
    refreshing: "جاري تحديث المحتوى",
    loadError: "تعذر تحديث محتوى المعاينة. حاول مرة أخرى.",
  },
  en: {
    edit: "Edit Course",
    guest: "Guest",
    subscribed: "Subscribed",
    title: "Title",
    description: "Description",
    price: "Price",
    viewerLabel: "Viewer",
    subject: "Subject",
    grade: "Grade",
    stream: "Stream",
    refresh: "Refresh preview content",
    refreshing: "Refreshing content",
    loadError: "Could not refresh the preview content. Try again.",
  },
}

export function CourseWorkspace({
  model,
  locale,
  viewer: initialViewer,
  initialSections,
}: CourseWorkspaceProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en"
  const copy = COPY[lang]
  const id = useId()

  const [title, setTitle] = useState(model.title)
  const [description, setDescription] = useState(model.description)
  const [price, setPrice] = useState(model.price)
  const [viewer, setViewer] = useState<"guest" | "subscribed">(initialViewer)
  const [sections, setSections] = useState<StudentPreviewSection[]>(
    initialSections ?? model.sections
  )
  const [deviceWidth, setDeviceWidth] = useState<PreviewDeviceWidth>("full")
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const previewModel: StudentCoursePreviewModel = {
    ...model,
    title,
    description,
    price,
    sections,
  }
  const curriculumKey = sections
    .map(
      (section) =>
        `${section.id}:${section.lessons.map((lesson) => lesson.id).join(",")}`
    )
    .join("|")

  const handleCurriculumCommitted = useCallback(async (courseId: number) => {
    setRefreshing(true)
    setLoadError(false)
    try {
      const result = await loadCoursePreviewCurriculum(courseId)
      if (result.success) {
        setSections(result.data)
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const editor = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">{copy.edit}</h2>
      <div>
        <label htmlFor={`${id}-title`} className="block text-sm font-medium">
          {copy.title}
        </label>
        <input
          id={`${id}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor={`${id}-description`}
          className="block text-sm font-medium"
        >
          {copy.description}
        </label>
        <textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          rows={3}
        />
      </div>
      <div>
        <label htmlFor={`${id}-price`} className="block text-sm font-medium">
          {copy.price}
        </label>
        <input
          id={`${id}-price`}
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={`${id}-subject`} className="block text-sm font-medium">
          {copy.subject}
        </label>
        <input
          id={`${id}-subject`}
          type="text"
          value={model.subject ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <label htmlFor={`${id}-grade`} className="block text-sm font-medium">
          {copy.grade}
        </label>
        <input
          id={`${id}-grade`}
          type="text"
          value={model.grade ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <label htmlFor={`${id}-stream`} className="block text-sm font-medium">
          {copy.stream}
        </label>
        <input
          id={`${id}-stream`}
          type="text"
          value={model.stream ?? ""}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
        />
      </div>
      <div>
        <p id={`${id}-viewer-label`} className="block text-sm font-medium">
          {copy.viewerLabel}
        </p>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-labelledby={`${id}-viewer-label`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewer === "guest"}
            onClick={() => setViewer("guest")}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${viewer === "guest" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {copy.guest}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewer === "subscribed"}
            onClick={() => setViewer("subscribed")}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${viewer === "subscribed" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {copy.subscribed}
          </button>
        </div>
      </div>
      <div className="space-y-2 border-t border-border pt-4">
        <button
          type="button"
          disabled={refreshing}
          onClick={() => handleCurriculumCommitted(Number(model.id))}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {refreshing ? copy.refreshing : copy.refresh}
        </button>
        {loadError && (
          <p role="alert" className="text-sm text-destructive">
            {copy.loadError}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <PreviewWorkspace
      editor={editor}
      preview={
        <StudentCourseDetailPreview
          key={curriculumKey}
          model={previewModel}
          locale={locale}
          viewer={viewer}
          interactionMode="local-only"
        />
      }
      locale={locale}
      deviceWidth={deviceWidth}
      onDeviceWidthChange={setDeviceWidth}
    />
  )
}
