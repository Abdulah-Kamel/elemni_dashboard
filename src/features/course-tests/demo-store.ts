import type { CourseTest, GradingQueueItem, TestQuestion, TestStats } from "./types";

const KEY = "elemni-teacher-course-tests-demo-v1";
export const DEMO_TESTS_CHANGED = "elemni:course-tests-demo-changed";
type DemoState = { tests: CourseTest[]; queue: GradingQueueItem[]; nextId: number; nextQuestionId: number; graded: number[] };

const sampleQuestions: TestQuestion[] = [
  { id: 7101, position: 0, type: "single", text: "ما ناتج print(2 + 3)؟", code_snippet: "print(2 + 3)", image_url: null, points: 2, options: [{ id: "a", text: "5" }, { id: "b", text: "23" }], answer_key: { option_id: "a" }, explanation: "يُحسب الجمع أولاً.", shuffle_options: false, topic_ref: null },
  { id: 7102, position: 1, type: "multi", text: "اختر أنواع البيانات الأساسية.", code_snippet: null, image_url: null, points: 2, options: [{ id: "a", text: "str" }, { id: "b", text: "int" }, { id: "c", text: "window" }], answer_key: { option_ids: ["a", "b"] }, explanation: "str وint من الأنواع الأساسية.", shuffle_options: false, topic_ref: null },
  { id: 7103, position: 2, type: "essay", text: "اشرح الفرق بين list وtuple.", code_snippet: null, image_url: null, points: 4, options: [], answer_key: { model_answer: "list قابلة للتغيير وtuple ثابتة.", rubric: [{ criterion: "قابلية التغيير", points: 2 }, { criterion: "ذكر tuple", points: 2 }] }, explanation: null, shuffle_options: false, topic_ref: null },
];

const defaultState = (): DemoState => ({
  tests: [
    { id: 701, course_id: 12, lesson_id: 31, position: 0, placement: "standalone_item", parent_item_id: null, title: "اختبار الدرس الأول", description: "اختبار تجريبي لأساسيات Python.", status: "published", time_limit_minutes: 15, max_attempts: 3, grading_policy: "highest", cooldown_minutes: 0, pass_percent: 70, complete_item_on_pass_only: true, notify_teacher_on_attempts_exhausted: true, prerequisite: "none", prerequisite_ids: [], opens_at: null, closes_at: null, shuffle_questions: false, allow_back_navigation: true, random_pool_size: null, show_correct_answers: "after_submit", show_score_immediately: true, question_count: sampleQuestions.length, total_points: 8, questions: sampleQuestions.map((question) => ({ ...question })) },
    { id: 702, course_id: 12, lesson_id: 31, position: 1, placement: "standalone_item", parent_item_id: null, title: "الاختبار النهائي", description: "لاختبار شامل بعد إنهاء الدروس.", status: "published", time_limit_minutes: 30, max_attempts: 2, grading_policy: "highest", cooldown_minutes: 60, pass_percent: 70, complete_item_on_pass_only: true, notify_teacher_on_attempts_exhausted: false, prerequisite: "pass_tests", prerequisite_ids: [701], opens_at: null, closes_at: null, shuffle_questions: true, allow_back_navigation: true, random_pool_size: null, show_correct_answers: "after_pass_or_exhausted", show_score_immediately: true, question_count: 0, total_points: 0, questions: [] },
  ],
  queue: [{ answer_id: 9101, attempt_id: 9001, attempt_number: 1, status: "pending_grading", submitted_at: new Date(Date.now() - 86400000).toISOString(), student: { id: 301, name: "سارة أحمد", initials: "سأ" }, test: { id: 701, title: "اختبار الدرس الأول" }, question: sampleQuestions[2], response: "القائمة يمكن تغييرها، أما tuple لا يمكن تغييرها.", feedback: null, points_awarded: null, score_auto: 4, max_score: 8 }, { answer_id: 9102, attempt_id: 9002, attempt_number: 2, status: "pending_grading", submitted_at: new Date(Date.now() - 172800000).toISOString(), student: { id: 302, name: "عمر خالد", initials: "عخ" }, test: { id: 701, title: "اختبار الدرس الأول" }, question: sampleQuestions[2], response: "list متغيرة وtuple ثابتة.", feedback: null, points_awarded: null, score_auto: 3, max_score: 8 }],
  nextId: 800, nextQuestionId: 7200, graded: [],
});

function read(): DemoState {
  if (typeof window === "undefined") return defaultState();
  try {
    const value = window.localStorage.getItem(KEY);
    if (!value) return defaultState();
    const state = JSON.parse(value) as DemoState;
    return Array.isArray(state.tests) && Array.isArray(state.queue) ? state : defaultState();
  } catch { return defaultState(); }
}
function write(state: DemoState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_TESTS_CHANGED));
  }
}
function mutate<T>(operation: (state: DemoState) => T): T { const state = read(); const result = operation(state); write(state); return result; }
function totals(test: CourseTest): CourseTest { return { ...test, question_count: test.questions.length, total_points: test.questions.reduce((sum, question) => sum + question.points, 0) }; }

export function clearCourseTestDemo() { if (typeof window !== "undefined") window.localStorage.removeItem(KEY); }
export function subscribeDemoCourseTests(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DEMO_TESTS_CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(DEMO_TESTS_CHANGED, onChange); window.removeEventListener("storage", onChange); };
}
export function getCourseTestSnapshot(testId: number) {
  try {
    const state = read();
    const test = state.tests.find((item) => item.id === testId);
    if (!test) return "null";
    return JSON.stringify(totals(test));
  } catch { return "null"; }
}
export function listCourseTests(courseId: number) {
  const state = read();
  if (courseId !== 12 && !state.tests.some((test) => test.course_id === courseId) && state.tests.every((test) => test.course_id === 12)) {
    state.tests = state.tests.map((test) => ({ ...test, course_id: courseId }));
    write(state);
  }
  return state.tests.filter((test) => test.course_id === courseId).map(totals);
}
export function getCourseTest(testId: number) { const test = read().tests.find((item) => item.id === testId); if (!test) throw new Error("الاختبار غير موجود في بيانات العرض."); return totals(test); }
export function getCourseTestStats(courseId: number): TestStats {
  const state = read(); const tests = state.tests.filter((test) => test.course_id === courseId);
  return { published_tests: tests.filter((test) => test.status === "published").length, draft_tests: tests.filter((test) => test.status === "draft").length, pending_grading: state.queue.length, average_score: 76, pass_rate: 82 };
}
export function createCourseTest(courseId: number, title = "اختبار جديد") {
  return mutate((state) => { const id = state.nextId++; const test: CourseTest = { id, course_id: courseId, lesson_id: null, position: state.tests.filter((row) => row.course_id === courseId).length, placement: "standalone_item", parent_item_id: null, title, description: "", status: "draft", time_limit_minutes: 15, max_attempts: 3, grading_policy: "highest", cooldown_minutes: 0, pass_percent: 60, complete_item_on_pass_only: true, notify_teacher_on_attempts_exhausted: false, prerequisite: "none", prerequisite_ids: [], opens_at: null, closes_at: null, shuffle_questions: false, allow_back_navigation: true, random_pool_size: null, show_correct_answers: "after_submit", show_score_immediately: true, question_count: 0, total_points: 0, questions: [] }; state.tests.push(test); return { id, title, status: test.status }; });
}
export function updateCourseTest(testId: number, patch: Partial<CourseTest>) {
  return mutate((state) => { const test = state.tests.find((item) => item.id === testId); if (!test) throw new Error("الاختبار غير موجود."); Object.assign(test, patch); return { id: test.id, title: test.title, status: test.status }; });
}
export function addTestQuestion(testId: number, question: Omit<TestQuestion, "id"> & { save_to_bank?: boolean }) {
  return mutate((state) => { const test = state.tests.find((item) => item.id === testId); if (!test) throw new Error("الاختبار غير موجود."); const saved = { ...question, id: state.nextQuestionId++ }; test.questions.push(saved); return saved; });
}
export function updateTestQuestion(questionId: number, patch: Omit<TestQuestion, "id"> & { save_to_bank?: boolean }) {
  return mutate((state) => { for (const test of state.tests) { const question = test.questions.find((item) => item.id === questionId); if (question) { Object.assign(question, patch); return question; } } throw new Error("السؤال غير موجود."); });
}
export function deleteTestQuestion(questionId: number) { mutate((state) => { for (const test of state.tests) test.questions = test.questions.filter((question) => question.id !== questionId); }); }
export function reorderTestQuestions(testId: number, ids: number[]) {
  return mutate((state) => { const test = state.tests.find((item) => item.id === testId); if (!test) throw new Error("الاختبار غير موجود."); test.questions = ids.map((id) => test.questions.find((question) => question.id === id)).filter((question): question is TestQuestion => Boolean(question)).map((question, position) => ({ ...question, position })); return { question_ids: ids }; });
}
export function publishCourseTest(testId: number) { return updateCourseTest(testId, { status: "published" }); }
export function getGradingQueue(testId?: number, status = "pending") { return read().queue.filter((item) => (!testId || item.test.id === testId) && (status === "all" || item.status === status || (status === "pending" && item.status === "pending_grading"))); }
export function getPendingGradingCount() { return { count: read().queue.length }; }
export function gradeEssay(answerId: number, points: number, feedback: string) {
  return mutate((state) => { const index = state.queue.findIndex((item) => item.answer_id === answerId); if (index < 0) throw new Error("الإجابة غير موجودة في قائمة التصحيح."); const [item] = state.queue.splice(index, 1); state.graded.push(answerId); const score = item.score_auto + points; const percent = Math.round(score / item.max_score * 100); return { attempt_id: item.attempt_id, status: state.queue.some((row) => row.attempt_id === item.attempt_id) ? "pending_grading" : "graded", score_total: score, max_score: item.max_score, percent, passed: percent >= 60, feedback }; });
}
