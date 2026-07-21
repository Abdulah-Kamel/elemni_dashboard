import { http, HttpResponse } from "msw";
import type { CourseOut } from "@/features/shell/schema";

const API_BASE = "http://localhost:3000";

export const mockCourses: CourseOut[] = [
  {
    id: 1,
    title: "الجبر - الصف الأول الثانوي",
    description: "مقدمة في الجبر",
    price: "150.00",
    is_published: true,
    use_chapters: true,
    subject_id: 1,
    subject_name: "الرياضيات",
    teacher_profile_id: 7,
    grade_id: 3,
    stream_id: 1,
    created_by_id: 7,
    created_at: "2026-06-15T08:00:00Z",
  },
  {
    id: 2,
    title: "الهندسة - الصف الثاني الثانوي",
    description: "أساسيات الهندسة",
    price: "0.00",
    is_published: false,
    use_chapters: false,
    subject_id: 1,
    subject_name: "الرياضيات",
    teacher_profile_id: 7,
    grade_id: 4,
    stream_id: 1,
    created_by_id: 7,
    created_at: "2026-07-01T10:00:00Z",
  },
];

export const mockSubjects = [
  { id: 1, name: "الرياضيات", slug: "math" },
  { id: 2, name: "الفيزياء", slug: "physics" },
  { id: 3, name: "الكيمياء", slug: "chemistry" },
];

export const mockGrades = [
  { id: 3, name: "الصف الأول الثانوي", level: "secondary" },
  { id: 4, name: "الصف الثاني الثانوي", level: "secondary" },
  { id: 5, name: "الصف الثالث الثانوي", level: "secondary" },
];

export const mockChapters = [
  { id: 1, course_id: 7, title: "مقدمة في الجبر", order: 1 },
  { id: 2, course_id: 7, title: "المعادلات الخطية", order: 2 },
  { id: 3, course_id: 7, title: "المصفوفات", order: 3 },
];

export const mockItems = [
  { id: 1, lesson_id: 1, title: "فيديو شرح المتغيرات", bunny_stream_id: "stream-abc", document_path: null, exam_id: null, order: 1 },
  { id: 2, lesson_id: 1, title: "ملف PDF تمارين المتغيرات", bunny_stream_id: null, document_path: "/docs/exercises.pdf", exam_id: null, order: 2 },
  { id: 3, lesson_id: 1, title: "اختبار المتغيرات", bunny_stream_id: null, document_path: null, exam_id: 1, order: 3 },
  { id: 4, lesson_id: 2, title: "شرح المعادلات", bunny_stream_id: null, document_path: null, exam_id: null, order: 1 },
];

export const mockLessons = [
  { id: 1, course_id: 7, chapter_id: 1, title: "المتغيرات", description: null, order: 1 },
  { id: 2, course_id: 7, chapter_id: 1, title: "الثوابت", description: null, order: 2 },
  { id: 3, course_id: 7, chapter_id: 2, title: "المعادلة من الدرجة الأولى", description: null, order: 1 },
];

export const mockStreams = [
  { id: 1, name: "شعبة علوم تجريبية", slug: "experimental-sciences" },
  { id: 2, name: "شعبة رياضيات", slug: "mathematics" },
  { id: 3, name: "شعبة تكنولوجيا", slug: "technology" },
];

export const handlers = [
  // GET /api/v1/courses
  http.get(`${API_BASE}/api/v1/courses`, () => {
    return HttpResponse.json({
      items: mockCourses,
      total: mockCourses.length,
      skip: 0,
      limit: 20,
    });
  }),

  // GET /api/v1/courses/:id
  http.get(`${API_BASE}/api/v1/courses/:id`, ({ params }) => {
    const id = Number(params.id);
    const course = mockCourses.find((c) => c.id === id);
    if (!course) {
      return HttpResponse.json(
        { detail: "Course not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(course);
  }),

  // POST /api/v1/courses
  http.post(`${API_BASE}/api/v1/courses`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newCourse: CourseOut = {
      id: 3,
      title: (body.title as string) ?? "New Course",
      description: (body.description as string) ?? null,
      price: String(body.price ?? "0.00"),
      is_published: false,
      use_chapters: Boolean(body.use_chapters),
      subject_id: body.subject_id as number,
      subject_name: "الرياضيات",
      teacher_profile_id: 7,
      grade_id: body.grade_id as number,
      stream_id: body.stream_id as number,
      created_by_id: 7,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(newCourse, { status: 201 });
  }),

  // PATCH /api/v1/courses/:id
  http.patch(`${API_BASE}/api/v1/courses/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Record<string, unknown>;
    const course = mockCourses.find((c) => c.id === id);
    if (!course) {
      return HttpResponse.json(
        { detail: "Course not found" },
        { status: 404 }
      );
    }
    const updated = { ...course, ...body };
    return HttpResponse.json(updated);
  }),

  // GET /api/v1/subjects
  http.get(`${API_BASE}/api/v1/subjects`, () => {
    return HttpResponse.json(mockSubjects);
  }),

  // GET /api/v1/grades
  http.get(`${API_BASE}/api/v1/grades`, () => {
    return HttpResponse.json(mockGrades);
  }),

  // GET /api/v1/streams
  http.get(`${API_BASE}/api/v1/streams`, () => {
    return HttpResponse.json(mockStreams);
  }),

  // GET /api/v1/courses/:courseId/chapters
  http.get(`${API_BASE}/api/v1/courses/:courseId/chapters`, () => {
    return HttpResponse.json(mockChapters);
  }),

  // GET /api/v1/courses/:courseId/lessons
  http.get(`${API_BASE}/api/v1/courses/:courseId/lessons`, ({ request }) => {
    const url = new URL(request.url);
    const chapterId = url.searchParams.get("chapter_id");
    if (chapterId) {
      return HttpResponse.json(mockLessons.filter((l) => l.chapter_id === Number(chapterId)));
    }
    return HttpResponse.json(mockLessons);
  }),

  // GET /api/v1/courses/:courseId/lessons/:lessonId/items
  http.get(`${API_BASE}/api/v1/courses/:courseId/lessons/:lessonId/items`, ({ params }) => {
    const lessonId = Number(params.lessonId);
    return HttpResponse.json(mockItems.filter((i) => i.lesson_id === lessonId));
  }),

  // POST /api/v1/courses/:courseId/lessons/:lessonId/items
  http.post(`${API_BASE}/api/v1/courses/:courseId/lessons/:lessonId/items`, async ({ params, request }) => {
    const lessonId = Number(params.lessonId);
    const body = (await request.json()) as { title: string };
    const newItem = {
      id: mockItems.length + 1,
      lesson_id: lessonId,
      title: body.title,
      bunny_stream_id: null,
      document_path: null,
      exam_id: null,
      order: mockItems.filter((i) => i.lesson_id === lessonId).length + 1,
    };
    return HttpResponse.json(newItem, { status: 201 });
  }),

  // PATCH /api/v1/courses/:courseId/items/:itemId
  http.patch(`${API_BASE}/api/v1/courses/:courseId/items/:itemId`, async ({ params, request }) => {
    const itemId = Number(params.itemId);
    const body = (await request.json()) as Record<string, unknown>;
    const item = mockItems.find((i) => i.id === itemId);
    if (!item) return HttpResponse.json({ detail: "Item not found" }, { status: 404 });
    return HttpResponse.json({ ...item, ...body });
  }),

  // DELETE /api/v1/courses/:courseId/items/:itemId
  http.delete(`${API_BASE}/api/v1/courses/:courseId/items/:itemId`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  // PUT /api/v1/courses/:courseId/lessons/:lessonId/items/reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/lessons/:lessonId/items/reorder`, async ({ params, request }) => {
    const lessonId = Number(params.lessonId);
    const body = (await request.json()) as { items: Array<{ id: number; order: number }> };
    const lessonItems = mockItems.filter((i) => i.lesson_id === lessonId);
    const reordered = body.items
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const existing = lessonItems.find((i) => i.id === item.id);
        return existing ? { ...existing, order: item.order } : { id: item.id, lesson_id: lessonId, title: "Item", bunny_stream_id: null, document_path: null, exam_id: null, order: item.order };
      });
    return HttpResponse.json(reordered);
  }),

  // PUT /api/v1/courses/:courseId/lessons/reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/lessons/reorder`, async ({ request }) => {
    const body = (await request.json()) as { items: Array<{ id: number; order: number }> };
    const reordered = body.items
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const ls = mockLessons.find((l) => l.id === item.id);
        return ls ? { ...ls, order: item.order } : { id: item.id, course_id: 7, chapter_id: null, title: "Lesson", description: null, order: item.order };
      });
    return HttpResponse.json(reordered);
  }),

  // PUT /api/v1/courses/:courseId/chapters/reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/chapters/reorder`, async ({ request }) => {
    const body = (await request.json()) as { items: Array<{ id: number; order: number }> };
    const reordered = body.items
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const ch = mockChapters.find((c) => c.id === item.id);
        return ch ? { ...ch, order: item.order } : { id: item.id, course_id: 7, title: "Chapter", order: item.order };
      });
    return HttpResponse.json(reordered);
  }),
];

export const errorHandlers = [
  // 403 Forbidden for courses
  http.get(`${API_BASE}/api/v1/courses`, () => {
    return HttpResponse.json(
      { detail: "You don't have access to this resource" },
      { status: 403 }
    );
  }),

  // 422 Validation Error for course creation
  http.post(`${API_BASE}/api/v1/courses`, () => {
    return HttpResponse.json(
      {
        detail: [
          {
            loc: ["body", "title"],
            msg: "field required",
            type: "value_error.missing",
          },
        ],
      },
      { status: 422 }
    );
  }),

  // 409 Conflict for course update
  http.patch(`${API_BASE}/api/v1/courses/:id`, () => {
    return HttpResponse.json(
      { detail: "This course was modified by another user. Please refresh and retry." },
      { status: 409 }
    );
  }),

  // 409 Conflict for lessons reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/lessons/reorder`, () => {
    return HttpResponse.json(
      { detail: "Course was modified. Please refresh and try again." },
      { status: 409 }
    );
  }),

  // 409 Conflict for chapters reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/chapters/reorder`, () => {
    return HttpResponse.json(
      { detail: "Course was modified. Please refresh and try again." },
      { status: 409 }
    );
  }),

  // 409 Conflict for items reorder
  http.put(`${API_BASE}/api/v1/courses/:courseId/lessons/:lessonId/items/reorder`, () => {
    return HttpResponse.json(
      { detail: "Course was modified. Please refresh and try again." },
      { status: 409 }
    );
  }),

  // 500 Server Error
  http.get(`${API_BASE}/api/v1/subjects`, () => {
    return HttpResponse.json(
      { detail: "Internal Server Error" },
      { status: 500 }
    );
  }),
];
