# Remaining Tasks: Data Flow, Server Function, Route Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the data flow layer, server function, editor callback, and route wiring for the student preview feature.

**Architecture:** Follow existing codebase patterns: server actions return `{ success, data/error }` unions, client state uses `useState`, no React Query for teacher features. Server functions use `apiFetch()` with Zod validation.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Zod, `iron-session`, existing `apiFetch()` client.

## Global Constraints

- All work in `elemni_dashboard` worktree `.worktrees/feat/dashboard-student-previews`
- No edits to `elemni_front_end` or `elemni_public_ui`
- No `@elemni/public-ui` dependency
- No cross-repo imports
- No `framer-motion` / `motion` (not installed)
- Dashboard uses Tailwind CSS v4 with `@theme inline` in `globals.css`
- TDD: write failing tests first, then implement
- Server actions return `ActionResult<T>` discriminated unions
- Client state uses `useState` (no React Query for teacher features)

---

### Task 1: `PreviewActionResult` Type + `loadCoursePreviewCurriculum` Server Function

**Files:**
- Create: `src/features/student-preview/server-actions.ts`
- Create: `src/features/student-preview/__tests__/server-actions.test.ts`
- Modify: `src/features/student-preview/types.ts` (add `PreviewActionResult`)

**Interfaces:**
- Consumes: `StudentPreviewSection` from `types.ts`, existing `apiFetch()`, `verifySession()`, `listChapters()`, `listLessons()`, `listItems()` from course-management
- Produces: `PreviewActionResult<T>` type, `loadCoursePreviewCurriculum(courseId: number)` server function

- [ ] **Step 1: Add `PreviewActionResult` type to types.ts**

Append to `src/features/student-preview/types.ts`:

```ts
export type PreviewActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };
```

- [ ] **Step 2: Write failing test for `loadCoursePreviewCurriculum`**

Create `src/features/student-preview/__tests__/server-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only modules
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/auth/dal", () => ({ verifySession: vi.fn() }));
vi.mock("@/features/course-management/chapters-queries", () => ({ listChapters: vi.fn() }));
vi.mock("@/features/course-management/lessons-queries", () => ({ listLessons: vi.fn() }));
vi.mock("@/features/course-management/items-queries", () => ({ listItems: vi.fn() }));

import { loadCoursePreviewCurriculum } from "../server-actions";
import { verifySession } from "@/lib/auth/dal";
import { listChapters } from "@/features/course-management/chapters-queries";
import { listLessons } from "@/features/course-management/lessons-queries";
import { listItems } from "@/features/course-management/items-queries";

describe("loadCoursePreviewCurriculum", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (verifySession as any).mockResolvedValue({ id: 1, role: "TEACHER" });
    (listChapters as any).mockResolvedValue([
      { id: 10, course_id: 42, title: "Chapter 1", order: 1 },
    ]);
    (listLessons as any).mockResolvedValue([
      { id: 20, course_id: 42, chapter_id: 10, title: "Lesson 1", description: "Desc", order: 1 },
    ]);
    (listItems as any).mockResolvedValue([
      { id: 30, lesson_id: 20, title: "Item 1", bunny_stream_id: "vid123", document_path: null, exam_id: null, order: 1 },
    ]);
  });

  it("returns sections on success", async () => {
    const result = await loadCoursePreviewCurriculum(42);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Chapter 1");
      expect(result.data[0].lessons[0].title).toBe("Lesson 1");
    }
  });

  it("returns error when session is null", async () => {
    (verifySession as any).mockResolvedValue(null);
    const result = await loadCoursePreviewCurriculum(42);
    expect(result.success).toBe(false);
  });

  it("strips protected URLs from items", async () => {
    (listItems as any).mockResolvedValue([
      { id: 30, lesson_id: 20, title: "Item 1", bunny_stream_id: "vid123", document_path: "/secret/doc.pdf", exam_id: null, order: 1 },
    ]);
    const result = await loadCoursePreviewCurriculum(42);
    expect(result.success).toBe(true);
    if (result.success) {
      const item = result.data[0].lessons[0].items[0];
      expect(item.hasVideo).toBe(true);
      expect(item.hasDocument).toBe(false); // stripped
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/server-actions.test.ts`
Expected: FAIL — `loadCoursePreviewCurriculum` not found

- [ ] **Step 4: Implement `loadCoursePreviewCurriculum`**

Create `src/features/student-preview/server-actions.ts`:

```ts
"use server";

import { verifySession } from "@/lib/auth/dal";
import { listChapters } from "@/features/course-management/chapters-queries";
import { listLessons } from "@/features/course-management/lessons-queries";
import { listItems } from "@/features/course-management/items-queries";
import type { StudentPreviewSection, PreviewActionResult } from "./types";

export async function loadCoursePreviewCurriculum(
  courseId: number
): Promise<PreviewActionResult<StudentPreviewSection[]>> {
  try {
    const session = await verifySession();
    if (!session) {
      return { success: false, error: { type: "Unauthorized", message: "يجب تسجيل الدخول" } };
    }

    const chapters = await listChapters(courseId);
    const lessons = await listLessons(courseId);
    const items = await listItems(courseId);

    const lessonsByChapter = new Map<number | null, typeof lessons>();
    for (const lesson of lessons) {
      const key = lesson.chapter_id ?? null;
      if (!lessonsByChapter.has(key)) lessonsByChapter.set(key, []);
      lessonsByChapter.get(key)!.push(lesson);
    }

    const itemsByLesson = new Map<number, typeof items>();
    for (const item of items) {
      if (!itemsByLesson.has(item.lesson_id)) itemsByLesson.set(item.lesson_id, []);
      itemsByLesson.get(item.lesson_id)!.push(item);
    }

    const sections: StudentPreviewSection[] = chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      lessons: (lessonsByChapter.get(chapter.id) ?? []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: null,
        items: (itemsByLesson.get(lesson.id) ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          hasVideo: !!item.bunny_stream_id,
          hasDocument: false, // strip protected URLs
          hasExam: !!item.exam_id,
        })),
      })),
    }));

    return { success: true, data: sections };
  } catch (error) {
    return { success: false, error: { type: "Server", message: "فشل تحميل المنهج" } };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/server-actions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/student-preview/types.ts src/features/student-preview/server-actions.ts src/features/student-preview/__tests__/server-actions.test.ts
git commit -m "feat: add loadCoursePreviewCurriculum server function"
```

---

### Task 2: `onCurriculumCommitted` Callback Type + Workspace Integration

**Files:**
- Modify: `src/features/student-preview/types.ts` (add callback type)
- Modify: `src/features/student-preview/student-course-detail-preview.tsx` (accept callback)
- Test: `src/features/student-preview/__tests__/student-course-detail-preview.test.tsx`

**Interfaces:**
- Consumes: existing `StudentCourseDetailPreview` component
- Produces: `onCurriculumCommitted` prop on the course detail preview

- [ ] **Step 1: Add callback prop type**

The `StudentCourseDetailPreview` component already accepts `viewer` and `interactionMode`. Add an optional `onCurriculumCommitted` prop. The component itself won't call it — it's a signal for the parent workspace to reload curriculum.

No type changes needed — the callback is a prop on the component, not a type in types.ts.

- [ ] **Step 2: Write failing test**

Append to `src/features/student-preview/__tests__/student-course-detail-preview.test.tsx`:

```tsx
it("does not call onCurriculumCommitted (preview is read-only)", () => {
  const onCommitted = vi.fn();
  render(
    <StudentCourseDetailPreview
      model={baseModel}
      locale="ar"
      viewer="guest"
      interactionMode="local-only"
      onCurriculumCommitted={onCommitted}
    />
  );
  // Preview is local-only, callback is never triggered by the renderer
  expect(onCommitted).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Add prop to component**

In `student-course-detail-preview.tsx`, add `onCurriculumCommitted?: () => void` to the props interface. The component doesn't call it — it's a pass-through for the workspace.

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/student-course-detail-preview.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview/student-course-detail-preview.tsx src/features/student-preview/__tests__/student-course-detail-preview.test.tsx
git commit -m "feat: add onCurriculumCommitted callback prop to course detail preview"
```

---

### Task 3: Profile Workspace (Draft State + Preview Wiring)

**Files:**
- Create: `src/features/student-preview/profile-workspace.tsx`
- Create: `src/features/student-preview/__tests__/profile-workspace.test.tsx`

**Interfaces:**
- Consumes: `buildTeacherPreviewModel`, `PreviewWorkspace`, `StudentTeacherProfilePreview`, `TeacherProfile` type
- Produces: `ProfileWorkspace` component that manages draft state and preview updates

- [ ] **Step 1: Write failing tests**

Create `src/features/student-preview/__tests__/profile-workspace.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileWorkspace } from "../profile-workspace";
import type { TeacherProfile } from "@/features/profile/schema";
import type { CourseOut } from "@/features/shell/schema";

const mockProfile: TeacherProfile = {
  id: 1,
  name: "أحمد علي",
  email: "ahmed@example.com",
  slug: "ahmed-ali",
  phone_number: null,
  description: "مدرس فيزياء",
  location: "القاهرة",
  experience: 5,
  img: null,
  subjects: [{ id: 1, name: "فيزياء", slug: "physics", grades: [], streams: [] }],
  grades: [{ id: 1, name: "الصف الثالث", level: "secondary" }],
  streams: [],
};

const mockCourses: CourseOut[] = [];

describe("ProfileWorkspace", () => {
  it("renders editor and preview", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    expect(screen.getByText("أحمد علي")).toBeDefined();
  });

  it("updates preview when name changes", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    // Name should be editable in the editor
    const nameInput = screen.getByDisplayValue("أحمد علي");
    fireEvent.change(nameInput, { target: { value: "محمد علي" } });
    expect(screen.getByText("محمد علي")).toBeDefined();
  });

  it("shows save button", () => {
    render(
      <ProfileWorkspace profile={mockProfile} courses={mockCourses} locale="ar" publicImageUrl={null} />
    );
    expect(screen.getByRole("button", { name: /حفظ|Save/ })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/profile-workspace.test.tsx`
Expected: FAIL — `ProfileWorkspace` not found

- [ ] **Step 3: Implement ProfileWorkspace**

Create `src/features/student-preview/profile-workspace.tsx`:

```tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { TeacherProfile } from "@/features/profile/schema";
import type { CourseOut } from "@/features/shell/schema";
import { buildTeacherPreviewModel } from "./build-teacher-preview-model";
import { PreviewWorkspace } from "./preview-workspace";
import { StudentTeacherProfilePreview } from "./student-teacher-profile-preview";

interface ProfileWorkspaceProps {
  profile: TeacherProfile;
  courses: CourseOut[];
  locale: string;
  publicImageUrl: string | null;
}

const COPY = {
  ar: { edit: "تعديل الملف", save: "حفظ" },
  en: { edit: "Edit Profile", save: "Save" },
};

export function ProfileWorkspace({
  profile,
  courses,
  locale,
  publicImageUrl,
}: ProfileWorkspaceProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en";
  const copy = COPY[lang];

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.description ?? "");
  const [location_, setLocation] = useState(profile.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(publicImageUrl);
  const [dirty, setDirty] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleAvatarChange = useCallback((file: File | null) => {
    // Revoke previous object URL
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current = [];

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      setAvatarUrl(url);
    } else {
      setAvatarUrl(null);
    }
    markDirty();
  }, [markDirty]);

  // Revoke on unmount
  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const previewModel = buildTeacherPreviewModel(
    { ...profile, name, description: bio, location: location_ },
    avatarUrl,
    courses
  );

  const editor = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">{copy.edit}</h2>
      <div>
        <label className="block text-sm font-medium">الاسم</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">النبذة</label>
        <textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">الموقع</label>
        <input
          type="text"
          value={location_}
          onChange={(e) => { setLocation(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">الصورة</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
          className="w-full"
        />
      </div>
      <button
        type="button"
        disabled={!dirty}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {copy.save}
      </button>
    </div>
  );

  return (
    <PreviewWorkspace
      editor={editor}
      preview={<StudentTeacherProfilePreview model={previewModel} locale={locale} interactionMode="local-only" />}
      locale={locale}
    />
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/profile-workspace.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview/profile-workspace.tsx src/features/student-preview/__tests__/profile-workspace.test.tsx
git commit -m "feat: add ProfileWorkspace with draft state and preview updates"
```

---

### Task 4: Course Workspace (Metadata + Curriculum State)

**Files:**
- Create: `src/features/student-preview/course-workspace.tsx`
- Create: `src/features/student-preview/__tests__/course-workspace.test.tsx`

**Interfaces:**
- Consumes: `buildCoursePreviewModel`, `PreviewWorkspace`, `StudentCourseDetailPreview`, `loadCoursePreviewCurriculum`
- Produces: `CourseWorkspace` component

- [ ] **Step 1: Write failing tests**

Create `src/features/student-preview/__tests__/course-workspace.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CourseWorkspace } from "../course-workspace";
import type { StudentCoursePreviewModel, StudentPreviewSection } from "../types";

const mockModel: StudentCoursePreviewModel = {
  id: 42,
  title: "كورس الفيزياء",
  description: "شرح شامل",
  coverUrl: null,
  price: "200",
  subject: "فيزياء",
  grade: null,
  stream: null,
  teacher: { name: "محمد علي", avatarUrl: null },
  sections: [],
};

describe("CourseWorkspace", () => {
  it("renders editor and preview", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    expect(screen.getByText("كورس الفيزياء")).toBeDefined();
  });

  it("updates preview when title changes", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    const titleInput = screen.getByDisplayValue("كورس الفيزياء");
    fireEvent.change(titleInput, { target: { value: "كورس رياضيات" } });
    expect(screen.getByText("كورس رياضيات")).toBeDefined();
  });

  it("toggles viewer mode", () => {
    render(
      <CourseWorkspace model={mockModel} locale="ar" viewer="guest" />
    );
    const viewerToggle = screen.getByRole("radio", { name: /مشترك|Subscribed/ });
    fireEvent.click(viewerToggle);
    expect(viewerToggle.getAttribute("aria-checked")).toBe("true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/course-workspace.test.tsx`
Expected: FAIL — `CourseWorkspace` not found

- [ ] **Step 3: Implement CourseWorkspace**

Create `src/features/student-preview/course-workspace.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import type { StudentCoursePreviewModel, StudentPreviewSection } from "./types";
import { buildCoursePreviewModel } from "./build-course-preview-model";
import { PreviewWorkspace } from "./preview-workspace";
import { StudentCourseDetailPreview } from "./student-course-detail-preview";

interface CourseWorkspaceProps {
  model: StudentCoursePreviewModel;
  locale: string;
  viewer: "guest" | "subscribed";
  initialSections?: StudentPreviewSection[];
}

const COPY = {
  ar: { edit: "تعديل الكورس", guest: "زائر", subscribed: "مشترك" },
  en: { edit: "Edit Course", guest: "Guest", subscribed: "Subscribed" },
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

  const previewModel = buildCoursePreviewModel(
    { ...model, title, description, price },
    model.coverUrl,
    model.teacher,
    sections
  );

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
        <label className="block text-sm font-medium">العنوان</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">السعر</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">عرض الكورس</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewer("guest")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewer === "guest" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {copy.guest}
          </button>
          <button
            type="button"
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
    />
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/course-workspace.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview/course-workspace.tsx src/features/student-preview/__tests__/course-workspace.test.tsx
git commit -m "feat: add CourseWorkspace with metadata, viewer toggle, and curriculum reload"
```

---

### Task 5: Route Pages (Wire into Profile and Course Edit)

**Files:**
- Modify: `app/[locale]/(teacher)/profile/page.tsx` (add PreviewWorkspace)
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx` (add PreviewWorkspace)

**Interfaces:**
- Consumes: `ProfileWorkspace`, `CourseWorkspace`, existing page data loading
- Produces: Profile and course pages with split-view preview

- [ ] **Step 1: Read existing profile page**

Read `app/[locale]/(teacher)/profile/page.tsx` to understand current structure.

- [ ] **Step 2: Add ProfileWorkspace to profile page**

Import `ProfileWorkspace` and render it alongside the existing content. The page is a server component — pass data as props to the client `ProfileWorkspace`.

- [ ] **Step 3: Read existing course edit page**

Read `app/[locale]/(teacher)/courses/[courseId]/page.tsx` to understand current structure.

- [ ] **Step 4: Add CourseWorkspace to course page**

Import `CourseWorkspace` and render it. Pass the course data and curriculum sections.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 6: Run lint**

Run: `npx eslint src/features/student-preview/ app/`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/\(teacher\)/profile/page.tsx app/[locale]/\(teacher\)/courses/\[courseId\]/page.tsx
git commit -m "feat: wire ProfileWorkspace and CourseWorkspace into route pages"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Run lint**

Run: `npx eslint src/features/student-preview/`
Expected: 0 errors

- [ ] **Step 4: Verify existing preview component tests still pass**

The existing `StudentCourseDetailPreview` and `StudentTeacherProfilePreview` tests must still pass unchanged.
