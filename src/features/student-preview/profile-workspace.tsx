"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { TeacherProfile } from "@/features/profile/schema";
import type { CourseOut } from "@/features/shell/schema";
import { uploadToPresignedUrl } from "@/lib/upload";
import { requestProfileImageUpload, updateTeacherProfile } from "@/features/profile/actions";
import { buildTeacherPreviewModel } from "./build-teacher-preview-model";
import { PreviewWorkspace } from "./preview-workspace";
import { StudentTeacherProfilePreview } from "./student-teacher-profile-preview";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ProfileWorkspaceProps {
  profile: TeacherProfile;
  courses: CourseOut[];
  locale: string;
  publicImageUrl: string | null;
}

const COPY = {
  ar: { edit: "تعديل الملف", save: "حفظ", saving: "جاري الحفظ...", name: "الاسم", bio: "النبذة", location: "الموقع", image: "الصورة", remove: "إزالة", saved: "تم الحفظ", error: "حدث خطأ", invalidType: "نوع الملف غير صالح", tooLarge: "الملف كبير جداً (الحد الأقصى 5 ميجا)" },
  en: { edit: "Edit Profile", save: "Save", saving: "Saving...", name: "Name", bio: "Bio", location: "Location", image: "Profile Image", remove: "Remove", saved: "Saved", error: "Something went wrong", invalidType: "Invalid file type", tooLarge: "File too large (max 5MB)" },
};

export function ProfileWorkspace({
  profile,
  courses,
  locale,
  publicImageUrl,
}: ProfileWorkspaceProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en";
  const copy = COPY[lang];
  const router = useRouter();

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.description ?? "");
  const [location_, setLocation] = useState(profile.location ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(publicImageUrl);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleAvatarChange = useCallback((file: File | null) => {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current = [];

    if (file) {
      if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
        toast.error(copy.invalidType);
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        toast.error(copy.tooLarge);
        return;
      }
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      setAvatarFile(file);
      setAvatarUrl(url);
    } else {
      setAvatarFile(null);
      setAvatarUrl(null);
    }
    markDirty();
  }, [markDirty, copy.invalidType, copy.tooLarge]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const previewModel = buildTeacherPreviewModel({
    profile: { ...profile, name, description: bio, location: location_ },
    courses,
    avatarObjectUrl: avatarUrl,
    publicAvatarUrl: publicImageUrl,
  });

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let imagePath = profile.img;

      if (avatarFile) {
        const upload = await requestProfileImageUpload(`avatar-${Date.now()}.${avatarFile.name.split(".").pop() ?? "jpg"}`);
        if (!upload.success) {
          toast.error(upload.error.type === "Upstream" ? copy.error : upload.error.message);
          return;
        }
        const response = await uploadToPresignedUrl(upload.data.upload_url, avatarFile);
        if (!response.ok) {
          toast.error(copy.error);
          return;
        }
        imagePath = upload.data.path;
      } else if (avatarUrl === null && profile.img) {
        imagePath = null;
      }

      const result = await updateTeacherProfile({
        name: name.trim(),
        description: bio.trim() || null,
        location: location_.trim() || null,
        img: imagePath,
      });
      if (!result.success) {
        toast.error(result.error.type === "Upstream" ? copy.error : result.error.message);
        return;
      }

      toast.success(copy.saved);
      setDirty(false);
      router.refresh();
    } catch {
      toast.error(copy.error);
    } finally {
      setSaving(false);
    }
  }

  const editor = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">{copy.edit}</h2>
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium">{copy.name}</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          maxLength={100}
          onChange={(e) => { setName(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="profile-bio" className="block text-sm font-medium">{copy.bio}</label>
        <textarea
          id="profile-bio"
          value={bio}
          maxLength={60}
          onChange={(e) => { setBio(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          rows={3}
        />
        <p className="mt-1 text-xs text-muted-foreground text-end">{bio.length}/60</p>
      </div>
      <div>
        <label htmlFor="profile-location" className="block text-sm font-medium">{copy.location}</label>
        <input
          id="profile-location"
          type="text"
          value={location_}
          onChange={(e) => { setLocation(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="profile-avatar" className="block text-sm font-medium">{copy.image}</label>
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
              {copy.remove}
            </button>
          </div>
        )}
        <input
          id="profile-avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
          className="mt-2 w-full"
        />
      </div>
      <button
        type="button"
        disabled={!dirty || saving || !name.trim()}
        onClick={handleSave}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? copy.saving : copy.save}
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
