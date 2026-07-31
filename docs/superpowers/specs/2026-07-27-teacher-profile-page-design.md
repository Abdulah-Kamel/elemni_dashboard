# Teacher Profile Page — Design Spec

## Overview

Add a dedicated profile page at `/[locale]/profile` where teachers can view and edit their name, description, email, and avatar. This wires the frontend to the existing `PATCH /api/v1/teachers/me` and `POST /api/v1/teachers/me/request-image-upload` mock API routes.

## Architecture

```
src/features/profile/
  schema.ts                  Zod schemas for profile types
  queries.ts                 server-only getTeacherProfile()
  actions.ts                 server actions (updateProfile, requestProfileImageUpload)
  components/
    teacher-profile-form.tsx client form component

app/[locale]/(teacher)/profile/
  page.tsx                   server component, force-dynamic

src/i18n/messages/en.json    + "profile" namespace
src/i18n/messages/ar.json    + "profile" namespace
```

## Data Model (Zod Schemas in `schema.ts`)

```ts
// Response from GET /api/v1/teachers/me
const teacherProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  slug: z.string(),
  phone_number: z.string().nullable(),
  description: z.string().nullable(),
  img: z.string().nullable(),
});

// Request body for PATCH /api/v1/teachers/me
const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(60).optional(),
  img: z.string().nullable().optional(),
});
```

## Data Flow

1. **Profile page** (server component):
   - `verifySession()` — ensure authenticated teacher
   - `apiFetch(endpoints.teachers.me, teacherProfileSchema)` — load profile
   - Render `<TeacherProfileForm initialProfile={...} />`

2. **TeacherProfileForm** (client component):
   - Pre-populated with current profile values
   - Editable fields: name, description, avatar
   - Read-only: email (shown as plain text)
   - On save:
     - If avatar selected: `requestProfileImageUpload(filename)` → `POST /api/v1/teachers/me/request-image-upload?filename=...` → get presigned URL → upload file → set new img URL
     - `updateProfile({ name, description, img })` → `PATCH /api/v1/teachers/me`
     - `revalidateTag("profile")`
     - `toast.success`

3. **Image upload flow**:
   - User selects file → show preview
   - On save: request upload URL → fetch PUT to that URL → set img field
   - Follows the existing `request-image-upload` pattern

## Server Actions (`actions.ts`)

```ts
"use server";
export async function updateProfile(data: UpdateProfileRequest): Promise<ActionResult>;
export async function requestProfileImageUpload(filename: string): Promise<{ uploadUrl: string }>;
```

Both use `apiFetch()` and `revalidateTag("profile")`.

## Navigation

- Add a "Profile" entry to the sidebar's `PRIMARY_NAV` array, placed between "Students" and "Settings"
- Icon: `User` (lucide-react)
- Translation key: `common.profile`

## Translations

New `profile` namespace:

| Key | English | Arabic |
|-----|---------|--------|
| title | Profile | الملف الشخصي |
| name_label | Name | الاسم |
| description_label | Description | الوصف |
| email_label | Email | البريد الإلكتروني |
| avatar_label | Profile Photo | الصورة الشخصية |
| save | Save Changes | حفظ التغييرات |
| saved | Profile updated successfully | تم تحديث الملف الشخصي بنجاح |
| upload_avatar | Upload photo | رفع صورة |

## Error Handling

- Follow existing `ActionResult<T>` pattern from course-management
- On validation error: show field-level messages
- On API error: toast with error message
- Offline/network error: toast "Network error"

## Testing

- Unit test for schema validation
- Unit test for server action error handling (mock apiFetch)
