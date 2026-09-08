"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { BookOpen, Check, Loader2, Save } from "lucide-react"
import type {
  StudentCoursePreviewModel,
  StudentPreviewSection,
  PreviewDeviceWidth,
} from "./types"
import { PreviewWorkspace } from "./preview-workspace"
import type { PreviewWorkspaceTab } from "./preview-workspace"
import { StudentCourseDetailPreview } from "./student-course-detail-preview"
import { loadCoursePreviewCurriculum } from "./server-actions"
import { CurriculumPicker } from "@/features/course-management/components/curriculum-picker"
import type {
  GradeOut,
  StreamOut,
  SubjectOut,
} from "@/features/course-management/schema"
import {
  CourseBuilderBridgeProvider,
  type CourseBuilderField,
  useCourseBuilderBridge,
} from "@/features/course-management/course-builder-bridge"
import { CourseCoverPicker } from "@/features/course-management/components/course-cover-picker"
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import {
  formatCoursePrice,
  type CourseUpdate,
} from "@/features/course-management/schema"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CourseWorkspaceProps {
  model: StudentCoursePreviewModel
  locale: string
  teacherProfileId?: number
  /** @deprecated The preview now uses one public student view. */
  viewer?: "guest" | "subscribed"
  initialSections?: StudentPreviewSection[]
  editorActions?: ReactNode
  curriculum?: ReactNode
  curriculumTitle?: string
  curriculumHint?: string
  subjects?: SubjectOut[]
  grades?: GradeOut[]
  streams?: StreamOut[]
}

const COPY = {
  ar: {
    edit: "تعديل الكورس",
    title: "العنوان",
    description: "الوصف",
    price: "السعر",
    subject: "المادة",
    grade: "المرحلة",
    stream: "الشعبة",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "تم حفظ التغييرات",
    saveError: "تعذر حفظ التغييرات. حاول مرة أخرى.",
  },
  en: {
    edit: "Edit Course",
    title: "Title",
    description: "Description",
    price: "Price",
    subject: "Subject",
    grade: "Grade",
    stream: "Stream",
    save: "Save changes",
    saving: "Saving...",
    saved: "Changes saved",
    saveError: "Could not save the changes. Try again.",
  },
}

export function CourseWorkspace({ ...props }: CourseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PreviewWorkspaceTab>("edit")
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false)

  return (
    <CourseWorkspaceContent
      {...props}
      activeTab={activeTab}
      fullPreviewOpen={fullPreviewOpen}
      onActiveTabChange={setActiveTab}
      onFullPreviewOpenChange={setFullPreviewOpen}
    />
  )
}

interface CourseWorkspaceContentProps extends CourseWorkspaceProps {
  activeTab: PreviewWorkspaceTab
  fullPreviewOpen: boolean
  onActiveTabChange: (tab: PreviewWorkspaceTab) => void
  onFullPreviewOpenChange: (open: boolean) => void
}

function CourseWorkspaceContent({
  model,
  locale,
  initialSections,
  editorActions,
  curriculum,
  curriculumTitle,
  curriculumHint,
  subjects,
  grades,
  streams,
  teacherProfileId,
  activeTab,
  fullPreviewOpen,
  onActiveTabChange,
  onFullPreviewOpenChange,
}: CourseWorkspaceContentProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en"
  const copy = COPY[lang]
  const id = useId()

  const [title, setTitle] = useState(model.title)
  const [description, setDescription] = useState(model.description)
  const [price, setPrice] = useState(model.price)
  const [subjectId, setSubjectId] = useState<number | null>(
    model.subjectId ??
      subjects?.find((subject) => subject.name === model.subject)?.id ??
      null
  )
  const [gradeId, setGradeId] = useState<number | null>(
    model.gradeId ??
      grades?.find((grade) => grade.name === model.grade)?.id ??
      null
  )
  const [streamId, setStreamId] = useState<number | null>(
    model.streamId ??
      streams?.find((stream) => stream.name === model.stream)?.id ??
      null
  )
  const [savedCoverUrl, setSavedCoverUrl] = useState(model.coverUrl)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [sections, setSections] = useState<StudentPreviewSection[]>(
    initialSections ?? model.sections
  )
  const [deviceWidth, setDeviceWidth] = useState<PreviewDeviceWidth>("full")
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const { update } = useCourseMutations(teacherProfileId ?? 0)

  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  )

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  const courseId = Number(model.id)
  const canSave = Number.isInteger(courseId) && teacherProfileId != null

  const markDirty = useCallback(() => {
    setSaveStatus("idle")
    setSaveError(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!canSave || teacherProfileId == null) {
      setSaveStatus("error")
      setSaveError(copy.saveError)
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setSaveStatus("error")
      setSaveError(
        lang === "ar" ? "عنوان الكورس مطلوب." : "A course title is required."
      )
      return
    }

    setSaveStatus("saving")
    setSaveError(null)

    try {
      const body: CourseUpdate = {
        title: trimmedTitle,
        description: description.trim() || null,
        price: formatCoursePrice(price),
      }

      if (subjectId !== null) body.subject_id = subjectId
      if (gradeId !== null) body.grade_id = gradeId
      if (streamId !== null) body.stream_id = streamId

      if (coverFile) {
        body.img = await uploadCourseCover(courseId, coverFile)
      }

      const updatedCourse = await update.mutateAsync({ courseId, data: body })
      setSavedCoverUrl(updatedCourse.img ?? savedCoverUrl)
      setCoverFile(null)
      setSaveStatus("saved")
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : copy.saveError
      setSaveStatus("error")
      setSaveError(message)
    }
  }, [
    canSave,
    copy.saveError,
    courseId,
    coverFile,
    description,
    lang,
    price,
    savedCoverUrl,
    subjectId,
    gradeId,
    streamId,
    teacherProfileId,
    title,
    update,
  ])

  const previewModel: StudentCoursePreviewModel = {
    ...model,
    title,
    description,
    price,
    subject:
      subjects?.find((subject) => subject.id === subjectId)?.name ??
      model.subject,
    grade: grades?.find((grade) => grade.id === gradeId)?.name ?? model.grade,
    stream:
      streams?.find((stream) => stream.id === streamId)?.name ?? model.stream,
    subjectId,
    gradeId,
    streamId,
    coverUrl: coverPreviewUrl ?? savedCoverUrl,
    sections,
  }
  const curriculumKey = sections
    .map(
      (section) =>
        `${section.id}:${section.lessons.map((lesson) => lesson.id).join(",")}`
    )
    .join("|")

  const handleCurriculumCommitted = useCallback(async (courseId: number) => {
    try {
      const result = await loadCoursePreviewCurriculum(courseId)
      if (result.success) {
        setSections(result.data)
      }
    } catch {
      // Curriculum mutations own their error state; preview refresh is best-effort.
    }
  }, [])

  const refreshCurriculum = useCallback(
    () => handleCurriculumCommitted(Number(model.id)),
    [handleCurriculumCommitted, model.id]
  )

  const editor = (
    <div className="space-y-6 p-4">
      {editorActions && (
        <div
          data-testid="course-editor-actions"
          className="border-b border-border pb-4"
        >
          {editorActions}
        </div>
      )}
      <section aria-labelledby={`${id}-settings-title`} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${id}-settings-title`} className="text-lg font-bold">
            {copy.edit}
          </h2>
        </div>
        <CourseEditorField field="title">
          {(controlClassName) => (
            <>
              <label
                htmlFor={`${id}-title`}
                className="block text-sm font-medium"
              >
                {copy.title}
              </label>
              <input
                id={`${id}-title`}
                data-builder-field-input="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  markDirty()
                }}
                className={cn(
                  "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                  controlClassName
                )}
              />
            </>
          )}
        </CourseEditorField>
        <CourseEditorField field="description">
          {(controlClassName) => (
            <>
              <label
                htmlFor={`${id}-description`}
                className="block text-sm font-medium"
              >
                {copy.description}
              </label>
              <textarea
                id={`${id}-description`}
                data-builder-field-input="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  markDirty()
                }}
                className={cn(
                  "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                  controlClassName
                )}
                rows={3}
              />
            </>
          )}
        </CourseEditorField>
        <CourseEditorField field="price">
          {(controlClassName) => (
            <>
              <label
                htmlFor={`${id}-price`}
                className="block text-sm font-medium"
              >
                {copy.price}
              </label>
              <input
                id={`${id}-price`}
                data-builder-field-input="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  markDirty()
                }}
                className={cn(
                  "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                  controlClassName
                )}
              />
            </>
          )}
        </CourseEditorField>
        {teacherProfileId != null && (
          <div className="space-y-2 border-t border-border pt-4">
            <CourseCoverPicker
              currentImageUrl={savedCoverUrl}
              file={coverFile}
              onChange={(file) => {
                setCoverFile(file)
                markDirty()
              }}
              disabled={saveStatus === "saving"}
            />
          </div>
        )}
        <div className="border-t border-border pt-4">
          <CurriculumPicker
            subjects={subjects ?? []}
            grades={grades ?? []}
            streams={streams ?? []}
            subjectId={subjectId}
            gradeId={gradeId}
            streamId={streamId}
            onSubjectChange={(value) => {
              setSubjectId(value)
              markDirty()
            }}
            onGradeChange={(value) => {
              setGradeId(value)
              markDirty()
            }}
            onStreamChange={(value) => {
              setStreamId(value)
              markDirty()
            }}
            disabled={saveStatus === "saving"}
          />
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => void handleSave()}
            disabled={!canSave || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <Loader2
                className="me-2 size-4 animate-spin"
                aria-hidden="true"
              />
            ) : saveStatus === "saved" ? (
              <Check className="me-2 size-4" aria-hidden="true" />
            ) : (
              <Save className="me-2 size-4" aria-hidden="true" />
            )}
            {saveStatus === "saving"
              ? copy.saving
              : saveStatus === "saved"
                ? copy.saved
                : copy.save}
          </Button>
          <div aria-live="polite" className="min-h-5 text-sm">
            {saveStatus === "error" && saveError && (
              <p role="alert" className="text-destructive">
                {saveError}
              </p>
            )}
          </div>
        </div>
      </section>

      {curriculum && (
        <section
          aria-labelledby={`${id}-curriculum-title`}
          className="space-y-4 border-t border-border pt-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id={`${id}-curriculum-title`} className="text-base font-bold">
                {curriculumTitle ?? (lang === "ar" ? "المنهج" : "Curriculum")}
              </h2>
              {curriculumHint && (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {curriculumHint}
                </p>
              )}
            </div>
          </div>
          <div
            data-testid="course-curriculum"
            className="rounded-xl bg-muted/20 p-2 sm:p-3"
          >
            {curriculum}
          </div>
        </section>
      )}
    </div>
  )

  return (
    <CourseBuilderBridgeProvider
      enabled={!fullPreviewOpen}
      onSelectTarget={() => {
        onActiveTabChange("edit")
        onFullPreviewOpenChange(false)
      }}
      onCurriculumCommitted={refreshCurriculum}
    >
      <PreviewWorkspace
        editor={editor}
        preview={
          <StudentCourseDetailPreview
            key={curriculumKey}
            model={previewModel}
            locale={locale}
            interactionMode="local-only"
            showEditAffordance
          />
        }
        locale={locale}
        deviceWidth={deviceWidth}
        onDeviceWidthChange={setDeviceWidth}
        activeTab={activeTab}
        onActiveTabChange={onActiveTabChange}
        onFullPreviewOpenChange={onFullPreviewOpenChange}
      />
    </CourseBuilderBridgeProvider>
  )
}

function CourseEditorField({
  field,
  children,
}: {
  field: CourseBuilderField
  children: (controlClassName: string) => ReactNode
}) {
  const {
    hoveredField,
    selectedField,
    setHoveredField,
    highlightField,
    clearSelectedField,
  } = useCourseBuilderBridge()
  const isHovered = hoveredField === field
  const isSelected = selectedField === field
  const controlClassName = cn(
    "transition-[box-shadow,background-color] duration-200",
    (isHovered || isSelected) &&
      "bg-primary/5 ring-2 ring-offset-2 ring-offset-background",
    isHovered && "ring-primary/30",
    isSelected && "ring-primary/55"
  )

  return (
    <div
      data-builder-field={field}
      data-builder-field-state={
        isSelected ? "selected" : isHovered ? "hovered" : "idle"
      }
      onMouseEnter={() => setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
      onFocus={() => highlightField(field)}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          clearSelectedField(field)
        }
      }}
    >
      {children(controlClassName)}
    </div>
  )
}
