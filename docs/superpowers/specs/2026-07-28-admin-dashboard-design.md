# Admin Dashboard — Design Spec

## Overview

Add an admin dashboard at `/{locale}/admin` with teacher management, grade/stream/subject CRUD. Administrators are routed there after login by role.

## Architecture

```
app/[locale]/(admin)/            — route group, ADMIN role gate
  layout.tsx                     — role check + admin sidebar
  admin/
    page.tsx                     — redirects to /admin/teachers
    teachers/
      page.tsx                   — teacher list table
      new/page.tsx               — create teacher form (17 CRM fields)
    grades/page.tsx              — taxonomy manager
    streams/page.tsx
    subjects/page.tsx

src/features/admin/              — feature module
  schema.ts                      — zod schemas for admin endpoints
  queries.ts                     — server fetchers
  actions.ts                     — server actions
  components/
    teachers-list.tsx            — teacher table component
    create-teacher-form.tsx      — sectioned CRM form
    taxonomy-manager.tsx         — shared CRUD table for grades/streams/subjects
```

## Routing & auth

- `signInAction` (after `saveSession`): calls `GET /api/v1/auth/me`, redirects by role:
  - `ADMIN` → `/{locale}/admin`
  - other → `/{locale}/dashboard` (or sanitized `next`)
- `(admin)/layout.tsx`: `verifySession()` → no user → sign-out; `role !== "ADMIN"` → teachers go to `/dashboard`, others to `sign-out?reason=role`
- `(teacher)/layout.tsx`: add `if (user.role === "ADMIN") redirect("/{locale}/admin")` — strict separation
- `(admin)/admin/page.tsx`: meta-redirect to `./teachers`

## Sidebar

`Sidebar` accepts optional `navItems` prop. Layouts pass their own nav:

```ts
// Teacher (existing):
PRIMARY_NAV = [
  { id: "overview", href: "/dashboard", icon: LayoutGrid },
  { id: "my_courses", href: "/courses", icon: BookOpen },
  { id: "students", href: "/students", icon: GraduationCap },
  { id: "profile", href: "/profile", icon: User },
  { id: "storage", href: "/storage", icon: Cloud },
  { id: "settings", href: "/settings", icon: Settings },
]

// Admin:
ADMIN_NAV = [
  { id: "teachers", href: "/admin/teachers", icon: GraduationCap },
  { id: "grades", href: "/admin/grades", icon: Layers },
  { id: "streams", href: "/admin/streams", icon: GitBranch },
  { id: "subjects", href: "/admin/subjects", icon: Library },
]
```

Default (`navItems` undefined) = existing `PRIMARY_NAV` for backward compat.

## Teachers page

List from `GET /api/v1/teachers` (public, `PublicTeacherOut`: name, slug, description, img, subjects, grades). Table: avatar, name, subjects chips, grades chips. "New Teacher" button → `GET /admin/teachers/new`.

**Known limitation:** public list has no `user_id` — per-row "send invite" action unavailable. Invite only offered after creation (response includes `id`).

## Create teacher form (`/admin/teachers/new`)

Dedicated page, sectioned form — 17 CRM fields + 2 multi-selects. Sections:

1. **Basic info**: name*, email*, phone
2. **Assignment**: subjects (multi), grades (multi) — options from `listSubjects`/`listGrades`
3. **CRM details**: location, estimated_students, experience, cost_value, cost_type, current_platform, social_media, interest_level
4. **Pipeline**: call_status, call_date, follow_up_date, follow_up_count, demo_scheduled, signed_up, next_step, closed
5. **Notes**: feedback, description

Submit → `POST /api/v1/admin/teachers` → result panel shows name/slug + "Send set-password email" button (`POST .../{user_id}/set-password`) + link back to list.

## Taxonomy management (grades, streams, subjects)

Shared `TaxonomyManager` component parameterized by config (icon, label, endpoint paths, fields). Table + "New" dialog (create) + inline edit dialog + delete confirm. Reads via existing public `listSubjects`/`listGrades`/`listStreams`; mutations via admin POST/PATCH/DELETE.

## Data layer

`src/features/admin/schema.ts`:
- `adminCreateTeacherRequestSchema`, `adminCreateTeacherResponseSchema` (mirror backend contracts)
- `gradeCreateSchema`, `gradeUpdateSchema`; `streamCreate/Update`; `subjectCreate/Update`

`src/features/admin/queries.ts`:
- `listTeachers()` — public `GET /api/v1/teachers`, noAuth, tagged `teachers:all`
- Reuse `listGrades/listStreams/listSubjects` from `course-management/queries.ts`

`src/features/admin/actions.ts` — standard `ActionResult<T>` + `revalidateTag` pattern:
- `createTeacher(data)` → POST admin/teachers
- `sendSetPasswordEmail(userId)` → POST admin/teachers/{id}/set-password
- `createGrade/updateGrade/deleteGrade`
- `createStream/updateStream/deleteStream`
- `createSubject/updateSubject/deleteSubject`

## i18n

New `sidebar` keys (en/ar): `teachers`, `grades`, `streams`, `subjects`.
New `admin` namespace: 30+ keys for page titles, form section headers, field labels, multi-select labels, action buttons, result panel, toasts, delete confirms.

## Demo branch (`demo/mock-data`)

- **Role switching**: mock login route sets module-level `currentRole` — `admin@admin`/`admin@123` → `ADMIN`; `teacher@teacher`/`teacher@123` → `TEACHER`. Mock `/auth/me` returns user with that role.
- **Mock admin routes** (POST/PATCH/DELETE for grades/streams/subjects using `MOCK_*` arrays, POST teachers with echo + generated id/slug, POST set-password → `{detail}`)
- **Mock public `GET /api/v1/teachers`** — 3 sample teachers

## Verification

`tsc --noEmit` + `vitest run` on both branches. Manual on demo: login as admin → `/admin/teachers`; create teacher → result + invite; grade/stream/subject CRUD; login as teacher → `/dashboard`, gets bounced from `/admin`.
