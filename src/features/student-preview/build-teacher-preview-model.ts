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
}: {
  profile: TeacherProfile;
  courses: CourseOut[];
  avatarObjectUrl: string | null;
  publicAvatarUrl: string | null;
}): StudentTeacherPreviewModel {
  const firstSubjectName = profile.subjects[0]?.name ?? null;
  const titleAndSubject = firstSubjectName ?? "مدرس";

  return {
    id: profile.id,
    name: profile.name || "اسم المدرس",
    title: titleAndSubject,
    subject: titleAndSubject,
    subjects: profile.subjects.map((s) => s.name),
    grades: profile.grades.map((g) => g.name),
    avatarUrl: avatarObjectUrl ?? publicAvatarUrl ?? null,
    experienceYears: profile.experience ?? 0,
    bio: profile.description || "نبذة عن المدرس",
    location: profile.location ?? null,
    courses: courses.map((course): StudentTeacherPreviewCourse => ({
      id: course.id,
      title: course.title || "عنوان الكورس",
      description: course.description || "وصف الكورس",
      price: course.price || "0",
      duration: "",
      sessionsCount: 0,
      coverUrl: course.img ?? null,
      isSubscribed: false,
      sections: [],
    })),
  };
}
