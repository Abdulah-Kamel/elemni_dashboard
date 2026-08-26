export type StudentPreviewItem = {
  id: string | number;
  title: string;
  hasVideo: boolean;
  hasDocument: boolean;
  hasExam: boolean;
};

export type StudentPreviewLesson = {
  id: string | number;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  items: StudentPreviewItem[];
};

export type StudentPreviewSection = {
  id: string | number;
  title: string | null;
  lessons: StudentPreviewLesson[];
};

export type StudentTeacherPreviewCourse = {
  id: string | number;
  title: string;
  description: string;
  price: string;
  duration: string;
  sessionsCount: number;
  coverUrl: string | null;
  isSubscribed: boolean;
  sections: StudentPreviewSection[];
};

export type StudentTeacherPreviewModel = {
  id: string | number;
  name: string;
  title: string;
  subject: string;
  subjects: string[];
  grades: string[];
  avatarUrl: string | null;
  experienceYears: number;
  bio: string;
  location: string | null;
  courses: StudentTeacherPreviewCourse[];
};

export type StudentCoursePreviewModel = {
  id: string | number;
  title: string;
  description: string;
  coverUrl: string | null;
  price: string;
  subject: string | null;
  grade: string | null;
  stream: string | null;
  teacher: { name: string; avatarUrl: string | null } | null;
  sections: StudentPreviewSection[];
};

export type PreviewInteractionMode = 'local-only';

export type PreviewLayoutMode = "split" | "editor-focus" | "preview-focus";

export type PreviewDeviceWidth = "full" | "tablet" | "mobile";
