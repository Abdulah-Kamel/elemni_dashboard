# Profile Avatar Upload to Bunny Storage — Design Spec

**Date:** 2026-07-29
**Status:** Pending user review
**Scope:** Profile avatar upload only (no cover/background image)

## 1. Overview

Wire the teacher profile avatar to Bunny Storage using the existing presigned-URL pattern, add a `react-easy-crop` modal for 1:1 cropping with immediate preview, remove the cover/background section, and surface the same avatar in the sidebar and topbar. The backend handles all Bunny authentication; the frontend never touches Bunny credentials directly (consistent with the codebase's documented decision).

## 2. Architecture & Data Flow

```
[Profile page edit mode]
  └─ Click avatar
      └─ AvatarCropModal opens (react-easy-crop, 1:1)
          └─ Apply → Blob (jpeg, 256×256)
              └─ Stage blob locally (preview shown)

[Save button]
  └─ If staged blob exists:
      ├─ requestProfileImageUpload(filename) → POST /api/v1/teachers/me/request-image-upload
      │    └─ returns { upload_url, path }              ◄ path is the CDN read URL
      ├─ uploadToPresignedUrl(upload_url, blob)          ◄ PUT, reuse src/lib/upload.ts
      └─ updateProfile({ name, description, img: path }) ◄ FIX: was persisting upload_url (expired)
  └─ revalidateTag("profile")

[After backend ships GET /api/v1/teachers/me]
  └─ queries.ts replaces STATIC_PROFILE with real apiFetch
      └─ Sidebar + topbar consume the same query → avatar appears everywhere
```

**Phase split (clarification):**
- **This slice** ships: avatar crop modal, PATCH-`img`-on-save fix, cover-section removal, sidebar/topbar avatar wired against whatever profile source is currently available (initially the static `STATIC_PROFILE` until the backend endpoint lands).
- **Pending backend**: `GET /api/v1/teachers/me` returning real data — once it lands, `queries.ts` swaps to it and the avatar immediately appears everywhere.

**Boundaries:**
- Server actions in `src/features/profile/actions.ts` are the only Bunny-auth touchpoint (via backend).
- UI crop/preview state stays local to the page; only the final blob flows to the server.
- Sidebar/topbar are consumers of `getTeacherProfile()` — no new state ownership.

## 3. Components & Files

**New:**
- `src/features/profile/components/avatar-crop-modal.tsx` — client component wrapping `react-easy-crop`. Props: `{ src: string; open: boolean; onClose(): void; onApply(blob: Blob): void }`. Uses base-ui `Dialog` for the modal shell. Modal flow: zoom/pan controls → user clicks **Apply** once → modal produces a single 256×256 JPEG `Blob` (quality 0.9) via `canvas.toBlob()` and calls `onApply(blob)`, then closes. There is no separate in-modal confirm step.

**Modified:**
- `src/features/profile/components/teacher-profile-page.tsx`:
  - **Remove** the entire cover section (gradient banner, name overlay, `Image` icon, `cover_subtitle`).
  - Replace `<input type="file">` with a button that opens `AvatarCropModal`.
  - Swap raw `fetch PUT` for `uploadToPresignedUrl` from `src/lib/upload.ts`.
  - Use `upload.path` (not `upload.uploadUrl`) for persisted `img`.
  - Track `croppedBlob` separately from file selection.
- `src/features/profile/queries.ts` — replace `STATIC_PROFILE` with real `apiFetch(endpoints.teachers.me, teacherProfileSchema, { cache: "no-store", next: { tags: ["profile"] } })` once backend ships the new GET endpoint.
- `src/features/profile/schema.ts` — tighten `updateProfileRequestSchema.img` to `z.string().url().nullable().optional()` (was unconstrained string).
- Sidebar component (verify exact path before editing — likely `src/components/layout/sidebar.tsx`) — render `<Avatar>` (from `src/components/ui/avatar.tsx`) reading the teacher profile, fallback to initials via `AvatarFallback`. Initials are computed as: take the first letter of `name`, then if `name` contains a space, append the first letter of the second word (e.g. "Jane Doe" → "JD"); otherwise use just the first letter. Empty `name` → render the `User` lucide icon.
- Topbar component (likely `src/components/layout/topbar.tsx`) — small avatar top-right, same profile source.

**Profile data flow for sidebar/topbar:**
- Server components (e.g. the `(teacher)` layout) already render the sidebar/topbar. They can call `getTeacherProfile()` directly during render and pass the result down to client avatar subcomponents as a prop.
- Alternatively, expose a client-safe `useTeacherProfile()` hook backed by `@tanstack/react-query` that fetches `GET /api/v1/teachers/me` from the client. Choose the simpler approach at planning time based on how the rest of the layout consumes server data.
- `src/i18n/messages/en.json` + `ar.json` — add keys (see §6).

**Removed:**
- The entire cover/background block in `teacher-profile-page.tsx`.

**Dependency:**
- Add `react-easy-crop` to `package.json`. **Verify React 19 compatibility** before installing — `react-easy-crop` v5+ declares React 18 peer support; if React 19 fails, fall back to v5 with `--legacy-peer-deps` or pick an alternative cropper. The plan must surface this verification step.

## 4. Backend Contract & Types

**Two backend endpoints (need backend team):**
1. `GET /api/v1/teachers/me` — returns teacher profile (response shape: `teacherProfileSchema`).
2. `POST /api/v1/teachers/me/request-image-upload?filename=...` — returns `{ upload_url: string, path: string }` (currently mocked).

**Existing (no change):**
- `PATCH /api/v1/teachers/me` — persists `{ name?, description?, img? }`.

**Frontend Zod additions:**
```ts
// tightened — img must be a valid URL or null when provided
const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  img: z.string().url().nullable().optional(),
});
```
Note: this is the **outbound** (PATCH) request schema. The static profile currently sets `img: null`, which remains valid. Once the backend ships `GET /me`, validate that the response satisfies `teacherProfileSchema.img: z.string().url().nullable()`; if the backend ever returns a relative path, prepend the CDN base URL on the client before display.

**Crop modal output spec:**
- `Blob` (image/jpeg), 256×256 px, quality 0.9.
- Filename sent to backend: `avatar-${Date.now()}.jpg` (unique key per upload).

## 5. Error Handling & Edge Cases

| Stage | Failure | UX |
|---|---|---|
| File selection | Wrong type / >5 MB | Toast `profile.avatar_invalid_type` / `profile.avatar_too_large`. Modal does not open. |
| Crop modal | User cancels | Discard blob, leave `img` unchanged. |
| `requestProfileImageUpload` | Network / API error | Toast from server action error; abort; do **not** PATCH. |
| PUT to presigned URL | Network / 4xx | Toast `profile.error_upload`; abort; **do not PATCH**. Inline "Try again" button next to avatar. |
| `updateProfile` (PATCH) | Validation (name too long) | Field-level error near name input. |
| `updateProfile` | Network / API error | Toast from server action error. Blob is orphaned on Bunny Storage (no delete endpoint — acceptable per decision). |
| Refresh after success | `img` shows correctly | Yes — once `GET /api/v1/teachers/me` is wired in `queries.ts`. |

**Edge cases:**
- No selected file → `updateProfile` patches text fields only (`img` undefined).
- Sidebar/topbar avatar doesn't crash if `img` is null — falls back to initials.
- Concurrent edits (one teacher) — last-write-wins; no locking.
- i18n: every new toast/text uses locale keys; Arabic matches existing RTL styling.
- Next.js 16: `revalidateTag("profile", "default")` signature already used in codebase — compatible.

## 6. Translations

New keys in `profile` namespace (`en.json` / `ar.json`):

| Key | English | Arabic |
|---|---|---|
| `avatar_label` | Profile Photo | الصورة الشخصية |
| `upload_avatar` | Upload photo | رفع صورة |
| `crop_modal_title` | Crop Photo | اقتصاص الصورة |
| `crop_apply` | Apply | تطبيق |
| `crop_cancel` | Cancel | إلغاء |
| `crop_zoom_in` | Zoom in | تكبير |
| `crop_zoom_out` | Zoom out | تصغير |
| `crop_rotate` | Rotate | تدوير |
| `avatar_too_large` | Image must be 5 MB or smaller | يجب أن تكون الصورة ٥ ميجابايت أو أقل |
| `avatar_invalid_type` | Only PNG, JPG, or WEBP is allowed | مسموح فقط بـ PNG أو JPG أو WEBP |
| `error_upload` | Failed to upload image | فشل رفع الصورة |
| `avatar_retry` | Try again | إعادة المحاولة |

## 7. Testing & Verification

**Manual checklist (browser):**
1. Visit `/[locale]/profile` — page loads with current scaffolding.
2. Edit → click avatar → pick a JPEG >5 MB → rejection toast, modal does not open.
3. Pick a valid PNG/JPG/WEBP → crop modal opens, zoom/pan work.
4. Apply crop → avatar circle shows preview thumbnail.
5. Save → network tab shows `request-image-upload`, PUT to presigned URL, PATCH with new `img`.
6. Reload → avatar persists (once `GET /me` wired).
7. Sidebar + topbar show the same avatar.
8. Switch to Arabic → all copy translated, avatar in place (RTL-safe).
9. Cancel edit → avatar reverts to original; orphaned file on Bunny is acceptable.
10. Offline during PUT → error toast, no PATCH, form stays in editing mode.

**Automated:**
- No test runner in the codebase today; skip automated tests for this slice.
- If a test setup lands later: cover `updateProfileRequestSchema` rejecting non-URL `img` and `imageUploadResponseSchema` parsing `{ upload_url, path }`.

## 8. Acceptance Criteria

- [ ] Cover/background section is removed; no `Image` icon placeholder remains.
- [ ] Avatar upload uses `react-easy-crop` modal with 1:1 aspect + 256×256 JPEG output.
- [ ] Persisted `img` is `upload.path` (CDN read URL), not the presigned PUT URL.
- [ ] Avatar shows in: profile page, sidebar, topbar.
- [ ] PUT to presigned URL goes through `uploadToPresignedUrl` (single upload path).
- [ ] All toasts use `profile.*` translation keys in both `en.json` and `ar.json`.
- [ ] No new Bunny env vars introduced; backend handles auth.
- [ ] `react-easy-crop` added to `package.json`.
- [ ] `getTeacherProfile` wired to real backend endpoint (pending backend).
- [ ] React 19 / `react-easy-crop` peer-dependency verified (install succeeds; see §3 "Dependency").
- [ ] Sidebar/topbar avatar initials follow the rule documented in §3 (first letter; second letter if multi-word name).
