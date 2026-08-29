import type { TeacherProfile } from "@/features/profile/schema";
import type { CourseOut } from "@/features/shell/schema";
import type {
  StudentTeacherPreviewModel,
  StudentTeacherPreviewCourse,
} from "./types";

export function buildTeacherPreviewModel({
  profile,
  courses,
  avatarObjectUrl,
  publicAvatarUrl,
  locale = "ar",
}: {
  profile: TeacherProfile;
  courses: CourseOut[];
  avatarObjectUrl: string | null;
  publicAvatarUrl: string | null;
  locale?: string;
}): StudentTeacherPreviewModel {
  const isArabic = locale.toLowerCase().startsWith("ar");
  const firstSubjectName = profile.subjects[0]?.name ?? null;
  const titleAndSubject = firstSubjectName ?? (isArabic ? "مدرس" : "Teacher");

  return {
    id: profile.id,
    name: profile.name || (isArabic ? "اسم المدرس" : "Teacher name"),
    title: titleAndSubject,
    subject: titleAndSubject,
    subjects: profile.subjects.map((s) => s.name),
    grades: profile.grades.map((g) => g.name),
    avatarUrl: avatarObjectUrl ?? publicAvatarUrl ?? null,
    experienceYears: profile.experience ?? 0,
    bio: profile.description || (isArabic ? "نبذة عن المدرس" : "Teacher bio"),
    location: profile.location ?? null,
    courses: courses.map((course): StudentTeacherPreviewCourse => ({
      id: course.id,
      title: course.title || (isArabic ? "عنوان الكورس" : "Course title"),
      description:
        course.description || (isArabic ? "وصف الكورس" : "Course description"),
      price: course.price || "0",
      duration: "",
      sessionsCount: 0,
      coverUrl: course.img ?? null,
      isSubscribed: false,
      sections: [],
    })),
  };
}
