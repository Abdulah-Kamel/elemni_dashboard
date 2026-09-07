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
  /** Selected curriculum IDs are kept for the teacher workspace editor. */
  subjectId?: number | null;
  grade: string | null;
  gradeId?: number | null;
  stream: string | null;
  streamId?: number | null;
  teacher: { name: string; avatarUrl: string | null } | null;
  sections: StudentPreviewSection[];
};

export type PreviewInteractionMode = 'local-only';

export type CourseBuilderNode = {
  type: "chapter" | "lesson" | "item";
  id: string | number;
  /** Ancestors let the editor open collapsed containers before focusing a node. */
  chapterId?: string | number;
  lessonId?: string | number;
};

/**
 * Desktop space presets. `split` is the default (preview 60% / editor 40%),
 * `even` is the optional 50/50.
 */
export type PreviewLayoutMode = "split" | "even" | "editor-focus" | "preview-focus";

export type PreviewDeviceWidth = "full" | "tablet" | "mobile";

export type PreviewActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };
