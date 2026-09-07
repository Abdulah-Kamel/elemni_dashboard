export const endpoints = {
  auth: {
    me: "/api/v1/auth/me",
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
    forgotPassword: "/api/v1/auth/forgot-password",
    resetPassword: "/api/v1/auth/reset-password",
  },
  teachers: {
    me: "/api/v1/teachers/me",
    requestImageUpload: "/api/v1/teachers/me/request-image-upload",
    analytics: "/api/v1/teachers/me/analytics",
    analyticsTopCourses: "/api/v1/teachers/me/analytics/top-courses",
    usage: "/api/v1/teachers/me/usage",
    subscriptions: "/api/v1/teachers/me/subscriptions",
    publicDetail: (slug: string) =>
      `/api/v1/teachers/${encodeURIComponent(slug)}`,
  },
  courses: {
    list: "/api/v1/courses",
    detail: (id: number) => `/api/v1/courses/${id}`,
    requestImageUpload: (id: number) =>
      `/api/v1/courses/${id}/request-image-upload`,
    chapters: {
      list: (courseId: number) => `/api/v1/courses/${courseId}/chapters`,
      detail: (courseId: number, chapterId: number) =>
        `/api/v1/courses/${courseId}/chapters/${chapterId}`,
      reorder: (courseId: number) =>
        `/api/v1/courses/${courseId}/chapters/reorder`,
    },
    lessons: {
      list: (courseId: number) => `/api/v1/courses/${courseId}/lessons`,
      detail: (courseId: number, lessonId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}`,
      reorder: (courseId: number) =>
        `/api/v1/courses/${courseId}/lessons/reorder`,
    },
    items: {
      list: (courseId: number, lessonId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items`,
      detail: (courseId: number, itemId: number) =>
        `/api/v1/courses/${courseId}/items/${itemId}`,
      reorder: (courseId: number, lessonId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/reorder`,
      requestVideoUpload: (
        courseId: number,
        lessonId: number,
        itemId: number
      ) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/request-video-upload`,
      confirmVideoUpload: (
        courseId: number,
        lessonId: number,
        itemId: number
      ) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/confirm-video-upload`,
      requestUploadUrl: (courseId: number, lessonId: number, itemId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/request-upload-url`,
      confirmUpload: (courseId: number, lessonId: number, itemId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/confirm-upload`,
      deleteVideo: (courseId: number, lessonId: number, itemId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/video`,
      deleteDocument: (courseId: number, lessonId: number, itemId: number) =>
        `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/document`,
    },
  },
  public: {
    subjects: "/api/v1/subjects",
    grades: "/api/v1/grades",
    streams: "/api/v1/streams",
  },
} as const
