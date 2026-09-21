# Create Workspace Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-page course creation workspace at `/courses/new` that mirrors the edit-course preview experience with a simplified live student preview.

**Architecture:** Add a `hideCurriculum` flag to the shared student preview, build a create-mode client workspace that reuses `PreviewWorkspace`, `StudentCourseDetailPreview`, `CourseForm`, and `CourseCoverPicker` with the existing create mutation plus cover-upload PATCH, serve it from a new server route, and point the courses-list Create entry at the new page while deleting the dialog.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, TanStack React Query v5, Zod, Vitest, Testing Library, Base UI-based shared components.

**Spec:** `elemni_dashboard/docs/superpowers/specs/2026-09-21-create-workspace-preview-design.md`

## Global Constraints

- This is a dashboard-only change in `elemni_dashboard/`; do not modify any file under the backend project `elemni/`.
- Creation stays unpublished and unarchived; never send `is_archived` or `is_published: true` on create.
- No pre-creation chapter/lesson/item editing; curriculum tree stays post-creation in the edit workspace.
- Structure selector defaults to flat with no migration confirmation on create.
- Cover-upload failure warns but still redirects to the edit workspace.
- Back/cancel navigation performs no mutation.
- Follow test-driven development: each behavior test must fail for the expected reason before production code changes.
- RTL is the default: no `ml-`/`mr-`/`left-`/`right-` classes; use `ms-`/`me-`/`ps-`/`pe-`/`start`/`end`.
- No hardcoded user-facing strings; everything through `next-intl`.

---

## File Structure

### Create

- `src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx`: hideCurriculum flag regressions for the shared preview.
- `src/features/course-management/components/create-course-workspace.tsx`: client create-mode workspace — draft state, live simplified preview, save-and-redirect.
- `src/features/course-management/__tests__/create-course-workspace.test.tsx`: workspace behavior regressions.
- `app/[locale]/(teacher)/courses/new/page.tsx`: server route — auth guard, curriculum load, workspace render.

### Modify

- `src/features/student-preview/student-course-detail-preview.tsx`: add optional `hideCurriculum` prop that skips the Content section.
- `src/i18n/messages/ar.json`: Arabic create-page copy under `courses`.
- `src/i18n/messages/en.json`: English create-page copy under `courses`.
- `app/[locale]/(teacher)/courses/page.tsx`: replace `CreateCourseDialog` with a link to `/courses/new`.

### Delete

- `src/features/course-management/components/create-course-dialog.tsx`
- Tests dedicated to the deleted dialog, if any reference it exclusively (verify with grep before deleting).

---

### Task 1: Simplified Preview Flag

**Files:**
- Modify: `src/features/student-preview/student-course-detail-preview.tsx:211-228`
- Create: `src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx`

**Interfaces:**
- Produces: `StudentCourseDetailPreview({ ..., hideCurriculum?: boolean })` — defaults to `false`; when `true`, the Content section (`course-preview-content`) is not rendered.
- Preserves: all existing props, hero, tabs, empty-state, and bridge behavior when the flag is absent.

- [ ] **Step 1: Write the failing tests**

Create `src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CourseBuilderBridgeProvider } from "@/features/course-management/course-builder-bridge"
import { StudentCourseDetailPreview } from "../student-course-detail-preview"
import type { StudentCoursePreviewModel } from "../types"

const model: StudentCoursePreviewModel = {
  id: "preview",
  title: "Physics",
  description: "Full syllabus",
  coverUrl: null,
  price: "100",
  subject: "Physics",
  grade: null,
  stream: null,
  teacher: { name: "Mona", avatarUrl: null },
  sections: [
    {
      id: 1,
      title: "Unit 1",
      lessons: [
        {
          id: 2,
          title: "Lesson 1",
          description: null,
          durationMinutes: 30,
          items: [],
        },
      ],
    },
  ],
}

function renderPreview(hideCurriculum?: boolean) {
  return render(
    <CourseBuilderBridgeProvider enabled={false}>
      <StudentCourseDetailPreview
        model={model}
        locale="en"
        interactionMode="local-only"
        hideCurriculum={hideCurriculum}
      />
    </CourseBuilderBridgeProvider>
  )
}

describe("StudentCourseDetailPreview hideCurriculum", () => {
  it("renders the content section by default", () => {
    renderPreview()
    expect(screen.getByText("Course plan")).toBeDefined()
  })

  it("hides the content section when hideCurriculum is true", () => {
    renderPreview(true)
    expect(screen.queryByText("Course plan")).toBeNull()
    expect(screen.getByText("Physics")).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
npm test -- src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx
```

Expected: FAIL with a TypeScript error because `hideCurriculum` does not exist on the props type.

- [ ] **Step 3: Implement the flag**

In `src/features/student-preview/student-course-detail-preview.tsx`, extend the props interface:

```ts
interface StudentCourseDetailPreviewProps {
  model: StudentCoursePreviewModel
  locale: string
  /** @deprecated The preview always represents the public student view. */
  viewer?: "guest" | "subscribed"
  interactionMode: PreviewInteractionMode
  onCurriculumCommitted?: () => void
  selectedNode?: CourseBuilderNode | null
  onSelectNode?: (node: CourseBuilderNode) => void
  showEditAffordance?: boolean
  /** Hides the curriculum content section for pre-creation previews. */
  hideCurriculum?: boolean
}
```

Destructure with default `hideCurriculum = false` and wrap the Content section so it only renders when the flag is false:

```tsx
{!hideCurriculum && (
  <section
    id="course-preview-content"
    className="scroll-mt-24 pt-8"
    aria-labelledby="course-preview-content-title"
  >
```

Close the conditional after the existing `</section>` of the content block. Do not touch the hero, tabs, or empty-state markup.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx
npx eslint src/features/student-preview/student-course-detail-preview.tsx src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx
```

Expected: both tests PASS and lint exits zero.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview/student-course-detail-preview.tsx src/features/student-preview/__tests__/student-course-detail-preview-hide.test.tsx
git commit -m "feat: hide curriculum section in pre-creation preview"
```

---

### Task 2: Create Workspace Component And Copy

**Files:**
- Create: `src/features/course-management/components/create-course-workspace.tsx`
- Create: `src/features/course-management/__tests__/create-course-workspace.test.tsx`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `CreateCourseWorkspace({ locale, teacherProfileId, teacherName, subjects, grades, streams })` with all props required; `locale: string`, `teacherProfileId: number`, `teacherName: string`, `subjects: SubjectOut[]`, `grades: GradeOut[]`, `streams: StreamOut[]`.
- Consumes: `CourseForm` values via `onChange`, `formValuesToCourseCreate`, `courseFormSchema`, `useCourseMutations(teacherProfileId).create/update`, `uploadCourseCover`, `buildCoursePreviewModel`, `PreviewWorkspace`, `StudentCourseDetailPreview` with `hideCurriculum`, `CourseBuilderBridgeProvider enabled={false}`, `useRouter` from `@/i18n/routing`, `toast` from `sonner`, `getActionError` from `@/lib/query-action`.
- Produces: on save success, `router.push('/${locale}/courses/${course.id}')`.

- [ ] **Step 1: Add the locale copy**

In `src/i18n/messages/en.json` under `courses`, add:

```json
"create_title": "Create a new course",
"create_subtitle": "Fill in the details and watch the student preview update live.",
"save_and_continue": "Save and continue",
"back_to_courses": "Back to courses",
"title_required": "Course title is required"
```

In `src/i18n/messages/ar.json` under `courses`, add:

```json
"create_title": "إنشاء دورة جديدة",
"create_subtitle": "املأ التفاصيل وشاهد معاينة الطالب تتحدث لحظياً.",
"save_and_continue": "حفظ ومتابعة",
"back_to_courses": "العودة إلى الدورات",
"title_required": "عنوان الدورة مطلوب"
```

- [ ] **Step 2: Write the failing workspace tests**

Create `src/features/course-management/__tests__/create-course-workspace.test.tsx`:

```tsx
import { beforeEach, describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import { CreateCourseWorkspace } from "../components/create-course-workspace"

const createMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const updateMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
const mockedUploadCourseCover = vi.hoisted(() => vi.fn())
const mockedPush = vi.hoisted(() => vi.fn())

vi.mock("@/features/course-management/hooks/use-course-management-queries", () => ({
  useCourseMutations: () => ({ create: createMutation, update: updateMutation }),
}))

vi.mock("@/features/course-management/upload-course-cover", () => ({
  uploadCourseCover: mockedUploadCourseCover,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockedPush }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const messages = {
  courses: {
    create_title: "Create a new course",
    create_subtitle: "Fill in the details.",
    save_and_continue: "Save and continue",
    back_to_courses: "Back to courses",
    title_required: "Course title is required",
    title_label: "Course Title",
    description_label: "Description",
    subject_label: "Subject",
    grade_label: "Grade",
    stream_label: "Stream",
    chapters_organized: "Organized into chapters",
    flat_lessons: "Flat list of lessons",
    loading_curriculum: "Loading...",
    cover_label: "Course cover",
    cover_upload: "Upload cover",
    cover_replace: "Replace cover",
    cover_hint: "JPG, PNG, or WebP up to 5 MB",
    cover_invalid_type: "Choose a JPG, PNG, or WebP image",
    cover_too_large: "The cover must be 5 MB or smaller",
    cover_clear_selection: "Clear selection",
    course_created: "Course created successfully",
    course_created_cover_failed: "Cover failed",
    error_upstream: "Service temporarily unavailable",
    price_label: "Price (EGP)",
    price_hint: "Enter a price",
    egp: "EGP",
    free: "Free",
    saving: "Saving...",
    cancel: "Cancel",
  },
}

const curriculum = {
  subjects: [{ id: 1, name: "Physics", slug: "physics", grades: [], streams: [] }],
  grades: [{ id: 3, name: "Grade 1", level: "secondary" }],
  streams: [{ id: 5, name: "Science", slug: "science" }],
}

function renderWorkspace() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={new QueryClient()}>
        <CreateCourseWorkspace
          locale="en"
          teacherProfileId={7}
          teacherName="Mona"
          subjects={curriculum.subjects}
          grades={curriculum.grades}
          streams={curriculum.streams}
        />
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

describe("CreateCourseWorkspace", () => {
  beforeEach(() => {
    createMutation.mutateAsync.mockReset()
    updateMutation.mutateAsync.mockReset()
    mockedUploadCourseCover.mockReset()
    mockedPush.mockReset()
    createMutation.mutateAsync.mockResolvedValue({ id: 9 })
    updateMutation.mutateAsync.mockResolvedValue({ id: 9 })
    mockedUploadCourseCover.mockResolvedValue("covers/9.png")
  })

  it("renders the editor and the simplified live preview", () => {
    renderWorkspace()
    expect(screen.getByText("Create a new course")).toBeDefined()
    expect(screen.queryByText("Course plan")).toBeNull()
  })

  it("blocks save without a title and sends no request", async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(screen.getByText("Course title is required")).toBeDefined()
    )
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it("creates the draft and navigates to the edit workspace", async () => {
    renderWorkspace()
    fireEvent.change(screen.getByLabelText("Course Title"), {
      target: { value: "Physics" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Physics", is_published: false })
      )
    )
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/en/courses/9")
    )
  })

  it("still navigates when the cover upload fails", async () => {
    mockedUploadCourseCover.mockRejectedValueOnce(new Error("boom"))
    renderWorkspace()
    fireEvent.change(screen.getByLabelText("Course Title"), {
      target: { value: "Physics" },
    })
    const file = new File(["cover"], "cover.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }))
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/en/courses/9")
    )
  })
})
```

Note: `CourseForm` emits values through `onChange` only after a field change; the change events above trigger the emission. `CourseCoverPicker` renders a hidden file input, so the `input[type="file"]` selector in the fourth test resolves and the rejected upload exercises the warning path. jsdom lacks `URL.createObjectURL`, so polyfill it in the test `beforeEach`:

```ts
Object.assign(URL, {
  createObjectURL: vi.fn(() => "blob:cover"),
  revokeObjectURL: vi.fn(),
})
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
npm test -- src/features/course-management/__tests__/create-course-workspace.test.tsx
```

Expected: FAIL because `create-course-workspace.tsx` does not exist (import error).

- [ ] **Step 4: Implement the workspace component**

Create `src/features/course-management/components/create-course-workspace.tsx`:

```tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CourseForm } from "./course-form"
import { CourseCoverPicker } from "./course-cover-picker"
import { PreviewWorkspace } from "@/features/student-preview/preview-workspace"
import { StudentCourseDetailPreview } from "@/features/student-preview/student-course-detail-preview"
import { buildCoursePreviewModel } from "@/features/student-preview/build-course-preview-model"
import { CourseBuilderBridgeProvider } from "@/features/course-management/course-builder-bridge"
import {
  courseFormSchema,
  formValuesToCourseCreate,
  type CourseFormValues,
  type GradeOut,
  type StreamOut,
  type SubjectOut,
} from "@/features/course-management/schema"
import { useCourseMutations } from "@/features/course-management/hooks/use-course-management-queries"
import { uploadCourseCover } from "@/features/course-management/upload-course-cover"
import { getActionError } from "@/lib/query-action"
import { useRouter } from "@/i18n/routing"

const emptyValues: CourseFormValues = {
  title: "",
  description: null,
  price: "0.00",
  subjectId: 0,
  gradeId: 0,
  streamId: 0,
  useChapters: false,
}

export function CreateCourseWorkspace({
  locale,
  teacherProfileId,
  teacherName,
  subjects,
  grades,
  streams,
}: {
  locale: string
  teacherProfileId: number
  teacherName: string
  subjects: SubjectOut[]
  grades: GradeOut[]
  streams: StreamOut[]
}) {
  const t = useTranslations("courses")
  const router = useRouter()
  const { create, update } = useCourseMutations(teacherProfileId)
  const [formValues, setFormValues] = useState<CourseFormValues | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const coverObjectUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  )

  useEffect(() => {
    return () => {
      if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl)
    }
  }, [coverObjectUrl])

  const values = formValues ?? emptyValues
  const previewModel = useMemo(
    () =>
      buildCoursePreviewModel({
        courseId: null,
        values,
        coverObjectUrl,
        publicCoverUrl: null,
        teacher: { name: teacherName, avatarUrl: null },
        subjects,
        grades,
        streams,
        sections: [],
        locale,
      }),
    [values, coverObjectUrl, teacherName, subjects, grades, streams, locale]
  )

  const handleSave = useCallback(async () => {
    setApiErrors({})
    setError(null)
    const parsed = courseFormSchema.safeParse(formValues ?? emptyValues)
    if (!parsed.success) {
      const fieldMap: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "")
        if (key === "title" && !fieldMap.title) fieldMap.title = t("title_required")
        else if (key && !fieldMap[key]) fieldMap[key] = issue.message
      }
      setApiErrors(fieldMap)
      return
    }

    setSubmitting(true)
    try {
      const body = formValuesToCourseCreate(parsed.data)
      const course = await create.mutateAsync(body)
      let coverFailed = false
      if (coverFile) {
        try {
          const imagePath = await uploadCourseCover(course.id, coverFile)
          await update.mutateAsync({ courseId: course.id, data: { img: imagePath } })
        } catch {
          coverFailed = true
          toast.warning(t("course_created_cover_failed"))
        }
      }
      if (!coverFailed) toast.success(t("course_created"))
      router.push(`/${locale}/courses/${course.id}`)
    } catch (err) {
      const actionError = getActionError(err)
      if (actionError?.type === "Validation" && actionError.fields) {
        const fieldMap: Record<string, string> = {}
        actionError.fields.forEach((field) => {
          fieldMap[field.replace("body.", "")] = actionError.message
        })
        setApiErrors(fieldMap)
      } else {
        setError(actionError?.message ?? t("error_upstream"))
      }
    } finally {
      setSubmitting(false)
    }
  }, [coverFile, create, formValues, locale, router, t, update])

  const editor = (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-headline-md font-bold">{t("create_title")}</h1>
        <p className="mt-1 text-sm text-on-surface-muted">{t("create_subtitle")}</p>
      </div>
      <CourseForm
        subjects={subjects}
        grades={grades}
        streams={streams}
        onChange={setFormValues}
        errors={apiErrors}
        disabled={submitting}
      />
      <CourseCoverPicker
        currentImageUrl={null}
        file={coverFile}
        onChange={setCoverFile}
        disabled={submitting}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={() => void handleSave()} disabled={submitting}>
        {submitting ? t("saving") : t("save_and_continue")}
      </Button>
    </div>
  )

  const preview = (
    <CourseBuilderBridgeProvider enabled={false}>
      <StudentCourseDetailPreview
        model={previewModel}
        locale={locale}
        interactionMode="local-only"
        hideCurriculum
      />
    </CourseBuilderBridgeProvider>
  )

  return <PreviewWorkspace editor={editor} preview={preview} locale={locale} />
}
```

Notes for the implementer: `CourseForm` requires `subjectId`/`gradeId`/`streamId` as numbers; `0` is the empty sentinel and fails `courseFormSchema` int validation only when the teacher never picks a real entry — but `z.number().int()` accepts `0`, so require real selection by treating `0` as missing before parsing: if any of `subjectId`, `gradeId`, `streamId` is `0`, set the corresponding field error from the schema message and return before `safeParse`. Keep the title error mapped to `t("title_required")` exactly as above. `previewModel` sections stay `[]` so nothing pre-creation renders as curriculum.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- src/features/course-management/__tests__/create-course-workspace.test.tsx
npx eslint src/features/course-management/components/create-course-workspace.tsx src/features/course-management/__tests__/create-course-workspace.test.tsx
```

Expected: all tests PASS and lint exits zero. If `CourseForm` does not emit `onChange` on first render, the empty-title test passes trivially (no request sent) and the valid-title test drives emission via the change event — both deterministic.

- [ ] **Step 6: Commit**

```bash
git add src/features/course-management/components/create-course-workspace.tsx src/features/course-management/__tests__/create-course-workspace.test.tsx src/i18n/messages/ar.json src/i18n/messages/en.json
git commit -m "feat: create course from preview workspace"
```

---

### Task 3: Route, Entry Switch, And Dialog Removal

**Files:**
- Create: `app/[locale]/(teacher)/courses/new/page.tsx`
- Modify: `app/[locale]/(teacher)/courses/page.tsx:9,100`
- Delete: `src/features/course-management/components/create-course-dialog.tsx`
- Delete: tests that exclusively cover the deleted dialog (confirm with grep first).

**Interfaces:**
- Produces: route `/[locale]/courses/new` rendering `CreateCourseWorkspace` with teacher curriculum.
- Produces: courses-list header renders a Create link (`id="create-course-trigger"`) to `/courses/new`.
- Removes: all production imports of `CreateCourseDialog`.

- [ ] **Step 1: Confirm the dialog is only used once**

Run:

```bash
rg "CreateCourseDialog" app src --glob '*.tsx' --glob '*.ts'
```

Expected: matches in `app/[locale]/(teacher)/courses/page.tsx` and `src/features/course-management/components/create-course-dialog.tsx` only. If another caller appears, stop and keep the dialog; switch only the courses-list entry and record the remaining caller in the commit message.

- [ ] **Step 2: Create the route page**

Create `app/[locale]/(teacher)/courses/new/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server"
import { verifySession } from "@/lib/auth/dal"
import { getTeacherProfile } from "@/features/profile/queries"
import { redirectToAuth } from "@/lib/auth/redirect"
import { CreateCourseWorkspace } from "@/features/course-management/components/create-course-workspace"

export const dynamic = "force-dynamic"

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "courses" })
  const session = await verifySession()
  if (!session) {
    return redirectToAuth(locale, `/${locale}/courses/new`)
  }

  let profile: Awaited<ReturnType<typeof getTeacherProfile>> | null = null
  try {
    profile = await getTeacherProfile()
  } catch (error: unknown) {
    const apiError = error as { type?: string }
    if (apiError.type === "Unauthorized") {
      return redirectToAuth(locale, `/${locale}/courses/new`)
    }
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{t("curriculum_unavailable")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CreateCourseWorkspace
        locale={locale}
        teacherProfileId={session.id ?? 0}
        teacherName={profile?.name ?? ""}
        subjects={profile?.subjects ?? []}
        grades={profile?.grades ?? []}
        streams={profile?.streams ?? []}
      />
    </div>
  )
}
```

`TeacherProfile` carries `name`, `subjects`, `grades`, `streams` — the same fields the edit page reads from it.

- [ ] **Step 3: Switch the courses-list entry**

In `app/[locale]/(teacher)/courses/page.tsx`, replace the dialog import:

```tsx
import { CreateCourseDialog } from "@/features/course-management/components/create-course-dialog"
```

with:

```tsx
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
```

and replace:

```tsx
<CreateCourseDialog teacherProfileId={teacherProfileId} />
```

with:

```tsx
<Button
  id="create-course-trigger"
  render={
    <Link href="/courses/new">
      <Plus data-icon="inline-start" />
      {t("create")}
    </Link>
  }
/>
```

`Button` is the Base UI primitive and supports the `render` prop for polymorphic rendering; `Link` is the next-intl locale-aware navigation. Keep the `id="create-course-trigger"` so existing E2E selectors survive.

- [ ] **Step 4: Delete the dialog and its exclusive tests**

Run the grep from Step 1 again to confirm no production import remains, then delete:

```bash
git rm src/features/course-management/components/create-course-dialog.tsx
```

Grep tests for exclusive dialog coverage (`create-course-dialog`, `CreateCourseDialog`, `create-course-trigger`) and delete only files with no remaining purpose. Do not delete shared `course-form` or `course-cover-picker` tests.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
```

Expected: full suite passes, typecheck and lint exit zero, `git diff --check` prints nothing. Confirm no backend file changed:

```bash
git status --short
git diff --name-only HEAD | rg '^elemni/'
```

Expected: the backend path search prints nothing (`elemni_dashboard/` lines are fine; bare `elemni/` is the backend).

- [ ] **Step 6: Commit**

```bash
git add 'app/[locale]/(teacher)/courses/new/page.tsx' 'app/[locale]/(teacher)/courses/page.tsx' src/features/course-management/components/create-course-dialog.tsx
git commit -m "refactor: route course creation through preview workspace"
```

Include any deleted test files in the same commit.

---

## Final Acceptance Checklist

- [ ] `/courses/new` renders the editor beside the simplified live preview with no curriculum block.
- [ ] Typing title, description, price, or changing placement updates the preview live.
- [ ] Empty title blocks save with `title_required` and sends no request.
- [ ] Save creates an unpublished, unarchived draft and navigates to `/[locale]/courses/[id]`.
- [ ] Cover failure warns via `course_created_cover_failed` and still navigates.
- [ ] Courses list Create entry links to `/courses/new`; no `CreateCourseDialog` import remains.
- [ ] AR and EN render with correct direction and copy.
- [ ] Full dashboard verification is green and no backend file changed.
