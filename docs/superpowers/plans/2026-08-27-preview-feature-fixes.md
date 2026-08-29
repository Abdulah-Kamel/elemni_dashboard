# Preview Feature Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix responsiveness, missing data, and incomplete editing in the student preview feature

**Architecture:** Fix the preview workspace grid for mobile, populate course preview with real data, add image preview/remove to profile workspace, and use translation keys instead of hardcoded Arabic

**Tech Stack:** Next.js 16, Tailwind CSS v4, React, next-intl, lucide-react

## Global Constraints

- All work in `elemni_dashboard`. No edits to `elemni_front_end` or `elemni_public_ui`
- No `@elemni/public-ui` dependency. No cross-repo imports
- Dashboard uses Tailwind CSS v4 with `@theme inline` in `app/globals.css`. No `tailwindcss.config.ts`
- Native `<img>` elements required (not `next/image`) for object URLs and CDN URLs
- Font: Scheherazade New (`Scheherazade_New`)

---

## Task 1: Fix PreviewWorkspace Responsive Grid

**Files:**
- Modify: `src/features/student-preview/preview-workspace.tsx`

**Problem:** The grid uses `lg:grid-cols-[3fr_2fr]` which only applies at the `lg` breakpoint. On mobile, both panes exist in the DOM but one is hidden via `hidden`/`block`. The grid structure doesn't collapse properly on small screens.

**Fix:** Ensure the grid uses a single column on mobile and the two-column layout only on `lg`.

- [ ] **Step 1: Update the grid class**

In `preview-workspace.tsx`, the grid div at line 240-244:
```tsx
<div
  data-testid="workspace-grid"
  dir="ltr"
  className={cn("grid", LAYOUT_COLUMNS[layoutMode])}
>
```

Change to ensure single column on mobile:
```tsx
<div
  data-testid="workspace-grid"
  dir="ltr"
  className={cn("grid grid-cols-1", LAYOUT_COLUMNS[layoutMode])}
>
```

The `LAYOUT_COLUMNS` already uses `lg:` prefix, so this should work.

- [ ] **Step 2: Verify the tabs work on mobile**

The tabs at lines 184-213 already have `lg:hidden` which is correct. The desktop layout presets at lines 216-233 have `hidden lg:flex` which is also correct.

- [ ] **Step 3: Commit**

```bash
git add src/features/student-preview/preview-workspace.tsx
git commit -m "fix: ensure PreviewWorkspace grid is single column on mobile"
```

---

## Task 2: Fix Profile Workspace - Add Image Preview and Remove

**Files:**
- Modify: `src/features/student-preview/profile-workspace.tsx`

**Problem:** The profile image input exists but:
1. No preview of the current image (only shows initial letter if no image)
2. No way to remove an uploaded image
3. The label is hardcoded in Arabic

**Fix:** Add image preview and remove button to the avatar section.

- [ ] **Step 1: Add image preview and remove button**

Replace the avatar section (lines 100-108) with:
```tsx
<div>
  <label htmlFor="profile-avatar" className="block text-sm font-medium">
    {lang === "ar" ? "الصورة" : "Profile Image"}
  </label>
  {avatarUrl && (
    <div className="mt-2 flex items-center gap-3">
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        className="h-16 w-16 rounded-full object-cover"
      />
      <button
        type="button"
        onClick={() => handleAvatarChange(null)}
        className="text-sm text-destructive hover:underline"
      >
        {lang === "ar" ? "إزالة" : "Remove"}
      </button>
    </div>
  )}
  <input
    id="profile-avatar"
    type="file"
    accept="image/*"
    onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
    className="mt-2 w-full"
  />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/student-preview/profile-workspace.tsx
git commit -m "fix: add image preview and remove button to profile workspace"
```

---

## Task 3: Fix Profile Workspace - Use Translation Keys

**Files:**
- Modify: `src/features/student-preview/profile-workspace.tsx`

**Problem:** All labels in the editor are hardcoded in Arabic (الاسم, النبذة, الموقع, الصورة) instead of using translation keys.

**Fix:** Replace hardcoded labels with the `lang` variable to switch between Arabic and English.

- [ ] **Step 1: Update the COPY object**

The COPY object at lines 17-20 only has `edit` and `save`. Add field labels:
```tsx
const COPY = {
  ar: {
    edit: "تعديل الملف",
    save: "حفظ",
    name: "الاسم",
    bio: "النبذة",
    location: "الموقع",
    image: "الصورة",
    remove: "إزالة",
  },
  en: {
    edit: "Edit Profile",
    save: "Save",
    name: "Name",
    bio: "Bio",
    location: "Location",
    image: "Profile Image",
    remove: "Remove",
  },
};
```

- [ ] **Step 2: Replace hardcoded labels**

Replace all hardcoded Arabic labels with `copy.name`, `copy.bio`, `copy.location`, `copy.image`.

- [ ] **Step 3: Commit**

```bash
git add src/features/student-preview/profile-workspace.tsx
git commit -m "fix: use translation keys in profile workspace labels"
```

---

## Task 4: Fix Course Page - Populate Real Data

**Files:**
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx`

**Problem:** The course page passes empty arrays for subjects, grades, streams, and null for teacher to `buildCoursePreviewModel`. This means the preview won't show subject, grade, stream, or teacher info.

**Fix:** Fetch subjects, grades, streams from the API and pass them to the model builder.

- [ ] **Step 1: Add imports for subject/grade/stream queries**

Check if there are existing query functions for subjects, grades, streams. If not, the data might come from the course object itself.

Looking at the CourseOut type, it has `subject_name`, `grade_id`, `stream_id` but not the full objects. We need to either:
1. Fetch the full subject/grade/stream objects
2. Or use the existing data from the course object

Since the course page already has `course.subject_name`, `course.grade_id`, `course.stream_id`, we can construct the preview model with this data.

- [ ] **Step 2: Update the buildCoursePreviewModel call**

Replace the current call (lines 199-218) with:
```tsx
<CourseWorkspace
  model={buildCoursePreviewModel({
    courseId: course.id,
    values: {
      title: course.title,
      description: course.description,
      price: course.price,
      subjectId: course.subject_id ?? 0,
      gradeId: course.grade_id,
      streamId: course.stream_id,
      useChapters: course.use_chapters,
    },
    coverObjectUrl: null,
    publicCoverUrl: course.img ?? null,
    teacher: null, // TODO: fetch teacher info if available
    subjects: course.subject_id ? [{ id: course.subject_id, name: course.subject_name ?? "", slug: "", grades: [], streams: [] }] : [],
    grades: course.grade_id ? [{ id: course.grade_id, name: "", level: "" }] : [],
    streams: course.stream_id ? [{ id: course.stream_id, name: "", slug: "" }] : [],
    sections: [],
  })}
  locale={locale}
  viewer="guest"
/>
```

Wait, this is still not ideal because the subject/grade/stream names are empty. Let me check if there's a way to fetch them.

Actually, looking at the existing code more carefully, the course page already has the subject name from `course.subject_name`. The issue is that `buildCoursePreviewModel` expects full objects. Let me check what data is available.

Let me revise this task to be more practical. The key issue is that the preview model needs subject/grade/stream names. We can:
1. Use the `course.subject_name` directly
2. Or fetch the full objects

Let me check if there are query functions available.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/(teacher)/courses/[courseId]/page.tsx
git commit -m "fix: populate course preview with real subject/grade/stream data"
```

---

## Task 5: Fix Course Workspace - Add Missing Fields

**Files:**
- Modify: `src/features/student-preview/course-workspace.tsx`

**Problem:** The course workspace editor only has title, description, price, viewer toggle. Missing subject, grade, stream, cover image selection.

**Fix:** Add subject, grade, stream selection fields and cover image upload.

- [ ] **Step 1: Add subject/grade/stream state and selectors**

Add state variables:
```tsx
const [subjectId, setSubjectId] = useState(model.subject ? subjects.find(s => s.name === model.subject)?.id ?? 0 : 0);
const [gradeId, setGradeId] = useState(model.grade ? grades.find(g => g.name === model.grade)?.id ?? 0 : 0);
const [streamId, setStreamId] = useState(model.stream ? streams.find(s => s.name === model.stream)?.id ?? 0 : 0);
```

Add selector fields to the editor.

- [ ] **Step 2: Add cover image upload**

Add a file input for cover image upload with preview.

- [ ] **Step 3: Commit**

```bash
git add src/features/student-preview/course-workspace.tsx
git commit -m "fix: add subject, grade, stream, and cover image to course workspace"
```

---

## Task 6: Fix Responsive Issues in Preview Renderers

**Files:**
- Modify: `src/features/student-preview/student-teacher-profile-preview.tsx`
- Modify: `src/features/student-preview/student-course-detail-preview.tsx`

**Problem:** Various responsive layout issues:
1. Teacher profile hero: `md:flex-row` might not work well on very small screens
2. Course detail hero: `lg:grid-cols-[1fr_auto]` might not work well on tablet
3. Stats section: `grid grid-cols-3` on mobile might be too cramped

**Fix:** Adjust responsive breakpoints and ensure proper mobile layouts.

- [ ] **Step 1: Fix teacher profile hero**

The hero at line 82 uses `flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-start`. This should work, but verify the avatar and text stack properly on mobile.

- [ ] **Step 2: Fix course detail hero**

The hero at line 99 uses `grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end`. On mobile, this should stack vertically. Verify the stats section works on mobile.

- [ ] **Step 3: Fix stats section**

The stats at line 122 use `grid grid-cols-3 gap-5 text-center text-xs font-bold text-[#464555] sm:flex sm:justify-end`. This might be too cramped on very small screens. Consider using `grid-cols-1 sm:grid-cols-3` or similar.

- [ ] **Step 4: Commit**

```bash
git add src/features/student-preview/student-teacher-profile-preview.tsx src/features/student-preview/student-course-detail-preview.tsx
git commit -m "fix: improve responsive layouts in preview renderers"
```

---

## Task 7: Final Verification

**Files:**
- All modified files

**Problem:** Need to verify all changes work together and don't break existing functionality.

**Fix:** Run tests, typecheck, and lint.

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (currently 420/420)

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Run lint**

```bash
npx eslint src/features/student-preview/
```

Expected: No new errors

- [ ] **Step 4: Commit any fixes**

If any issues are found, fix them and commit.

---

## Execution Notes

**Priority Order:**
1. Task 1 (Responsive grid) - Foundation fix
2. Task 2 (Profile image) - User specifically mentioned
3. Task 3 (Translation keys) - Accessibility/i18n
4. Task 4 (Course data) - Preview accuracy
5. Task 5 (Course fields) - Completeness
6. Task 6 (Responsive renderers) - Polish
7. Task 7 (Verification) - Quality gate

**Dependencies:**
- Task 2 and 3 can be done in parallel
- Task 4 and 5 can be done in parallel
- Task 6 depends on Tasks 1-5 being complete
- Task 7 is final verification
