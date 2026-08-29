"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/routing";
import { uploadToPresignedUrl } from "@/lib/upload";
import {
  requestProfileImageUpload,
  updateTeacherProfile,
} from "@/features/profile/actions";
import type { TeacherProfile } from "@/features/profile/schema";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function EditProfileDialog({
  profile,
  publicImageUrl,
}: {
  profile: TeacherProfile;
  publicImageUrl: string | null;
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function reset() {
    setName(profile.name);
    setDescription(profile.description ?? "");
    setAvatar(null);
    setPreviewUrl(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleAvatar(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error(t("avatar_invalid_type"));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(t("avatar_too_large"));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let imagePath = profile.img;

      if (avatar) {
        const upload = await requestProfileImageUpload(`avatar-${Date.now()}.${avatar.name.split(".").pop() ?? "jpg"}`);
        if (!upload.success) {
          toast.error(upload.error.type === "Upstream" ? t("error_upstream") : upload.error.message);
          return;
        }

        const response = await uploadToPresignedUrl(upload.data.upload_url, avatar);
        if (!response.ok) {
          toast.error(t("error_upload"));
          return;
        }
        imagePath = upload.data.path;
      }

      const result = await updateTeacherProfile({
        name: name.trim(),
        description: description.trim() || null,
        img: imagePath,
      });
      if (!result.success) {
        toast.error(result.error.type === "Upstream" ? t("error_upstream") : result.error.message);
        return;
      }

      toast.success(t("saved"));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t("error_upstream"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" className="bg-surface" />}>
        <Pencil data-icon="inline-start" />
        {t("edit_profile")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("edit_profile")}</DialogTitle>
          <DialogDescription>{t("edit_profile_description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-lg">
          <div className="flex items-center gap-md">
            <Avatar className="size-20 rounded-2xl after:rounded-2xl">
              {(previewUrl || publicImageUrl) && (
                <AvatarImage src={previewUrl ?? publicImageUrl ?? undefined} alt={name} className="rounded-2xl" />
              )}
              <AvatarFallback className="rounded-2xl bg-primary-tint text-title-md font-bold text-primary">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Camera data-icon="inline-start" />
                {t("upload_avatar")}
              </Button>
              <p className="mt-1 text-label-sm text-on-surface-muted">{t("avatar_hint")}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handleAvatar(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">{t("full_name")}</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-description">{t("bio_label")}</Label>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={60}
              rows={5}
              className="resize-none"
            />
            <p className="text-end text-label-sm text-on-surface-muted">{description.length}/60</p>
          </div>

          <div className="grid gap-md sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input value={profile.phone_number ?? "—"} disabled />
            </div>
          </div>
          <p className="text-label-sm text-on-surface-muted">{t("email_helper")}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || name.trim().length === 0}>
            {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
            {t("save_changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
