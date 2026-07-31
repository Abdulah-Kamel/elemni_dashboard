# Profile Avatar Upload to Bunny Storage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the teacher profile avatar to Bunny Storage via presigned URLs, add a `react-easy-crop` modal for 1:1 cropping with preview, remove the cover/background section, and surface the avatar in the sidebar and topbar.

**Architecture:** The backend issues presigned PUT URLs via `POST /api/v1/teachers/me/request-image-upload?filename=...`. The frontend crops to 256×256 JPEG (quality 0.9) client-side, PUTs to the presigned URL, then PATCHes the CDN read URL (`path`) as the new `img`. No Bunny credentials ever touch the frontend.

**Tech Stack:** Next.js 16.2.6 (see AGENTS.md — consult `node_modules/next/dist/docs/` before writing Next.js code), React 19, `@base-ui/react` (not Radix), `react-easy-crop` (new dep), `@tanstack/react-query`, Zod, vitest.

## Global Constraints

- `react-easy-crop` peer-dep: `react >=16.4.0` — compatible with React 19, no flags needed.
- Avatar output: 256×256 JPEG Blob, quality 0.9.
- All new user-facing text MUST use i18n keys in both `en.json` and `ar.json`.
- Sidebar/topbar `initials` rule: first letter of `name`; second letter of second word if multi-word; `User` icon if empty.
- `revalidateTag("profile", "default")` is deprecated in Next 16 — replace with `updateTag("profile")` in Server Actions.
- The `userOutSchema` (`/api/v1/auth/me`) does NOT include `img`. The layout passes `user.name` from the session. Sidebar/topbar avatar will show initials only until `GET /api/v1/teachers/me` lands (pending backend).

---
### Task 1: Install `react-easy-crop` and widen `uploadToPresignedUrl` to accept `Blob`

**Files:**
- Modify: `package.json`
- Modify: `src/lib/upload.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `uploadToPresignedUrl(url: string, file: File | Blob): Promise<Response>` — signature widened from `File` to `File | Blob` to accommodate the crop modal's output.

- [ ] **Step 1: Install `react-easy-crop`**

```bash
npm install react-easy-crop@6.2.3
```

Expected: installs `react-easy-crop@6.2.3` in `node_modules` and `package.json`.

- [ ] **Step 2: Widen `uploadToPresignedUrl` parameter type**

Edit `src/lib/upload.ts` — change the `file` parameter type from `File` to `File | Blob`:

```ts
export async function uploadToPresignedUrl(url: string, file: File | Blob): Promise<Response> {
  return fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json src/lib/upload.ts
git commit -m "chore: install react-easy-crop, widen uploadToPresignedUrl to accept Blob"
```

---
### Task 2: Tighten profile schema and remove `cover_subtitle`

**Files:**
- Modify: `src/features/profile/schema.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `updateProfileRequestSchema` — `img` is now `z.string().url().nullable().optional()` (was unconstrained `z.string()`).

- [ ] **Step 1: Update `updateProfileRequestSchema`**

Read the current file:
```bash
type src\features\profile\schema.ts
```

Edit `img` field in `updateProfileRequestSchema`:

```ts
export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  img: z.string().url().nullable().optional(),
});
```

Make sure the `cover_subtitle` key that was in the old profile page is NOT referenced from schema (it was only a CSS/UI key, not in schema).

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/schema.ts
git commit -m "feat: tighten profile img field to url().nullable()"
```

---
### Task 3: Write schema unit tests

**Files:**
- Create: `src/features/profile/__tests__/schema.test.ts`
- Test: `src/features/profile/schema.ts`

**Interfaces:**
- Consumes: `updateProfileRequestSchema`, `teacherProfileSchema` from `schema.ts`
- Produces: test coverage for the tightened validation.

- [ ] **Step 1: Create test file**

```ts
import { describe, it, expect } from "vitest";
import {
  teacherProfileSchema,
  updateProfileRequestSchema,
} from "@/features/profile/schema";

describe("updateProfileRequestSchema", () => {
  it("accepts valid profile update without img", () => {
    const result = updateProfileRequestSchema.parse({
      name: "Test Teacher",
    });
    expect(result.name).toBe("Test Teacher");
    expect(result.img).toBeUndefined();
  });

  it("accepts valid url as img", () => {
    const result = updateProfileRequestSchema.parse({
      name: "Test Teacher",
      img: "https://storage.bunnycdn.com/avatars/123.jpg",
    });
    expect(result.img).toBe("https://storage.bunnycdn.com/avatars/123.jpg");
  });

  it("accepts null as img", () => {
    const result = updateProfileRequestSchema.parse({
      name: "Test Teacher",
      img: null,
    });
    expect(result.img).toBeNull();
  });

  it("rejects non-url string as img", () => {
    expect(() =>
      updateProfileRequestSchema.parse({
        name: "Test Teacher",
        img: "not-a-url",
      }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      updateProfileRequestSchema.parse({ name: "" }),
    ).toThrow();
  });

  it("rejects name exceeding 100 chars", () => {
    expect(() =>
      updateProfileRequestSchema.parse({ name: "a".repeat(101) }),
    ).toThrow();
  });

  it("rejects description exceeding 500 chars", () => {
    expect(() =>
      updateProfileRequestSchema.parse({ name: "Test", description: "a".repeat(501) }),
    ).toThrow();
  });
});

describe("teacherProfileSchema", () => {
  const validProfile = {
    id: 1,
    name: "أ. مختار الحسيني",
    email: "m@test.edu",
    slug: "mokhtar",
    phone_number: "+201234567890",
    description: "خبير في تدريس علوم اللغة العربية",
    img: "https://storage.bunnycdn.com/avatars/123.jpg",
  };

  it("parses valid profile with img url", () => {
    expect(() => teacherProfileSchema.parse(validProfile)).not.toThrow();
  });

  it("parses valid profile with null img", () => {
    expect(() =>
      teacherProfileSchema.parse({ ...validProfile, img: null }),
    ).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      teacherProfileSchema.parse({ ...validProfile, email: "not-email" }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npx vitest run src/features/profile/__tests__/schema.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/__tests__/schema.test.ts
git commit -m "test: add profile schema validation tests"
```

---
### Task 4: Create the `AvatarCropModal` component

**Files:**
- Create: `src/features/profile/components/avatar-crop-modal.tsx`

**Interfaces:**
- Consumes: `{ src: string; open: boolean; onClose(): void; onApply(blob: Blob): void }`
- Produces: a reusable cropper modal that emits 256x256 JPEG Blobs.

This component wraps `react-easy-crop` inside a `@base-ui/react` Dialog. It shows zoom/pan controls and a single "Apply" button. Apply produces a canvas-cropped JPEG Blob and calls `onApply(blob)`.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogPopup, DialogBackdrop, DialogTitle } from "@base-ui/react/dialog";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";

type AvatarCropModalProps = {
  src: string;           // object URL or remote image URL
  open: boolean;
  onClose: () => void;
  onApply: (blob: Blob) => void;
};

export function AvatarCropModal({ src, open, onClose, onApply }: AvatarCropModalProps) {
  const t = useTranslations("profile");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const applyingRef = useRef(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (applyingRef.current || !croppedAreaPixels) return;
    applyingRef.current = true;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image load failed"));
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      applyingRef.current = false;
      return;
    }

    const { width: cw, height: ch } = croppedAreaPixels;
    canvas.width = 256;
    canvas.height = 256;

    ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, cw, ch, 0, 0, 256, 256);

    canvas.toBlob(
      (blob) => {
        applyingRef.current = false;
        if (blob) {
          onApply(blob);
          onClose();
        }
      },
      "image/jpeg",
      0.9,
    );
  }, [src, croppedAreaPixels, onApply, onClose]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.2, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.2, 0.5)), []);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogPopup className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t("crop_modal_title")}
          </DialogTitle>

          <div className="relative mx-auto mt-4 h-72 w-72 overflow-hidden rounded-full bg-neutral-900">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={zoomOut}
              className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-foreground hover:bg-border transition-colors"
              aria-label={t("crop_zoom_out")}
            >
              <ZoomOut className="size-4" />
            </button>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-40 accent-primary"
              aria-label={t("crop_zoom_in")}
            />
            <button
              type="button"
              onClick={zoomIn}
              className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-foreground hover:bg-border transition-colors"
              aria-label={t("crop_zoom_in")}
            >
              <ZoomIn className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted transition-colors"
            >
              {t("crop_cancel")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("crop_apply")}
            </button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/components/avatar-crop-modal.tsx
git commit -m "feat: add AvatarCropModal with react-easy-crop and canvas output"
```

---
### Task 5: Update server actions — replace `revalidateTag` with `updateTag`

**Files:**
- Modify: `src/features/profile/actions.ts`

**Interfaces:**
- Consumes: `updateProfile`, `requestProfileImageUpload` (existing signatures unchanged)
- Produces: Server Actions using `updateTag("profile")` instead of `revalidateTag("profile", "default")`.

- [ ] **Step 1: Update imports and calls**

Edit `src/features/profile/actions.ts`:

- Change `import { revalidateTag } from "next/cache"` → `import { updateTag } from "next/cache"`
- Replace both occurrences of `revalidateTag("profile", "default")` with `updateTag("profile")`
  - Line 30 in `updateProfile`
  - Line 65 in `requestProfileImageUpload`

The diff:
```ts
// Before:
import { revalidateTag } from "next/cache";
// ...
revalidateTag("profile", "default");

// After:
import { updateTag } from "next/cache";
// ...
updateTag("profile");
```

- [ ] **Step 2: Run typecheck to confirm no regressions**

```bash
npm run typecheck
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/actions.ts
git commit -m "refactor: replace revalidateTag with updateTag per Next 16 read-your-own-writes pattern"
```

---
### Task 6: Refactor `TeacherProfilePage` — remove cover, wire crop modal, fix `img` URL bug

**Files:**
- Modify: `src/features/profile/components/teacher-profile-page.tsx`

**Interfaces:**
- Consumes: `AvatarCropModal` from Task 4, `uploadToPresignedUrl` from Task 1, `updateProfile`, `requestProfileImageUpload` from actions
- Produces: Profile page with no cover section, crop-on-select flow, correct `img` persistence.

Changes:
1. **Remove the entire cover section** (lines ~131-189 currently: gradient banner, name overlay, `Image` icon, `cover_subtitle`, the `cover_subtitle` translation reference). Keep ONLY the avatar circle + file trigger.
2. **Replace `<input type="file">`** with a button that opens `AvatarCropModal`.
3. **Add `AvatarCropModal`** state management (`cropSrc`, `cropOpen`).
4. **Swap raw `fetch PUT`** for `uploadToPresignedUrl` from `src/lib/upload.ts`.
5. **Use `upload.path`** (not `upload.uploadUrl`) for persisted `img`.
6. **Track `croppedBlob`** as a separate piece of state.
7. **Remove unused imports:** `Image`, `Camera`, `BookOpen`, `Award`, `Users` (if only used in cover/stats). Keep `User`, `Pencil`, `Phone`, `IdCard`, `Loader2`, `Loader2`, `Camera` (no, remove Camera too since the cover overlay cam is gone — add `ZoomIn`/`ZoomOut` not needed since they're inside the modal).

Actually let me think about this more carefully. The imports currently used:

- `User` — YES, avatar fallback
- `Image` — cover section, REMOVE
- `Pencil` — edit button, KEEP
- `Users` — STAT_RAW icon, KEEP
- `BookOpen` — STAT_RAW icon, KEEP
- `Award` — STAT_RAW icon, KEEP
- `Star` — STAT_RAW icon, KEEP
- `IdCard` — bio icon, KEEP
- `Phone` — input icon, KEEP
- `Loader2` — saving spinner, KEEP
- `Camera` — hover overlay on avatar, REMOVE (the crop modal replaces this UX)

The `STAT_RAW` and `SKILL_CHIPS` blocks stay as they are.

Let me write the full final version of `teacher-profile-page.tsx`:

- [ ] **Step 1: Rewrite the component**

```tsx
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  User,
  Pencil,
  Users,
  BookOpen,
  Award,
  Star,
  IdCard,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProfile, requestProfileImageUpload } from "@/features/profile/actions";
import { uploadToPresignedUrl } from "@/lib/upload";
import { AvatarCropModal } from "@/features/profile/components/avatar-crop-modal";
import type { TeacherProfile } from "@/features/profile/schema";

const STAT_RAW = [
  { icon: Users, key: "stats_total_students", value: 1240 },
  { icon: BookOpen, key: "stats_published_courses", value: 8 },
  { icon: Award, key: "stats_overall_rating", value: 4.9, hasStar: true as const },
];

const SKILL_CHIPS = ["الأدب العربي", "البلاغة", "النحو والصرف"];

type Props = {
  profile: TeacherProfile;
};

export function TeacherProfilePage({ profile }: Props) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US"), [locale]);

  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.description ?? "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const tabs = [
    { id: "account", label: t("tab_account") },
    { id: "experience", label: t("tab_experience") },
    { id: "display", label: t("tab_display") },
  ];

  const currentImg = previewUrl ?? (croppedBlob ? null : profile.img);

  const cancel = useCallback(() => {
    setName(profile.name);
    setBio(profile.description ?? "");
    setCroppedBlob(null);
    setPreviewUrl(null);
    setCropSrc(null);
    setEditing(false);
  }, [profile.name, profile.description]);

  const handleAvatarClick = useCallback(() => {
    if (!editing) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("avatar_too_large"));
        return;
      }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast.error(t("avatar_invalid_type"));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setCropSrc(objectUrl);
      setCropOpen(true);
    };
    input.click();
  }, [editing, t]);

  const handleCropApply = useCallback((blob: Blob) => {
    setCroppedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setCropSrc(null);
  }, []);

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    setCropSrc(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let img = profile.img;

      if (croppedBlob) {
        const filename = `avatar-${Date.now()}.jpg`;
        const upload = await requestProfileImageUpload(filename);
        if (!upload.success) {
          toast.error(upload.error.message);
          setSaving(false);
          return;
        }

        const putRes = await uploadToPresignedUrl(upload.uploadUrl, croppedBlob);
        if (!putRes.ok) {
          toast.error(t("error_upload"));
          setSaving(false);
          return;
        }

        // FIX: persist the CDN read URL (path), not the presigned PUT URL
        img = upload.path;
      }

      const result = await updateProfile({ name, description: bio, img });
      if (!result.success) {
        toast.error(result.error.message);
        setSaving(false);
        return;
      }

      toast.success(t("saved"));
      setName(result.data.name);
      setBio(result.data.description ?? "");
      setCroppedBlob(null);
      setPreviewUrl(null);
      setSaving(false);
      setEditing(false);
    } catch {
      toast.error(t("error_upstream"));
      setSaving(false);
    }
  }, [name, bio, croppedBlob, profile.img, t]);

  const enableEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 100);
  }, []);

  return (
    <>
      <AvatarCropModal
        src={cropSrc ?? ""}
        open={cropOpen}
        onClose={handleCropClose}
        onApply={handleCropApply}
      />

      <div
        style={{
          "--profile-navy": "#1E2A5A",
          "--profile-lavender": "#C7CBF0",
          "--profile-lavender-light": "#E8E9F8",
          "--profile-slate": "#2D3A4A",
          "--profile-muted": "#8E94A2",
          "--profile-input-bg": "#F5F5F7",
        } as React.CSSProperties}
      >
        {/* ── Avatar section (cover removed) ── */}
        <section className="relative mb-8 flex flex-col items-center pt-8">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={!editing}
            className="group relative"
          >
            <div className="flex size-[130px] items-center justify-center rounded-full border-4 border-white bg-[var(--profile-slate)] shadow-lg">
              {currentImg ? (
                <img
                  src={currentImg}
                  alt={name}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <User className="size-14 text-white/60" />
              )}
            </div>
            {editing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
                <Pencil className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}
          </button>

          {editing && (
            <p className="mt-3 text-[13px] font-medium text-[var(--profile-muted)]">
              {t("avatar_label")}
            </p>
          )}
        </section>

        {!editing && (
          <div className="mb-8 flex justify-center">
            <Button
              onClick={enableEditing}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--profile-navy)",
                color: "white",
              }}
            >
              <Pencil className="size-4" />
              {t("edit_profile")}
            </Button>
          </div>
        )}

        {/* ── Stats + Bio row (unchanged) ── */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col gap-5">
            {STAT_RAW.map((stat) => (
              <div key={stat.key} className="flex items-center gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--profile-lavender-light)" }}
                >
                  <stat.icon className="size-5" style={{ color: "var(--profile-slate)" }} />
                </div>
                <div className="text-right">
                  <p className="text-[13px]" style={{ color: "var(--profile-muted)" }}>
                    {t(stat.key)}
                  </p>
                  <p
                    className="text-[24px] font-bold leading-tight"
                    style={{ color: "var(--profile-slate)" }}
                  >
                    {stat.hasStar && (
                      <Star className="-mt-1 inline size-5 align-middle fill-amber-400 text-amber-400" />
                    )}
                    {nf.format(stat.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right">
            <div className="mb-3 flex items-center gap-2">
              <IdCard className="size-5 shrink-0" style={{ color: "var(--profile-slate)" }} />
              <h2 className="text-[17px] font-bold" style={{ color: "var(--profile-slate)" }}>
                {t("bio_title")}
              </h2>
            </div>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "var(--profile-muted)" }}
            >
              {bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKILL_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full px-3.5 py-1 text-[13px]"
                  style={{
                    backgroundColor: "var(--profile-lavender-light)",
                    color: "var(--profile-slate)",
                    border: "1px solid var(--profile-lavender)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tabbed form (unchanged) ── */}
        <section ref={formRef}>
          <div className="relative mb-6">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative pb-2 text-[14px] font-semibold transition-colors"
                  style={{
                    color: activeTab === tab.id ? "var(--profile-navy)" : "var(--profile-muted)",
                  }}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span
                      className="absolute bottom-0 start-0 end-0 h-[2px] rounded-full"
                      style={{ backgroundColor: "var(--profile-navy)" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="absolute bottom-0 start-0 end-0 h-px" style={{ backgroundColor: "#E8E8EC" }} />
          </div>

          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="block text-right text-[13px] font-medium"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {t("full_name")}
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing}
                  className="h-12 w-full rounded-[10px] px-4 text-right text-[14px] outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: editing ? "var(--profile-input-bg)" : "#EEEEF0",
                    border: "1px solid #E4E4E7",
                    color: editing ? "var(--profile-slate)" : "#8E94A2",
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="block text-right text-[13px] font-medium"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {t("phone")}
                </label>
                <div className="relative">
                  <Phone
                    className="absolute start-3 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: "var(--profile-muted)" }}
                  />
                  <input
                    value={profile.phone_number ?? "+20 50 123 4567"}
                    disabled
                    className="h-12 w-full rounded-[10px] px-4 text-right text-[14px] outline-none disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "#EEEEF0",
                      border: "1px solid #E4E4E7",
                      color: "#8E94A2",
                      paddingInlineStart: "2.5rem",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label
                  className="block text-right text-[13px] font-medium"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {t("email")}
                </label>
                <input
                  value={profile.email}
                  disabled
                  className="h-12 w-full rounded-[10px] px-4 text-right text-[14px] outline-none disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#EEEEF0",
                    border: "1px solid #E4E4E7",
                    color: "#8E94A2",
                  }}
                />
                <p className="text-right text-[12px]" style={{ color: "var(--profile-muted)" }}>
                  {t("email_helper")}
                </p>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label
                  className="block text-right text-[13px] font-medium"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {t("bio_label")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!editing}
                  rows={5}
                  className="w-full rounded-[10px] px-4 py-3 text-right text-[14px] outline-none transition-colors focus:ring-2 resize-none disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: editing ? "var(--profile-input-bg)" : "#EEEEF0",
                    border: "1px solid #E4E4E7",
                    color: editing ? "var(--profile-slate)" : "#8E94A2",
                  }}
                />
              </div>

              {editing && (
                <div className="flex items-center gap-3 lg:col-span-2 justify-start">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--profile-navy)" }}
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    {t("save_changes")}
                  </Button>
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium"
                    style={{ color: "var(--profile-muted)" }}
                  >
                    {t("cancel")}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "experience" && (
            <p className="py-8 text-center text-[14px]" style={{ color: "var(--profile-muted)" }}>
              {/* TODO: الخبرات والمهارات */}
            </p>
          )}
          {activeTab === "display" && (
            <p className="py-8 text-center text-[14px]" style={{ color: "var(--profile-muted)" }}>
              {/* TODO: إعدادات العرض */}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
```

Key changes from the original:
- Removed `Image`, `Camera` imports; removed `fileRef`, `handleFileSelect`, `previewUrl` (replaced with crop state)
- Cover section (gradient banner + name overlay) is entirely removed
- Avatar is now centered with no name below it (the `h1` name was on the cover)
- `handleAvatarClick` creates a hidden `<input type="file">` inline, validates size/type, opens crop modal
- `handleCropApply` stores the blob and generates an object URL preview
- `handleSave` uses `uploadToPresignedUrl` and persists `upload.path`
- Added `<AvatarCropModal>` at the top of the JSX tree
- Added an `avatar_label` text hint when editing

- [ ] **Step 2: Typecheck and build**

```bash
npm run typecheck
```

Fix any type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/components/teacher-profile-page.tsx
git commit -m "feat: refactor profile page - remove cover, wire crop modal, fix img URL bug"
```

---
### Task 7: Add `img` support to `AccountMenu` for sidebar/topbar avatar display

**Files:**
- Modify: `src/features/shell/components/account-menu.tsx`
- Modify: `src/features/shell/components/topbar.tsx`
- Modify: `src/features/shell/components/sidebar.tsx`

**Interfaces:**
- Consumes: `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- Produces: `AccountMenu` accepts optional `img` prop and renders `AvatarImage` when present.

Note: Since `userOutSchema` doesn't include `img`, the sidebar/topbar currently get `user.name` from the session. The `img` prop is added optionally so it works now (initials only) and lights up automatically when `GET /api/v1/teachers/me` is wired by the layout.

- [ ] **Step 1: Update `AccountMenu` to accept and render `img`**

```tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/features/shell/components/logout-button";

type AccountMenuProps = {
  teacherName: string;
  teacherImg?: string | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

export function AccountMenu({ teacherName, teacherImg }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <Avatar className="relative size-10 cursor-pointer border border-outline-variant bg-brand-violet-tint text-label-md font-bold text-brand-violet transition-opacity hover:opacity-80">
            {teacherImg ? (
              <AvatarImage src={teacherImg} alt={teacherName} />
            ) : (
              <AvatarFallback>
                {initials(teacherName)}
              </AvatarFallback>
            )}
            <span
              aria-hidden="true"
              className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-error"
            />
          </Avatar>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <div className="flex items-center gap-3 border-b border-outline-variant px-md py-3">
          <Avatar className="size-9 shrink-0 bg-brand-violet-tint text-body-md font-bold text-brand-violet">
            {teacherImg ? (
              <AvatarImage src={teacherImg} alt={teacherName} />
            ) : (
              <AvatarFallback>
                {initials(teacherName)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md text-body-md--line-height font-semibold text-foreground">
              {teacherName}
            </p>
          </div>
        </div>
        <LogoutButton variant="menu" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Update `Topbar` to pass `teacherImg` down**

```tsx
type TopbarProps = {
  teacherName: string;
  teacherImg?: string | null;
};

export function Topbar({ teacherName, teacherImg }: TopbarProps) {
  // ... rest unchanged ...
  return (
    // ...
    <AccountMenu teacherName={teacherName} teacherImg={teacherImg} />
    // ...
  );
}
```

- [ ] **Step 3: Update `Sidebar` to accept and pass `teacherImg` down**

Read the current sidebar first:
```bash
type src\features\shell\components\sidebar.tsx
```

Find where it creates the bottom section with the teacher's account info and pass `teacherImg` through. The sidebar renders `AccountMenu` or its own avatar section? Let me check...

Actually, looking at the layout:
```tsx
<Sidebar teacherName={user.name} teacherRole={teacherRole} />
<Topbar teacherName={user.name} />
```

`Topbar` already renders `AccountMenu`. The sidebar likely renders just text/initials in its bottom section. I need to verify what `Sidebar` renders. Let me read it.

(placeholder — the sidebar needs to be checked. If it also renders an avatar, add `img` there too.)

- [ ] **Step 4: Update layout to pass `teacherImg`**

The layout currently passes `user.name` from the session to both `Sidebar` and `Topbar`. Since `userOutSchema` doesn't have `img`, `teacherImg` will be `undefined` initially. Add the optional prop:

```tsx
<Sidebar teacherName={user.name} teacherRole={teacherRole} />
<Topbar teacherName={user.name} />
```

No change needed — `teacherImg` is optional, so omitting it is fine.

When `GET /api/v1/teachers/me` lands:
1. Layout also calls `getTeacherProfile()`.
2. Passes `profile.img` as `teacherImg` to both `Topbar` and `Sidebar`.
3. `AccountMenu` renders the image.

- [ ] **Step 5: Check sidebar avatar section**

```bash
type src\features\shell\components\sidebar.tsx
```

If sidebar has an account/avatar section that renders initials, update it similarly.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/features/shell/components/account-menu.tsx src/features/shell/components/topbar.tsx src/features/shell/components/sidebar.tsx app/[locale]/(teacher)/layout.tsx
git commit -m "feat: add optional teacherImg prop to AccountMenu, Topbar, Sidebar"
```

---
### Task 8: Add i18n keys for crop modal and error messages

**Files:**
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/ar.json`

- [ ] **Step 1: Add new keys to `en.json`**

Append to the `profile` namespace:

```json
"avatar_label": "Profile Photo",
"crop_modal_title": "Crop Photo",
"crop_apply": "Apply",
"crop_cancel": "Cancel",
"crop_zoom_in": "Zoom in",
"crop_zoom_out": "Zoom out",
"avatar_too_large": "Image must be 5 MB or smaller",
"avatar_invalid_type": "Only PNG, JPG, or WEBP is allowed",
"error_upload": "Failed to upload image"
```

- [ ] **Step 2: Add new keys to `ar.json`**

Append to the `profile` namespace (use proper Arabic script from the existing file):

```json
"avatar_label": "الصورة الشخصية",
"crop_modal_title": "اقتصاص الصورة",
"crop_apply": "تطبيق",
"crop_cancel": "إلغاء",
"crop_zoom_in": "تكبير",
"crop_zoom_out": "تصغير",
"avatar_too_large": "يجب أن تكون الصورة ٥ ميجابايت أو أقل",
"avatar_invalid_type": "مسموح فقط بـ PNG أو JPG أو WEBP",
"error_upload": "فشل رفع الصورة"
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat(i18n): add crop modal and upload error translation keys"
```

---
### Task 9: Wire profile query when backend endpoint is available (future / not in this slice)

Per the spec's phase split, wiring `GET /api/v1/teachers/me` into `src/features/profile/queries.ts` happens when the backend ships the endpoint. The layout would then:

1. Import `getTeacherProfile()` in the layout.
2. Call it alongside `verifySession()`.
3. Pass `profile.img` as `teacherImg` to `Topbar` and `Sidebar`.

This task is documented for future reference only — not implemented in this slice.

---
## Verification

After all tasks:
1. `npm run typecheck` — must pass.
2. `npm run lint` — must pass.
3. `npm run test` — existing + new tests pass.
4. `npm run dev` — manual verification per spec §7.

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every requirement from the spec is addressed (crop modal, cover removal, img URL fix, `uploadToPresignedUrl`, sidebar/topbar avatar, i18n, schema tightening).
- [ ] **Placeholder scan:** No TBD, TODO (except the deliberate sidebar check step which is resolved at execution), or "implement later" in code/steps.
- [ ] **Type consistency:** `upload.path` is used everywhere (not `upload.uploadUrl`). `updateTag("profile")` matches Next 16 API. `Blob` type accepted by `uploadToPresignedUrl`.
- [ ] **Scope:** Single feature, one PR-sized slice. Backend-dependent wiring deferred cleanly.

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
