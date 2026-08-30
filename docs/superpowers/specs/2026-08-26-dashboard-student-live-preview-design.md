# Dashboard Student Live Preview Design

## Objective

Add live teacher-profile and course previews to the teacher dashboard without changing the student frontend or making production student pages depend on preview code.

The preview pane shows dashboard-owned snapshots of the current student page bodies. The preview is physically on the left at desktop widths and the editor is on the right. Draft profile and course metadata update immediately. Curriculum content updates after each successful chapter, lesson, or item mutation.

## Source And Branch Strategy

- Start from dashboard `main` at or after `6b499b6aaf5e145de2badb62aa7f2fd05206dc8f` in a new `feat/dashboard-student-previews` worktree.
- Treat dashboard branch `backup/profile-course-preview-wip-2026-08-25` at `ff728492e315d9d4e6c47639c7cd15b04e4ca798` as read-only reference material.
- Selectively port the WIP workspace and editor-state ideas. Do not cherry-pick the complete WIP commit.
- Copy the visual body from the restored student components at frontend `main` commit `807a4fcefb8b4084344d9bed27b2761140025835`:
  - `src/features/courses/components/course-detail.tsx`
  - `src/features/teachers/components/client/teacher-profile-view.tsx`
- Do not copy student authentication, data fetching, payment, routing, public header/footer, or `StudentAppShell` behavior.

## Isolation Boundary

The implementation lives entirely in `elemni_dashboard`.

The following are prohibited:

- Editing any tracked file in `elemni_front_end` or `elemni_public_ui`.
- Adding `@elemni/public-ui` to dashboard dependencies.
- Adding cross-repository TypeScript path aliases or runtime imports.
- Widening the Next.js or Turbopack workspace root.
- Replacing production student renderers with shared components.
- Supplying checkout callbacks, document URLs, Bunny embed URLs, or navigable student links to a dashboard preview.

Before implementation, record the SHA-256 checksum of every tracked file and the
complete porcelain status for both `elemni_front_end` and `elemni_public_ui`.
Recompute and compare both manifests before completion. This protects existing
dirty user work as well as committed files; the implementation may only read from
these repositories.

## Preview Workspace

`PreviewWorkspace` is a dashboard client component with these behaviors:

- Desktop default: preview on the physical left at 60%, editor on the physical right at 40%, independent of document direction.
- Optional 50/50, editor-focus, and preview-focus presets.
- Desktop, tablet, and mobile preview widths of `100%`, `52rem`, and `23rem`.
- Compact layout below 1024px uses accessible Edit and Preview tabs.
- Full-preview dialog reuses the same rendered preview and current viewport.
- The editor rail remains sticky and independently scrollable; the preview page can extend vertically.
- Arabic and English labels come from a local copy function or dashboard messages. Grid placement must not rely on RTL auto-placement.

## Dashboard-Owned Student Snapshots

Create two local renderers:

```ts
type PreviewInteractionMode = "local-only";

function StudentTeacherProfilePreview(props: {
  model: StudentTeacherPreviewModel;
  locale: string;
  interactionMode: PreviewInteractionMode;
}): React.ReactNode;

function StudentCourseDetailPreview(props: {
  model: StudentCoursePreviewModel;
  locale: string;
  viewer: "guest" | "subscribed";
  interactionMode: PreviewInteractionMode;
}): React.ReactNode;
```

The renderers copy the current student body markup and helper behavior into dashboard-owned files. They use local normalized model types and native `<img>` elements so uploaded object URLs and public CDN URLs need no Next image configuration.

Copy the student profile background and four fallback course thumbnails into `src/assets/student-preview/`. Scope the student light-theme token values under the preview root so dashboard dark mode and dashboard brand tokens cannot alter the student appearance.

Local-only interactions may expand chapters, lessons, and subscribed course details. Checkout, share, navigation, payment, media, and document actions are rendered disabled or inert. The subscribed course player shell may be shown for a video item, but it must not receive an iframe `src` or protected asset URL.

Empty draft title, description, avatar, cover, or curriculum values use preview-only placeholders. These placeholders never enter production student code.

## Models And Data Flow

Dashboard-local normalized types are defined in `src/features/student-preview/types.ts`:

```ts
export type StudentPreviewItem = {
  id: string | number;
  title: string;
  hasVideo: boolean;
  hasDocument: boolean;
  hasExam: boolean;
};

export type StudentPreviewLesson = {
  id: string | number;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  items: StudentPreviewItem[];
};

export type StudentPreviewSection = {
  id: string | number;
  title: string | null;
  lessons: StudentPreviewLesson[];
};

export type StudentTeacherPreviewCourse = {
  id: string | number;
  title: string;
  description: string;
  price: string;
  duration: string;
  sessionsCount: number;
  coverUrl: string | null;
  isSubscribed: boolean;
  sections: StudentPreviewSection[];
};

export type StudentTeacherPreviewModel = {
  id: string | number;
  name: string;
  title: string;
  subject: string;
  subjects: string[];
  grades: string[];
  avatarUrl: string | null;
  experienceYears: number;
  bio: string;
  location: string | null;
  courses: StudentTeacherPreviewCourse[];
};

export type StudentCoursePreviewModel = {
  id: string | number;
  title: string;
  description: string;
  coverUrl: string | null;
  price: string;
  subject: string | null;
  grade: string | null;
  stream: string | null;
  teacher: { name: string; avatarUrl: string | null } | null;
  sections: StudentPreviewSection[];
};
```

`buildTeacherPreviewModel` maps an unsaved profile draft, selected avatar object URL, public taxonomy, and published courses to `StudentTeacherPreviewModel`.

`buildCoursePreviewModel` maps unsaved course form values, cover object URL, teacher identity, taxonomy labels, and current curriculum to `StudentCoursePreviewModel`.

The profile workspace owns local draft and saved-baseline state. Typing or choosing an avatar updates the preview immediately. A failed save retains the draft and preview; a successful save resets the dirty baseline and revokes obsolete object URLs.

The course workspace owns metadata, cover, viewer mode, save state, and curriculum preview state. Metadata and cover update immediately. New-course creation redirects to the edit route after success because curriculum requires a persisted course ID.

`loadCoursePreviewCurriculum(courseId)` is a dedicated authenticated server function. It verifies the current user, loads the course, chapters or flat lessons, and items through existing dashboard queries, strips all protected URLs, and returns `PreviewActionResult<StudentPreviewSection[]>`.

Existing chapter, lesson, and item editors accept `onCurriculumCommitted?: () => void`. They call it only after successful create, update, delete, or reorder operations. The workspace then reloads curriculum through `loadCoursePreviewCurriculum`. Reload failure keeps the last valid preview and reports a non-destructive error.

## Error And Responsive Behavior

- Initial route failures continue to use the existing dashboard placeholder/error patterns.
- Save and curriculum-refresh failures do not clear draft input or valid preview state.
- Invalid avatar type and size retain the existing validation and messages.
- Object URLs are revoked when replaced and on unmount.
- The compact tab interface renders only one visible pane at a time but preserves both panes' client state.
- Preview device controls resize the preview viewport, not the browser or editor form.

## Verification

Implementation follows TDD. Each task starts with a focused failing test and ends with its focused tests passing.

Required automated coverage:

- Model normalization and preview-only placeholders.
- Protected URL removal.
- Restored profile and course visual sections.
- Local-only expansion and disabled side effects.
- Physical left preview placement in RTL and LTR.
- Responsive tabs and viewport controls.
- Immediate unsaved profile/course metadata updates.
- Successful-only curriculum reload.
- Create-course redirect to edit mode.
- Save and reload failure preservation.
- Arabic and English desktop/mobile Playwright flows and reviewed screenshots.

Final verification runs dashboard unit tests, typecheck, lint, production build, and development route smoke tests. Frontend checksums must remain byte-for-byte identical.
