"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "@/i18n/routing"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { TeacherProfile } from "@/features/profile/schema"
import type { CourseOut } from "@/features/shell/schema"
import type { PreviewDeviceWidth } from "./types"
import { uploadToPresignedUrl } from "@/lib/upload"
import {
  requestProfileImageUpload,
  updateTeacherProfile,
} from "@/features/profile/actions"
import { buildTeacherPreviewModel } from "./build-teacher-preview-model"
import { PreviewWorkspace } from "./preview-workspace"
import type { PreviewWorkspaceTab } from "./preview-workspace"
import { StudentTeacherProfilePreview } from "./student-teacher-profile-preview"
import {
  ProfilePreviewBridgeProvider,
  type ProfilePreviewField,
  useProfilePreviewBridge,
} from "./profile-preview-bridge"
import { cn } from "@/lib/utils"

const MAX_AVATAR_SIZE = 10 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function parseExperience(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null
}

interface ProfileWorkspaceProps {
  profile: TeacherProfile
  courses: CourseOut[]
  locale: string
  publicImageUrl: string | null
}

const COPY = {
  ar: {
    edit: "تعديل الملف",
    save: "حفظ",
    saving: "جاري الحفظ...",
    name: "الاسم",
    bio: "النبذة",
    location: "الموقع",
    experience: "سنوات الخبرة",
    image: "الصورة",
    remove: "إزالة",
    saved: "تم الحفظ",
    error: "حدث خطأ",
    invalidType: "نوع الملف غير صالح",
    tooLarge: "الملف كبير جداً (الحد الأقصى ١٠ ميجابايت)",
    avatarHint: "PNG أو JPG أو WEBP بحد أقصى ١٠ ميجابايت",
  },
  en: {
    edit: "Edit Profile",
    save: "Save",
    saving: "Saving...",
    name: "Name",
    bio: "Bio",
    location: "Location",
    experience: "Years of experience",
    image: "Profile Image",
    remove: "Remove",
    saved: "Saved",
    error: "Something went wrong",
    invalidType: "Invalid file type",
    tooLarge: "File too large (max 10 MB)",
    avatarHint: "PNG, JPG, or WEBP up to 10 MB",
  },
}

export function ProfileWorkspace({
  profile,
  courses,
  locale,
  publicImageUrl,
}: ProfileWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PreviewWorkspaceTab>("edit")
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false)

  return (
    <ProfilePreviewBridgeProvider
      enabled={!fullPreviewOpen}
      onSelectField={() => {
        setActiveTab("edit")
        setFullPreviewOpen(false)
      }}
    >
      <ProfileWorkspaceContent
        profile={profile}
        courses={courses}
        locale={locale}
        publicImageUrl={publicImageUrl}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        onFullPreviewOpenChange={setFullPreviewOpen}
      />
    </ProfilePreviewBridgeProvider>
  )
}

interface ProfileWorkspaceContentProps extends ProfileWorkspaceProps {
  activeTab: PreviewWorkspaceTab
  onActiveTabChange: (tab: PreviewWorkspaceTab) => void
  onFullPreviewOpenChange: (open: boolean) => void
}

function ProfileWorkspaceContent({
  profile,
  courses,
  locale,
  publicImageUrl,
  activeTab,
  onActiveTabChange,
  onFullPreviewOpenChange,
}: ProfileWorkspaceContentProps) {
  const lang = locale.startsWith("ar") ? "ar" : "en"
  const copy = COPY[lang]
  const router = useRouter()

  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.description ?? "")
  const [location_, setLocation] = useState(profile.location ?? "")
  const [experience, setExperience] = useState(
    profile.experience == null ? "" : String(profile.experience)
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(publicImageUrl)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deviceWidth, setDeviceWidth] = useState<PreviewDeviceWidth>("full")
  const objectUrlsRef = useRef<string[]>([])
  const {
    hoveredField,
    selectedField,
    setHoveredField,
    highlightField,
    clearSelectedField,
  } = useProfilePreviewBridge()

  const editorControlClass = useCallback(
    (field: ProfilePreviewField) =>
      cn(
        "transition-[box-shadow,background-color] duration-200",
        field === "avatar" ? "rounded-xl" : "rounded-lg",
        hoveredField === field &&
          "bg-primary/5 ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        selectedField === field &&
          "bg-primary/5 ring-2 ring-primary/55 ring-offset-2 ring-offset-background"
      ),
    [hoveredField, selectedField]
  )

  const editorFieldEvents = useCallback(
    (field: ProfilePreviewField) => ({
      "data-profile-editor-field": field,
      "data-profile-editor-state":
        selectedField === field
          ? "selected"
          : hoveredField === field
            ? "hovered"
            : "idle",
      onMouseEnter: () => setHoveredField(field),
      onMouseLeave: () => setHoveredField(null),
      onFocus: () => highlightField(field),
      onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
        const nextTarget = event.relatedTarget
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          clearSelectedField(field)
        }
      },
    }),
    [
      clearSelectedField,
      highlightField,
      hoveredField,
      selectedField,
      setHoveredField,
    ]
  )

  const markDirty = useCallback(() => setDirty(true), [])

  const handleAvatarChange = useCallback(
    (file: File | null) => {
      if (file) {
        if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
          toast.error(copy.invalidType)
          return false
        }
        if (file.size > MAX_AVATAR_SIZE) {
          toast.error(copy.tooLarge)
          return false
        }
      }

      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
      objectUrlsRef.current = []

      if (file) {
        const url = URL.createObjectURL(file)
        objectUrlsRef.current.push(url)
        setAvatarFile(file)
        setAvatarUrl(url)
        setAvatarRemoved(false)
      } else {
        setAvatarFile(null)
        setAvatarUrl(publicImageUrl)
        setAvatarRemoved(false)
      }
      markDirty()
      return true
    },
    [markDirty, copy.invalidType, copy.tooLarge, publicImageUrl]
  )

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeLeaving)
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving)
  }, [dirty])

  const previewModel = buildTeacherPreviewModel({
    profile: {
      ...profile,
      name,
      description: bio,
      location: location_,
      experience: parseExperience(experience),
    },
    courses,
    avatarObjectUrl: avatarRemoved ? null : avatarUrl,
    publicAvatarUrl: avatarRemoved ? null : publicImageUrl,
    locale,
  })

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      let imagePath = profile.img

      if (avatarFile) {
        const upload = await requestProfileImageUpload(
          `avatar-${Date.now()}.${avatarFile.name.split(".").pop() ?? "jpg"}`
        )
        if (!upload.success) {
          toast.error(
            upload.error.type === "Upstream" ? copy.error : upload.error.message
          )
          return
        }
        const response = await uploadToPresignedUrl(
          upload.data.upload_url,
          avatarFile
        )
        if (!response.ok) {
          toast.error(copy.error)
          return
        }
        imagePath = upload.data.path
      } else if (avatarRemoved && profile.img) {
        imagePath = null
      }

      const result = await updateTeacherProfile({
        name: name.trim(),
        description: bio.trim() || null,
        location: location_.trim() || null,
        experience: parseExperience(experience),
        img: imagePath,
      })
      if (!result.success) {
        toast.error(
          result.error.type === "Upstream" ? copy.error : result.error.message
        )
        return
      }

      toast.success(copy.saved)
      setDirty(false)
      router.refresh()
    } catch {
      toast.error(copy.error)
    } finally {
      setSaving(false)
    }
  }

  const editor = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">{copy.edit}</h2>
      <div {...editorFieldEvents("name")}>
        <label htmlFor="profile-name" className="block text-sm font-medium">
          {copy.name}
        </label>
        <input
          id="profile-name"
          data-profile-editor-input="name"
          type="text"
          value={name}
          maxLength={100}
          onChange={(e) => {
            setName(e.target.value)
            markDirty()
          }}
          className={cn(
            "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            editorControlClass("name")
          )}
        />
      </div>
      <div {...editorFieldEvents("bio")}>
        <label htmlFor="profile-bio" className="block text-sm font-medium">
          {copy.bio}
        </label>
        <textarea
          id="profile-bio"
          data-profile-editor-input="bio"
          value={bio}
          maxLength={60}
          onChange={(e) => {
            setBio(e.target.value)
            markDirty()
          }}
          className={cn(
            "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            editorControlClass("bio")
          )}
          rows={3}
        />
        <p className="mt-1 text-end text-xs text-muted-foreground">
          {bio.length}/60
        </p>
      </div>
      <div {...editorFieldEvents("location")}>
        <label htmlFor="profile-location" className="block text-sm font-medium">
          {copy.location}
        </label>
        <input
          id="profile-location"
          data-profile-editor-input="location"
          type="text"
          value={location_}
          onChange={(e) => {
            setLocation(e.target.value)
            markDirty()
          }}
          className={cn(
            "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            editorControlClass("location")
          )}
        />
      </div>
      <div {...editorFieldEvents("experience")}>
        <label
          htmlFor="profile-experience"
          className="block text-sm font-medium"
        >
          {copy.experience}
        </label>
        <input
          id="profile-experience"
          data-profile-editor-input="experience"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={experience}
          onChange={(e) => {
            setExperience(e.target.value)
            markDirty()
          }}
          className={cn(
            "w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            editorControlClass("experience")
          )}
        />
      </div>
      <div {...editorFieldEvents("avatar")}>
        <Label htmlFor="profile-avatar">{copy.image}</Label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Avatar size="lg" className="size-20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name || "Avatar"} />
            ) : (
              <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <FileDropzone
              onFileSelect={(file) => handleAvatarChange(file)}
              locale={locale}
              accept="image/jpeg,image/png,image/webp"
              inputId="profile-avatar"
              selectedFile={avatarFile}
              onClear={() => handleAvatarChange(null)}
              disabled={saving}
              description={copy.avatarHint}
              className={editorControlClass("avatar")}
            />
            {publicImageUrl && !avatarFile && avatarUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-1.5 min-w-24 bg-destructive px-4 py-4 text-white hover:bg-destructive/90"
                disabled={saving}
                onClick={() => {
                  for (const url of objectUrlsRef.current)
                    URL.revokeObjectURL(url)
                  objectUrlsRef.current = []
                  setAvatarFile(null)
                  setAvatarUrl(null)
                  setAvatarRemoved(true)
                  markDirty()
                }}
              >
                {copy.remove}
              </Button>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={!dirty || saving || !name.trim()}
        onClick={handleSave}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? copy.saving : copy.save}
      </button>
    </div>
  )

  return (
    <PreviewWorkspace
      editor={editor}
      preview={
        <StudentTeacherProfilePreview
          model={previewModel}
          locale={locale}
          interactionMode="local-only"
        />
      }
      locale={locale}
      deviceWidth={deviceWidth}
      onDeviceWidthChange={setDeviceWidth}
      activeTab={activeTab}
      onActiveTabChange={onActiveTabChange}
      onFullPreviewOpenChange={onFullPreviewOpenChange}
    />
  )
}
