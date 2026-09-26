/**
 * Where each overview number drills into. Kept in one place so destination
 * filters can be changed with a one-line edit.
 *
 * `/students` reads `status`, `course` and `access` (see
 * features/students/roster-model `parseStudentQuery`); `/courses?status=`
 * matches the course list's status tabs (published | draft | archived).
 */
export const overviewLinks = {
  students: "/students",
  completedSubscriptions: "/students?status=completed",
  pendingSubscriptions: "/students?status=pending",
  expiringSubscriptions: "/students?access=expiring",
  courseStudents: (courseId: number) => `/students?course=${courseId}`,
  courses: "/courses",
  newCourse: "/courses/new",
  publishedCourses: "/courses?status=published",
  draftCourses: "/courses?status=draft",
  courseEditor: (courseId: number) => `/courses/${courseId}`,
} as const
