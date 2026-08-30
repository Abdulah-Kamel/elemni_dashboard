export const courseManagementKeys = {
  all: ["course-management"] as const,
  coursesRoot: ["course-management", "courses"] as const,
  courses: (teacherProfileId: number) =>
    [...courseManagementKeys.coursesRoot, teacherProfileId] as const,
  course: (courseId: number) =>
    [...courseManagementKeys.all, "course", courseId] as const,
  courseDetail: (courseId: number) => courseManagementKeys.course(courseId),
  chapters: (courseId: number) =>
    [...courseManagementKeys.course(courseId), "chapters"] as const,
  lessonsRoot: (courseId: number) =>
    [...courseManagementKeys.course(courseId), "lessons"] as const,
  lessons: (courseId: number, chapterId?: number) =>
    [
      ...courseManagementKeys.lessonsRoot(courseId),
      chapterId ?? "all",
    ] as const,
  itemsRoot: (courseId: number) =>
    [...courseManagementKeys.course(courseId), "items"] as const,
  items: (courseId: number, lessonId: number) =>
    [...courseManagementKeys.itemsRoot(courseId), lessonId] as const,
} as const
