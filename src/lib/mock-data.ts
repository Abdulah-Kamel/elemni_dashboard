export const MOCK_CREDENTIALS = {
  email: "admin@admin",
  password: "admin@123",
};

export const MOCK_TOKENS = {
  access_token: "mock_access_token_elemni_demo",
  refresh_token: "mock_refresh_token_elemni_demo",
  token_type: "bearer",
};

export const MOCK_USER = {
  id: 1,
  email: "admin@admin",
  name: "Admin User",
  phone_number: "+966501234567",
  role: "TEACHER" as const,
  is_active: true,
  created_at: "2024-01-15T08:00:00Z",
};

export const MOCK_COURSES = [
  {
    id: 1,
    title: "Mastering Modern UX Design",
    description: "A comprehensive course covering UX research, wireframing, prototyping, and usability testing.",
    price: "199.99",
    is_published: true,
    use_chapters: true,
    subject_id: 1,
    subject_name: "Design",
    teacher_profile_id: 1,
    grade_id: 10,
    stream_id: 1,
    created_by_id: 1,
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: 2,
    title: "Advanced React 2024",
    description: "Deep dive into React Server Components, Suspense, and modern patterns.",
    price: "249.99",
    is_published: true,
    use_chapters: true,
    subject_id: 2,
    subject_name: "Programming",
    teacher_profile_id: 1,
    grade_id: 11,
    stream_id: 2,
    created_by_id: 1,
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: 3,
    title: "Financial Management for Beginners",
    description: "Learn budgeting, investing, and financial planning from scratch.",
    price: "149.99",
    is_published: true,
    use_chapters: false,
    subject_id: 3,
    subject_name: "Business",
    teacher_profile_id: 1,
    grade_id: 12,
    stream_id: 1,
    created_by_id: 1,
    created_at: "2024-03-05T10:00:00Z",
  },
  {
    id: 4,
    title: "Arabic Literature & Poetry",
    description: "Explore classical and modern Arabic literature, poetry analysis, and creative writing.",
    price: "99.99",
    is_published: false,
    use_chapters: true,
    subject_id: 4,
    subject_name: "Arabic",
    teacher_profile_id: 1,
    grade_id: 10,
    stream_id: 1,
    created_by_id: 1,
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: 5,
    title: "Data Science with Python",
    description: "From pandas to machine learning — a hands-on data science journey.",
    price: "299.99",
    is_published: true,
    use_chapters: true,
    subject_id: 5,
    subject_name: "Computer Science",
    teacher_profile_id: 1,
    grade_id: 11,
    stream_id: 2,
    created_by_id: 1,
    created_at: "2024-04-01T10:00:00Z",
  },
  {
    id: 6,
    title: "English Communication Skills",
    description: "Improve your speaking, writing, and presentation skills in English.",
    price: "79.99",
    is_published: true,
    use_chapters: false,
    subject_id: 6,
    subject_name: "English",
    teacher_profile_id: 1,
    grade_id: 9,
    stream_id: 1,
    created_by_id: 1,
    created_at: "2024-04-20T10:00:00Z",
  },
];

export const MOCK_CHAPTERS: Record<number, { id: number; course_id: number; title: string; order: number }[]> = {
  1: [
    { id: 1, course_id: 1, title: "Introduction to UX", order: 1 },
    { id: 2, course_id: 1, title: "User Research Methods", order: 2 },
    { id: 3, course_id: 1, title: "Wireframing & Prototyping", order: 3 },
    { id: 4, course_id: 1, title: "Usability Testing", order: 4 },
  ],
  2: [
    { id: 5, course_id: 2, title: "React Fundamentals Review", order: 1 },
    { id: 6, course_id: 2, title: "Server Components Deep Dive", order: 2 },
    { id: 7, course_id: 2, title: "Suspense & Streaming", order: 3 },
  ],
  4: [
    { id: 8, course_id: 4, title: "الأنواع الأدبية", order: 1 },
    { id: 9, course_id: 4, title: "الشعر الجاهلي", order: 2 },
    { id: 10, course_id: 4, title: "النثر العربي", order: 3 },
  ],
  5: [
    { id: 11, course_id: 5, title: "Python for Data Analysis", order: 1 },
    { id: 12, course_id: 5, title: "Data Visualization", order: 2 },
    { id: 13, course_id: 5, title: "Machine Learning Basics", order: 3 },
  ],
};

export const MOCK_LESSONS: Record<number, { id: number; course_id: number; chapter_id: number | null; title: string; description: string | null; order: number }[]> = {
  1: [
    { id: 1, course_id: 1, chapter_id: 1, title: "What is UX Design?", description: "Understanding the fundamentals of user experience design.", order: 1 },
    { id: 2, course_id: 1, chapter_id: 1, title: "UX vs UI vs Product Design", description: null, order: 2 },
    { id: 3, course_id: 1, chapter_id: 1, title: "The Design Thinking Process", description: "Learn the 5 stages of design thinking.", order: 3 },
    { id: 4, course_id: 1, chapter_id: 2, title: "Qualitative Research", description: "Interviews, surveys, and field studies.", order: 1 },
    { id: 5, course_id: 1, chapter_id: 2, title: "Quantitative Research", description: "Analytics, A/B testing, and data analysis.", order: 2 },
    { id: 6, course_id: 1, chapter_id: 3, title: "Paper vs Digital Wireframes", description: null, order: 1 },
    { id: 7, course_id: 1, chapter_id: 3, title: "Building Interactive Prototypes", description: "Using Figma and prototyping tools.", order: 2 },
    { id: 8, course_id: 1, chapter_id: 4, title: "Planning a Usability Test", description: null, order: 1 },
    { id: 9, course_id: 1, chapter_id: 4, title: "Analyzing Test Results", description: "Identifying patterns and prioritizing fixes.", order: 2 },
  ],
  2: [
    { id: 10, course_id: 2, chapter_id: 5, title: "Components, Props & State", description: null, order: 1 },
    { id: 11, course_id: 2, chapter_id: 5, title: "Hooks in Depth", description: "useState, useEffect, useRef, useMemo.", order: 2 },
    { id: 12, course_id: 2, chapter_id: 6, title: "What are Server Components?", description: null, order: 1 },
    { id: 13, course_id: 2, chapter_id: 6, title: "Data Fetching Patterns", description: "Streaming, parallel fetching, and caching.", order: 2 },
    { id: 14, course_id: 2, chapter_id: 7, title: "Suspense Boundaries", description: null, order: 1 },
    { id: 15, course_id: 2, chapter_id: 7, title: "Streaming SSR", description: "Progressive rendering strategies.", order: 2 },
  ],
  3: [
    { id: 16, course_id: 3, chapter_id: null, title: "Setting Financial Goals", description: null, order: 1 },
    { id: 17, course_id: 3, chapter_id: null, title: "Budgeting 101", description: "Creating and maintaining a personal budget.", order: 2 },
    { id: 18, course_id: 3, chapter_id: null, title: "Introduction to Investing", description: null, order: 3 },
    { id: 19, course_id: 3, chapter_id: null, title: "Risk Management", description: "Understanding risk and diversification.", order: 4 },
  ],
  5: [
    { id: 20, course_id: 5, chapter_id: 11, title: "NumPy & Pandas Basics", description: null, order: 1 },
    { id: 21, course_id: 5, chapter_id: 11, title: "Data Cleaning Techniques", description: null, order: 2 },
    { id: 22, course_id: 5, chapter_id: 12, title: "Matplotlib & Seaborn", description: null, order: 1 },
    { id: 23, course_id: 5, chapter_id: 12, title: "Interactive Dashboards", description: null, order: 2 },
    { id: 24, course_id: 5, chapter_id: 13, title: "Supervised Learning", description: null, order: 1 },
    { id: 25, course_id: 5, chapter_id: 13, title: "Unsupervised Learning", description: null, order: 2 },
  ],
  6: [
    { id: 26, course_id: 6, chapter_id: null, title: "Everyday Conversations", description: null, order: 1 },
    { id: 27, course_id: 6, chapter_id: null, title: "Business English", description: null, order: 2 },
    { id: 28, course_id: 6, chapter_id: null, title: "Presentation Skills", description: null, order: 3 },
  ],
};

export const MOCK_LESSON_ITEMS: Record<number, { id: number; lesson_id: number; title: string; bunny_stream_id: string | null; document_path: string | null; exam_id: number | null; order: number }[]> = {
  1: [
    { id: 1, lesson_id: 1, title: "Introduction Video", bunny_stream_id: "abc123", document_path: null, exam_id: null, order: 1 },
    { id: 2, lesson_id: 1, title: "UX Design Slides", bunny_stream_id: null, document_path: "/slides/ux-intro.pdf", exam_id: null, order: 2 },
  ],
  3: [
    { id: 3, lesson_id: 3, title: "Design Thinking Video", bunny_stream_id: "def456", document_path: null, exam_id: null, order: 1 },
    { id: 4, lesson_id: 3, title: "Design Thinking Quiz", bunny_stream_id: null, document_path: null, exam_id: 1, order: 2 },
  ],
  10: [
    { id: 5, lesson_id: 10, title: "React Components Video", bunny_stream_id: "ghi789", document_path: null, exam_id: null, order: 1 },
  ],
};

export const MOCK_SUBJECTS = [
  { id: 1, name: "Design", slug: "design" },
  { id: 2, name: "Programming", slug: "programming" },
  { id: 3, name: "Business", slug: "business" },
  { id: 4, name: "Arabic", slug: "arabic" },
  { id: 5, name: "Computer Science", slug: "computer-science" },
  { id: 6, name: "English", slug: "english" },
  { id: 7, name: "Mathematics", slug: "mathematics" },
  { id: 8, name: "Science", slug: "science" },
];

export const MOCK_GRADES = [
  { id: 1, name: "Grade 1", level: "elementary" },
  { id: 2, name: "Grade 2", level: "elementary" },
  { id: 3, name: "Grade 3", level: "elementary" },
  { id: 4, name: "Grade 4", level: "elementary" },
  { id: 5, name: "Grade 5", level: "elementary" },
  { id: 6, name: "Grade 6", level: "elementary" },
  { id: 7, name: "Grade 7", level: "middle" },
  { id: 8, name: "Grade 8", level: "middle" },
  { id: 9, name: "Grade 9", level: "middle" },
  { id: 10, name: "Grade 10", level: "high" },
  { id: 11, name: "Grade 11", level: "high" },
  { id: 12, name: "Grade 12", level: "high" },
];

export const MOCK_STREAMS = [
  { id: 1, name: "Scientific", slug: "scientific" },
  { id: 2, name: "Literary", slug: "literary" },
  { id: 3, name: "Arts", slug: "arts" },
  { id: 4, name: "Vocational", slug: "vocational" },
];
