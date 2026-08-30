# Dashboard Student Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add isolated dashboard live previews that reproduce the current student teacher-profile and course page bodies without changing or coupling the student frontend.

**Architecture:** Work from a clean dashboard branch and selectively port the WIP workspace flow. Dashboard-owned snapshot renderers consume local normalized models, use scoped student tokens/assets, and expose only local interactions. Profile/course drafts update immediately; curriculum reloads after successful mutations through an authenticated server function.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, next-intl, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-dashboard-student-live-preview-design.md`

## Global Constraints

- Read `AGENTS.md` and the relevant guides under `node_modules/next/dist/docs/` before code changes.
- Execute in a worktree created with `superpowers:using-git-worktrees` from dashboard `main`; branch name: `feat/dashboard-student-previews`.
- Use `backup/profile-course-preview-wip-2026-08-25` only as a read-only reference. Never cherry-pick commit `ff72849` wholesale.
- Do not edit `elemni_front_end` or `elemni_public_ui`.
- Do not add `@elemni/public-ui`, cross-repository aliases, or a widened Turbopack root.
- Preview actions are local-only. Never expose payment, navigation, document, or Bunny embed URLs.
- Preserve dashboard authentication, validation, upload, i18n, error, and course mutation behavior.
- Use TDD: verify each focused test fails for the intended missing behavior before implementation.

## Execution Preflight

- [ ] Invoke `superpowers:using-git-worktrees` and create a dashboard worktree on `feat/dashboard-student-previews` from `main`.
- [ ] Read the design spec and WIP versions of `preview-workspace.tsx`, `profile-preview-workspace.tsx`, and `course-editor-workspace.tsx` with `git show backup/profile-course-preview-wip-2026-08-25:<path>`.
- [ ] Read the current frontend source components listed in the spec. Do not edit or import them.
- [ ] Record protected repository manifests outside all repositories:

```bash
for repo in elemni_front_end elemni_public_ui; do
  cd "/home/abdullahkm/projects/Elemni/$repo"
  git ls-files -z | sort -z | xargs -0 sha256sum > "/tmp/$repo.preview-protected.sha256"
  git status --porcelain=v1 -z > "/tmp/$repo.preview-protected.status"
done
```

### Task 1: Add The Reusable Preview Workspace

**Files:**
- Create: `src/features/live-preview/types.ts`
- Create: `src/features/live-preview/components/preview-workspace.tsx`
- Create: `src/features/live-preview/__tests__/preview-workspace.test.tsx`

**Interfaces:**
- Produces: `PreviewViewport = "desktop" | "tablet" | "mobile"`
- Produces: `PreviewPanePreset = "preview-60" | "equal" | "editor-focus" | "preview-focus"`
- Produces: `PreviewWorkspace` with `editor`, `preview`, `statusSlot`, `locale`, and `compact` props.

- [ ] **Step 1: Write failing layout and interaction tests**

```tsx
it("places preview left and editor right independent of direction", () => {
  const { container } = render(<PreviewWorkspace locale="en" editor={<div>Editor</div>} preview={<div>Preview</div>} />);
  expect(container.querySelector('[data-slot="preview-workspace-preview"]')).toHaveClass("[grid-area:preview]");
  expect(container.querySelector('[data-slot="preview-workspace-editor"]')).toHaveClass("[grid-area:editor]");
});

it("switches compact panes and preview viewport", () => {
  render(<PreviewWorkspace locale="ar" compact editor={<div>Editor</div>} preview={<div>Preview</div>} />);
  fireEvent.click(screen.getByRole("tab", { name: "معاينة" }));
  fireEvent.click(screen.getByRole("button", { name: "موبايل" }));
  expect(screen.getByTestId("preview-viewport")).toHaveAttribute("data-viewport", "mobile");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/live-preview/__tests__/preview-workspace.test.tsx`

Expected: FAIL because `PreviewWorkspace` and its types do not exist.

- [ ] **Step 3: Implement the workspace**

Use explicit grid areas rather than direction-dependent auto-placement:

```tsx
<div
  data-slot="preview-workspace-grid"
  className="grid items-start gap-6 [grid-template-areas:'preview_editor']"
  style={{ gridTemplateColumns: presetColumns(preset) }}
>
  <section data-slot="preview-workspace-preview" className="min-w-0 [grid-area:preview]">{previewFrame}</section>
  <section data-slot="preview-workspace-editor" className="sticky top-5 min-w-0 [grid-area:editor]">{editor}</section>
</div>
```

Port viewport controls, split presets, compact tabs, and full-preview dialog selectively from the WIP branch. Default columns are `minmax(34rem, 1.2fr) minmax(28rem, 0.8fr)` for preview then editor.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/live-preview/__tests__/preview-workspace.test.tsx`

Expected: all workspace tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/live-preview
git commit -m "feat: add isolated live preview workspace"
```

### Task 2: Add Student Preview Types, Theme, And Assets

**Files:**
- Create: `src/features/student-preview/types.ts`
- Create: `src/features/student-preview/student-preview-theme.ts`
- Create: `src/features/student-preview/__tests__/student-preview-theme.test.ts`
- Create: `src/assets/student-preview/profile-background.webp`
- Create: `src/assets/student-preview/lesson-calculus.webp`
- Create: `src/assets/student-preview/lesson-mechanics.webp`
- Create: `src/assets/student-preview/lesson-study-skills.webp`
- Create: `src/assets/student-preview/lesson-arabic.webp`
- Create: `src/features/student-preview/README.md`

**Interfaces:**
- Produces all normalized model types defined in the design spec.
- Produces `STUDENT_PREVIEW_THEME: CSSProperties & Record<\`--${string}\`, string>`.

- [ ] **Step 1: Write the failing theme test**

```ts
it("pins student tokens independently from dashboard theme", () => {
  expect(STUDENT_PREVIEW_THEME["--color-primary"]).toBe("#0284c7");
  expect(STUDENT_PREVIEW_THEME["--color-page"]).toBe("#f8fafc");
  expect(STUDENT_PREVIEW_THEME["--color-foreground"]).toBe("#0f172a");
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/student-preview/__tests__/student-preview-theme.test.ts`

Expected: FAIL because the theme module does not exist.

- [ ] **Step 3: Add local types, exact student light tokens, assets, and provenance**

Copy the five assets from `elemni_front_end/src/assets/images/student-redesign/`. In `README.md`, record frontend commit `807a4fc`, both source component paths, copy date, and the rule that re-syncs are manual reviewed changes.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/student-preview/__tests__/student-preview-theme.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview src/assets/student-preview
git commit -m "feat: define isolated student preview domain"
```

### Task 3: Build The Student Teacher Profile Snapshot

**Files:**
- Create: `src/features/student-preview/components/student-teacher-profile-preview.tsx`
- Create: `src/features/student-preview/__tests__/student-teacher-profile-preview.test.tsx`

**Interfaces:**
- Consumes: `StudentTeacherPreviewModel`, `STUDENT_PREVIEW_THEME`.
- Produces: `StudentTeacherProfilePreview({ model, locale, interactionMode: "local-only" })`.

- [ ] **Step 1: Write failing behavioral tests**

```tsx
it("renders the restored student profile body", () => {
  render(<StudentTeacherProfilePreview model={teacherModel} locale="ar" interactionMode="local-only" />);
  expect(screen.getByRole("heading", { name: "أحمد علي" })).toBeInTheDocument();
  expect(screen.getByText("كورس التفاضل")).toBeInTheDocument();
});

it("keeps student side effects inert", () => {
  render(<StudentTeacherProfilePreview model={teacherModel} locale="ar" interactionMode="local-only" />);
  expect(screen.getByRole("button", { name: "اشترك الآن" })).toBeDisabled();
  expect(screen.queryByRole("link", { name: /فيديو الشرح/ })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/student-preview/__tests__/student-teacher-profile-preview.test.tsx`

Expected: FAIL because the profile snapshot does not exist.

- [ ] **Step 3: Copy and adapt only the current profile body**

Copy visual helpers and JSX from the restored frontend `teacher-profile-view.tsx`. Replace frontend `Teacher`, `Link`, checkout, share, and routing dependencies with the local model and inert buttons. Use native `<img>` for avatar/course imagery. Keep local expansion for subscribed course content if the model marks a course subscribed.

- [ ] **Step 4: Verify GREEN and visually inspect the rendered fixture**

Run: `npm test -- src/features/student-preview/__tests__/student-teacher-profile-preview.test.tsx`

Expected: PASS with no jsdom navigation or image warnings.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview
git commit -m "feat: add student teacher profile snapshot"
```

### Task 4: Build The Live Profile Workspace

**Files:**
- Create: `src/features/profile/build-teacher-preview-model.ts`
- Create: `src/features/profile/build-teacher-preview-model.test.ts`
- Create: `src/features/profile/components/profile-preview-workspace.tsx`
- Create: `src/features/profile/components/profile-preview-workspace.test.tsx`
- Modify: `app/[locale]/(teacher)/profile/page.tsx`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `buildTeacherPreviewModel(input): StudentTeacherPreviewModel`.
- Produces: `ProfilePreviewWorkspace({ initialProfile, publishedCourses, publicImageUrl, locale })`.

- [ ] **Step 1: Write failing model and workspace tests**

```ts
it("prefers unsaved profile values and avatar object URL", () => {
  const model = buildTeacherPreviewModel({ profile, draft: { name: "الاسم الجديد", description: "نبذة جديدة" }, avatarUrl: "blob:avatar", publishedCourses, locale: "ar" });
  expect(model.name).toBe("الاسم الجديد");
  expect(model.bio).toBe("نبذة جديدة");
  expect(model.avatarUrl).toBe("blob:avatar");
});
```

```tsx
it("updates the left preview before saving", () => {
  render(<ProfilePreviewWorkspace {...fixtureProps} />);
  fireEvent.change(screen.getByLabelText("الاسم الكامل"), { target: { value: "الاسم الجديد" } });
  expect(screen.getByRole("heading", { name: "الاسم الجديد" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/profile/build-teacher-preview-model.test.ts src/features/profile/components/profile-preview-workspace.test.tsx`

Expected: FAIL because the builder and workspace do not exist.

- [ ] **Step 3: Implement inline editing and route wiring**

Reuse existing `updateTeacherProfile`, presigned upload, MIME/size validation, translations, and public image resolution. Move name, bio, and avatar controls into the editor pane. Keep email and phone read-only. Revoke replaced object URLs. On save failure, preserve draft state; on success, update the saved baseline and call `router.refresh()`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/profile/build-teacher-preview-model.test.ts src/features/profile/components/profile-preview-workspace.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/'[locale]'/'(teacher)'/profile/page.tsx src/features/profile src/i18n/messages
git commit -m "feat: add live student profile preview"
```

### Task 5: Build The Student Course Snapshot And Model

**Files:**
- Create: `src/features/student-preview/components/student-course-detail-preview.tsx`
- Create: `src/features/student-preview/__tests__/student-course-detail-preview.test.tsx`
- Create: `src/features/course-management/course-preview-model.ts`
- Create: `src/features/course-management/course-preview-model.test.ts`

**Interfaces:**
- Produces: `StudentCourseDetailPreview({ model, locale, viewer, interactionMode: "local-only" })`.
- Produces: `buildCoursePreviewModel(input): StudentCoursePreviewModel`.

- [ ] **Step 1: Write failing renderer and mapping tests**

```ts
it("maps draft metadata and strips protected item locations", () => {
  const model = buildCoursePreviewModel(courseFixture);
  expect(model.title).toBe("كورس التفاضل المعدل");
  expect(model.sections[0]?.lessons[0]?.items[0]).toEqual(expect.objectContaining({ hasVideo: true }));
  expect(model.sections[0]?.lessons[0]?.items[0]).not.toHaveProperty("videoUrl");
});
```

```tsx
it("renders the restored course body and an inert subscribed player shell", () => {
  const { container } = render(<StudentCourseDetailPreview model={courseModel} locale="ar" viewer="subscribed" interactionMode="local-only" />);
  expect(screen.getByRole("heading", { name: "كورس التفاضل" })).toBeInTheDocument();
  expect(container.querySelector('[data-slot="student-course-player"]')).toBeTruthy();
  expect(container.querySelector("iframe[src]")).toBeNull();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/course-management/course-preview-model.test.ts src/features/student-preview/__tests__/student-course-detail-preview.test.tsx`

Expected: FAIL because the builder and course snapshot do not exist.

- [ ] **Step 3: Copy and adapt only the current course body**

Copy presentation helpers and JSX from the restored frontend `course-detail.tsx`. Remove `StudentAppShell`, loading/fetch state, checkout, routing, and protected URLs. Keep chapter/lesson expansion and guest/subscribed visuals. Use a player placeholder without `src` when a subscribed model contains a video item.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/course-management/course-preview-model.test.ts src/features/student-preview/__tests__/student-course-detail-preview.test.tsx`

Expected: PASS with no navigation, iframe network, or protected-link behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-preview src/features/course-management/course-preview-model.ts src/features/course-management/course-preview-model.test.ts
git commit -m "feat: add student course detail snapshot"
```

### Task 6: Add Course Create And Edit Workspaces

**Files:**
- Create: `src/features/course-management/components/course-editor-workspace.tsx`
- Create: `src/features/course-management/components/course-editor-workspace.test.tsx`
- Create: `app/[locale]/(teacher)/courses/new/page.tsx`
- Modify: `app/[locale]/(teacher)/courses/[courseId]/page.tsx`
- Modify: `app/[locale]/(teacher)/courses/page.tsx`
- Modify: `src/features/course-management/components/create-course-dialog.tsx`
- Modify: `src/i18n/messages/ar.json`
- Modify: `src/i18n/messages/en.json`

**Interfaces:**
- Produces: `CourseEditorWorkspace` with create/edit modes, local draft state, cover state, viewer mode, curriculum state, and optional curriculum editor.

- [ ] **Step 1: Write failing create/edit workspace tests**

```tsx
it("updates course title, cover, and viewer mode before save", () => {
  render(<CourseEditorWorkspace {...editFixture} />);
  fireEvent.change(screen.getByLabelText("عنوان الدورة"), { target: { value: "عنوان جديد" } });
  fireEvent.click(screen.getByRole("button", { name: "طالب مشترك" }));
  expect(screen.getByRole("heading", { name: "عنوان جديد" })).toBeInTheDocument();
  expect(screen.getByTestId("course-preview-viewer")).toHaveAttribute("data-viewer", "subscribed");
});

it("redirects a newly created course to its edit workspace", async () => {
  render(<CourseEditorWorkspace {...createFixture} />);
  fireEvent.click(screen.getByRole("button", { name: "إنشاء الكورس" }));
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/courses/42"));
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/course-management/components/course-editor-workspace.test.tsx`

Expected: FAIL because the workspace and new route do not exist.

- [ ] **Step 3: Implement create/edit workspaces**

Selectively port local form, cover object URL, dirty state, save handling, and guest/subscribed controls from the WIP workspace. Reuse existing `CourseForm`, `CourseCoverPicker`, upload, create, and update actions. Replace the create dialog trigger with a link to `/courses/new`. Preserve the existing curriculum editor in edit mode.

- [ ] **Step 4: Verify GREEN and existing course tests**

Run: `npm test -- src/features/course-management/components/course-editor-workspace.test.tsx src/features/course-management/__tests__/course-form.test.tsx src/features/course-management/__tests__/course-card-actions.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/'[locale]'/'(teacher)'/courses src/features/course-management src/i18n/messages
git commit -m "feat: add course create and edit preview workspaces"
```

### Task 7: Synchronize Curriculum After Successful Mutations

**Files:**
- Create: `src/features/course-management/course-preview-actions.ts`
- Create: `src/features/course-management/course-preview-actions.test.ts`
- Modify: `src/features/course-management/components/course-editor-workspace.tsx`
- Modify: `src/features/course-management/components/chapter-list.tsx`
- Modify: `src/features/course-management/components/chapter-card.tsx`
- Modify: `src/features/course-management/components/lesson-list.tsx`
- Modify: `src/features/course-management/components/lesson-card.tsx`
- Modify: `src/features/course-management/components/item-list.tsx`
- Modify: `src/features/course-management/components/item-card.tsx`
- Test: `src/features/course-management/components/course-editor-workspace.test.tsx`

**Interfaces:**
- Produces: `PreviewActionResult<T> = { success: true; data: T } | { success: false; error: { type: string; message: string } }`.
- Produces: `loadCoursePreviewCurriculum(courseId: number): Promise<PreviewActionResult<StudentPreviewSection[]>>`.
- Adds: `onCurriculumCommitted?: () => void` to chapter, lesson, and item editor props.

- [ ] **Step 1: Write failing action and callback tests**

```ts
it("normalizes chapters, lessons, and items without protected URLs", async () => {
  const result = await loadCoursePreviewCurriculum(12);
  expect(result).toEqual({ success: true, data: expectedSections });
  expect(JSON.stringify(result)).not.toContain("document_path");
  expect(JSON.stringify(result)).not.toContain("embed_url");
});
```

```tsx
it("reloads preview only after a curriculum mutation succeeds", async () => {
  render(<CourseEditorWorkspace {...editFixture} />);
  await curriculumCommitted();
  expect(loadCoursePreviewCurriculumMock).toHaveBeenCalledWith(12);
  expect(screen.getByText("الدرس الجديد")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/features/course-management/course-preview-actions.test.ts src/features/course-management/components/course-editor-workspace.test.tsx`

Expected: FAIL because the server function and callback contract do not exist.

- [ ] **Step 3: Implement the authenticated refresh boundary**

Create a top-level `"use server"` module. Call `verifySession()` before queries, return Unauthorized when absent, load the course and current curriculum through existing queries, and return only normalized preview fields. Thread the same optional callback through all nested editors. Invoke it after successful mutation results and never after rollback/error branches.

- [ ] **Step 4: Verify GREEN and mutation regressions**

Run: `npm test -- src/features/course-management/course-preview-actions.test.ts src/features/course-management/components/course-editor-workspace.test.tsx src/features/course-management/__tests__`

Expected: PASS; failed reorder tests confirm preview reload is not called.

- [ ] **Step 5: Commit**

```bash
git add src/features/course-management
git commit -m "feat: synchronize course curriculum preview"
```

### Task 8: Add Visual E2E Coverage And Complete Verification

**Files:**
- Create: `tests/e2e/student-live-preview.spec.ts`
- Create: Playwright snapshot files generated by the two configured projects.
- Modify: `tests/e2e/` fixtures only if authentication/API fixtures require preview route data.

**Interfaces:**
- Verifies profile, new-course, and edit-course routes in Arabic/English and desktop/mobile preview modes.

- [ ] **Step 1: Write the failing E2E scenarios**

Cover these assertions:

```ts
await expect(page.locator('[data-slot="preview-workspace-preview"]')).toBeVisible();
await expect(page.locator('[data-slot="preview-workspace-editor"]')).toBeVisible();
await expect(page.locator('[data-slot="student-teacher-profile-preview"]')).toHaveScreenshot("teacher-profile-preview.png");
await expect(page.locator('[data-slot="student-course-detail-preview"]')).toHaveScreenshot("course-detail-preview.png");
```

Profile scenario changes name and bio before save. New-course scenario changes title/cover and verifies redirect after creation. Edit-course scenario switches viewer mode and completes one successful curriculum mutation.

- [ ] **Step 2: Run and verify RED**

Run: `npm run test:e2e -- tests/e2e/student-live-preview.spec.ts`

Expected: FAIL until routes, fixtures, and reviewed snapshots are complete.

- [ ] **Step 3: Complete fixtures and review snapshots**

Use existing authentication/API mocking patterns. Generate Arabic and English snapshots at configured desktop width, then switch the preview viewport control to mobile and capture the preview frame. Review images for student typography, colors, hero, cards, course content, and physical left placement.

- [ ] **Step 4: Run focused and full verification**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e -- tests/e2e/student-live-preview.spec.ts
```

Expected: all commands exit 0. Lint output contains no new warnings in changed files.

- [ ] **Step 5: Verify isolation and protected repository manifests**

```bash
cd /home/abdullahkm/projects/Elemni/elemni_dashboard
if rg -n '@elemni/public-ui|from\s+["'"'].*elemni_(front_end|public_ui)|require\(["'"'].*elemni_(front_end|public_ui)' \
  package.json package-lock.json next.config.ts tsconfig.json src app \
  -g '*.{ts,tsx,js,mjs,cjs,json}'; then
  echo "Forbidden cross-repository dependency found" >&2
  exit 1
fi

for repo in elemni_front_end elemni_public_ui; do
  cd "/home/abdullahkm/projects/Elemni/$repo"
  sha256sum -c "/tmp/$repo.preview-protected.sha256"
  git status --porcelain=v1 -z > "/tmp/$repo.preview-current.status"
  cmp "/tmp/$repo.preview-protected.status" "/tmp/$repo.preview-current.status"
done
```

Expected: `rg` finds nothing, every checksum reports `OK`, and both status
manifests compare byte-for-byte equal.

- [ ] **Step 6: Request review and finish the branch**

Invoke `superpowers:requesting-code-review`. Resolve verified findings, rerun the complete verification commands, then invoke `superpowers:verification-before-completion` and `superpowers:finishing-a-development-branch`.

- [ ] **Step 7: Commit final tests and fixes**

```bash
git add tests/e2e src app
git commit -m "test: verify isolated student live previews"
```
