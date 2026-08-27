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

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const previewModel = buildTeacherPreviewModel({
    profile: { ...profile, name, description: bio, location: location_ },
    courses,
    avatarObjectUrl: avatarUrl,
    publicAvatarUrl: null,
  });

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
