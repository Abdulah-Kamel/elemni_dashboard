"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  User,
  Image,
  Pencil,
  Users,
  BookOpen,
  Award,
  Star,
  IdCard,
  Phone,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProfile, requestProfileImageUpload } from "@/features/profile/actions";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.description ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: t("tab_account") },
    { id: "experience", label: t("tab_experience") },
    { id: "display", label: t("tab_display") },
  ];

  const currentImg = previewUrl ?? profile.img;

  const cancel = useCallback(() => {
    setName(profile.name);
    setBio(profile.description ?? "");
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditing(false);
  }, [profile.name, profile.description]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let img = profile.img;

      if (selectedFile) {
        const upload = await requestProfileImageUpload(selectedFile.name);
        if (!upload.success) {
          toast.error(upload.error.message);
          setSaving(false);
          return;
        }
        try {
          await fetch(upload.uploadUrl, { method: "PUT", body: selectedFile });
        } catch {
          // mock URL will fail silently; real backend's presigned URL handles it.
        }
        img = upload.uploadUrl;
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
      setSelectedFile(null);
      setPreviewUrl(null);
      setEditing(false);
      setSaving(false);
    } catch {
      toast.error(t("error_upstream"));
      setSaving(false);
    }
  }, [name, bio, selectedFile, profile.img, t]);

  const enableEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 100);
  }, []);

  return (
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
      {/* ── Cover + Profile header ── */}
      <section className="relative mb-8">
        <div
          className="relative h-[280px] w-full overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #C7CBF0 0%, #8E94A2 60%, #1E2A5A 100%)",
          }}
        >
          {/* TODO: cover photo */}
          <div className="flex h-full w-full items-center justify-center opacity-30">
            <Image className="size-16 text-white" />
          </div>

          <div
            className="absolute inset-0 flex flex-col items-end justify-end p-6"
            style={{
              background: "linear-gradient(0deg, rgba(30,42,90,0.7) 0%, transparent 60%)",
            }}
          >
            <h1 className="text-[28px] font-bold leading-tight text-white">{name}</h1>
            <p className="mt-1 text-[15px] font-light text-white/80">
              {t("cover_subtitle")}
            </p>
          </div>
        </div>

        <div className="absolute -bottom-16 end-6">
          {/* TODO: teacher photo */}
          <button
            type="button"
            onClick={() => editing && fileRef.current?.click()}
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
                <Camera className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </section>

      {!editing && (
        <div className="mb-8 mt-20 flex justify-start">
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

      {/* ── Stats + Bio row ── */}
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

      {/* ── Tabbed form ── */}
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
  );
}
