// DEVELOPMENT ONLY. A localStorage implementation of CourseTestsClient that
// mirrors the rules the backend is expected to enforce, so the teacher UI can be
// exercised end-to-end before the API exists. Loaded only when
// NEXT_PUBLIC_COURSE_TESTS_DEMO=1 (see ./client.ts). Never the source of truth.

import { COURSE_TESTS_CHANGED, type CourseTestsClient } from "./client"
import { EXCEL_MAX_BYTES } from "./schema"
import type {
  ActionResult,
  AnswerKey,
  BankQuestion,
  CourseItemOption,
  CourseTest,
  CourseTestRow,
  ExcelImportPreview,
  ExcelRowError,
  GradeResult,
  GradingQueueItem,
  Option,
  PublishIssue,
  QuestionInput,
  QuestionType,
  TestQuestion,
  TestSettings,
  TestStats,
} from "./types"

export const DEMO_STORAGE_KEY = "elemni-teacher-course-tests-demo-v2"
const LEGACY_KEYS = ["elemni-teacher-course-tests-demo-v1"]

type DemoTest = Omit<CourseTest, "question_count" | "total_points" | "attempt_count" | "submission_count" | "pending_grading_count" | "questions"> & {
  questions: TestQuestion[]
}

type DemoEssayAnswer = {
  answer_id: number
  question: TestQuestion
  response: string | null
  points_awarded: number | null
  feedback: string | null
  graded_at: string | null
}

type DemoAttempt = {
  id: number
  test_id: number
  number: number
  student: { id: number; name: string; initials: string }
  submitted_at: string
  /** Points from auto-graded questions (already final). */
  auto_score: number
  max_score: number
  essays: DemoEssayAnswer[]
}

type DemoState = {
  version: 2
  tests: DemoTest[]
  bank: BankQuestion[]
  attempts: DemoAttempt[]
  seeded_courses: number[]
  next_id: number
}

// ---------------------------------------------------------------------------
// Storage

let memoryState: DemoState | null = null

function emptyState(): DemoState {
  return { version: 2, tests: [], bank: [], attempts: [], seeded_courses: [], next_id: 1000 }
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

function read(): DemoState {
  const store = storage()
  if (!store) return (memoryState ??= seedBank(emptyState()))
  try {
    for (const key of LEGACY_KEYS) store.removeItem(key)
    const raw = store.getItem(DEMO_STORAGE_KEY)
    if (!raw) return seedBank(emptyState())
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.version !== 2 || !Array.isArray(parsed.tests)) return seedBank(emptyState())
    return parsed
  } catch {
    return seedBank(emptyState())
  }
}

function write(state: DemoState) {
  const store = storage()
  if (!store) {
    memoryState = state
    return
  }
  try {
    store.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
  } catch {
    memoryState = state
  }
  window.dispatchEvent(new Event(COURSE_TESTS_CHANGED))
}

/** Test helper: forget all demo data. */
export function resetDemoCourseTests() {
  memoryState = null
  storage()?.removeItem(DEMO_STORAGE_KEY)
}

const nextId = (state: DemoState) => state.next_id++
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data })
const fail = <T,>(error: string, issues?: PublishIssue[]): ActionResult<T> => (issues ? { ok: false, error, issues } : { ok: false, error })
const NOT_FOUND = "العنصر غير موجود."
// Simulated network latency keeps loading states honest during development.
const delay = () => new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === "test" ? 0 : 120))

// ---------------------------------------------------------------------------
// Seed data (created lazily, per course, the first time its tests are listed)

const opt = (...texts: string[]): Option[] => texts.map((text, index) => ({ id: String.fromCharCode(97 + index), text }))

function q(position: number, type: QuestionType, text: string, points: number, options: Option[], answer_key: AnswerKey, extra: Partial<TestQuestion> = {}): Omit<TestQuestion, "id"> {
  return { position, type, text, code_snippet: null, image_url: null, points, options, answer_key, explanation: null, shuffle_options: false, topic_ref: null, bank_question_id: null, ...extra }
}

const ESSAY_LIST_TUPLE = q(5, "essay", "اشرح الفرق بين list و tuple في Python مع مثال لكل منهما.", 5, [], {
  model_answer: "list قابلة للتعديل وتُكتب بين أقواس مربعة مثل [1, 2]، بينما tuple ثابتة لا تتغير بعد إنشائها وتُكتب بين أقواس عادية مثل (1, 2).",
  rubric: [
    { criterion: "ذكر أن list قابلة للتعديل و tuple ثابتة", points: 2 },
    { criterion: "طريقة الكتابة (الأقواس)", points: 1 },
    { criterion: "مثال صحيح لكل منهما", points: 2 },
  ],
  word_limit: 150,
})

const ESSAY_LOOPS = q(6, "essay", "متى تستخدم حلقة while بدلاً من for؟ وضّح بمثال.", 5, [], {
  model_answer: "تُستخدم while عندما لا نعرف عدد التكرارات مسبقاً ويتوقف التكرار على شرط، مثل قراءة مدخلات حتى يكتب المستخدم كلمة خروج.",
  rubric: [
    { criterion: "توضيح أن while تعتمد على شرط", points: 2 },
    { criterion: "مثال مناسب", points: 3 },
  ],
  word_limit: 120,
})

function unitOneQuestions(): Omit<TestQuestion, "id">[] {
  return [
    q(0, "single", "ما ناتج تنفيذ الكود التالي؟", 2, opt("5", "23", "خطأ في التنفيذ", "None"), { option_id: "a" }, { code_snippet: "print(2 + 3)", explanation: "يتم جمع العددين أولاً ثم الطباعة." }),
    q(1, "multi", "اختر كل أنواع البيانات الأساسية في Python.", 3, opt("str", "int", "window", "float"), { option_ids: ["a", "b", "d"] }),
    q(2, "true_false", "المتغيرات في Python تحتاج إلى تعريف نوعها قبل الاستخدام.", 1, opt("صح", "خطأ"), { option_id: "b" }),
    q(3, "short_answer", "ما اسم الدالة المستخدمة لمعرفة طول قائمة؟", 2, [], { accepted: ["len", "len()"], case_sensitive: false }),
    q(4, "ordering", "رتّب خطوات تشغيل برنامج Python.", 2, opt("كتابة الكود", "حفظ الملف", "التشغيل", "قراءة النتيجة"), { option_ids: ["a", "b", "c", "d"] }),
    ESSAY_LIST_TUPLE,
    ESSAY_LOOPS,
  ]
}

function seedBank(state: DemoState): DemoState {
  const bank: Omit<TestQuestion, "id">[] = [
    q(0, "single", "أي مما يلي يُستخدم للتعليق في Python؟", 1, opt("#", "//", "<!-- -->", "--"), { option_id: "a" }),
    q(0, "true_false", "الدالة range(3) تنتج الأعداد 0 و 1 و 2.", 1, opt("صح", "خطأ"), { option_id: "a" }),
    q(0, "single", "ما نوع القيمة True؟", 1, opt("int", "bool", "str", "list"), { option_id: "b" }),
    q(0, "short_answer", "ما الكلمة المفتاحية لتعريف دالة؟", 2, [], { accepted: ["def"], case_sensitive: false }),
    q(0, "multi", "أي من التالي هياكل بيانات مدمجة؟", 2, opt("dict", "set", "array", "tuple"), { option_ids: ["a", "b", "d"] }),
    q(0, "essay", "اشرح مفهوم الدالة ولماذا نستخدمها.", 4, [], { model_answer: "الدالة كتلة كود قابلة لإعادة الاستخدام تنفذ مهمة محددة.", rubric: [{ criterion: "التعريف", points: 2 }, { criterion: "الفائدة", points: 2 }], word_limit: 100 }),
    q(0, "single", "ما ناتج 7 // 2؟", 1, opt("3.5", "3", "4", "1"), { option_id: "b" }),
    q(0, "true_false", "القوائم في Python تبدأ من الفهرس 1.", 1, opt("صح", "خطأ"), { option_id: "b" }),
  ]
  state.bank = bank.map((question) => ({ ...question, id: nextId(state), course_id: null, used_in_tests: 0 }))
  return state
}

function baseSettings(overrides: Partial<TestSettings> = {}): TestSettings {
  return {
    lesson_id: null,
    position: 0,
    placement: "standalone_item",
    parent_item_id: null,
    title: "اختبار جديد",
    description: null,
    time_limit_minutes: 15,
    max_attempts: 3,
    grading_policy: "highest",
    cooldown_minutes: 0,
    pass_percent: 60,
    complete_item_on_pass_only: true,
    notify_teacher_on_attempts_exhausted: false,
    prerequisite: "none",
    prerequisite_ids: [],
    opens_at: null,
    closes_at: null,
    shuffle_questions: false,
    allow_back_navigation: true,
    random_pool_size: null,
    show_correct_answers: "after_submit",
    show_score_immediately: true,
    ...overrides,
  }
}

function makeTest(state: DemoState, courseId: number, status: CourseTest["status"], settings: Partial<TestSettings>, questions: Omit<TestQuestion, "id">[], updatedAgoMs = 0): DemoTest {
  return {
    ...baseSettings(settings),
    id: nextId(state),
    course_id: courseId,
    status,
    updated_at: new Date(Date.now() - updatedAgoMs).toISOString(),
    questions: questions.map((question, position) => ({ ...clone(question), id: nextId(state), position })),
  }
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

function seedCourse(state: DemoState, courseId: number) {
  if (state.seeded_courses.includes(courseId)) return false
  state.seeded_courses.push(courseId)
  const items = demoCourseItems(courseId)
  const lesson1 = items[0]
  const lesson2 = items[2]

  const unitOne = makeTest(
    state,
    courseId,
    "published",
    { title: "اختبار الفصل الأول", description: "اختبار على أساسيات Python: المتغيرات، الأنواع، والحلقات.", lesson_id: lesson1.lesson_id, position: 2, pass_percent: 60, time_limit_minutes: 20, max_attempts: 3 },
    unitOneQuestions(),
    5 * DAY,
  )
  const finalExam = makeTest(
    state,
    courseId,
    "published",
    {
      title: "الاختبار النهائي",
      description: "اختبار شامل بعد إنهاء كل الدروس.",
      lesson_id: lesson2.lesson_id,
      position: 5,
      pass_percent: 70,
      time_limit_minutes: 45,
      max_attempts: 2,
      prerequisite: "pass_tests",
      prerequisite_ids: [unitOne.id],
      opens_at: new Date(Date.now() + 3 * DAY).toISOString(),
      closes_at: new Date(Date.now() + 10 * DAY).toISOString(),
      show_correct_answers: "after_pass_or_exhausted",
    },
    unitOneQuestions().slice(0, 5),
    2 * DAY,
  )
  const quiz = makeTest(
    state,
    courseId,
    "draft",
    { title: "اختبار قصير: الدوال", lesson_id: lesson2.lesson_id, position: 3, placement: "inside_item", parent_item_id: lesson2.id, time_limit_minutes: null, max_attempts: null },
    [
      q(0, "single", "ما الكلمة المفتاحية لإرجاع قيمة من دالة؟", 2, opt("return", "yield", "break", "pass"), { option_id: "a" }),
      // Deliberately missing its key so the publish checklist has something to show.
      q(1, "multi", "أي مما يلي يُعد معاملاً افتراضياً صحيحاً؟", 2, opt("def f(x=1)", "def f(=1)", "def f(x, y=2)"), {}),
    ],
    3 * HOUR,
  )
  state.tests.push(unitOne, finalExam, quiz)

  const essayA = unitOne.questions.find((question) => question.position === 5)!
  const essayB = unitOne.questions.find((question) => question.position === 6)!
  const max = unitOne.questions.reduce((sum, question) => sum + question.points, 0)
  const essay = (question: TestQuestion, response: string, graded?: { points: number; feedback: string | null; ago: number }): DemoEssayAnswer => ({
    answer_id: nextId(state),
    question: clone(question),
    response,
    points_awarded: graded?.points ?? null,
    feedback: graded?.feedback ?? null,
    graded_at: graded ? new Date(Date.now() - graded.ago).toISOString() : null,
  })
  const attempt = (student: DemoAttempt["student"], number: number, ago: number, auto: number, essays: DemoEssayAnswer[]): DemoAttempt => ({
    id: nextId(state),
    test_id: unitOne.id,
    number,
    student,
    submitted_at: new Date(Date.now() - ago).toISOString(),
    auto_score: auto,
    max_score: max,
    essays,
  })

  state.attempts.push(
    // Oldest attempt, two essays still pending: "remaining essays in attempt" matters here.
    attempt({ id: 301, name: "سارة أحمد", initials: "سأ" }, 1, 2 * DAY + 3 * HOUR, 8, [
      essay(essayA, "القائمة list يمكن تعديل عناصرها بعد إنشائها وتكتب بين قوسين مربعين مثل [1, 2, 3]. أما tuple فلا يمكن تغييرها وتكتب بين قوسين عاديين مثل (1, 2)."),
      essay(essayB, "نستخدم while عندما لا نعرف عدد المرات، مثلاً نطلب من المستخدم إدخال كلمة المرور حتى تكون صحيحة."),
    ]),
    attempt({ id: 302, name: "عمر خالد", initials: "عخ" }, 2, 26 * HOUR, 7, [
      essay(essayA, "list متغيرة و tuple ثابتة."),
      essay(essayB, "while تستمر ما دام الشرط صحيحاً، مثل عدّاد تنازلي حتى الصفر.", { points: 4, feedback: "مثال جيد.", ago: 20 * HOUR }),
    ]),
    attempt({ id: 303, name: "مريم حسن", initials: "مح" }, 1, 5 * HOUR, 10, [
      essay(essayA, "الـ list نستطيع أن نضيف لها ونحذف منها باستخدام append و remove، والـ tuple لا. مثال: names = ['a', 'b'] و point = (3, 4)."),
      essay(essayB, "لما يكون التكرار مرتبط بشرط مش بعدد."),
    ]),
    attempt({ id: 304, name: "يوسف إبراهيم", initials: "يإ" }, 1, 40 * 60_000, 4, [essay(essayA, "لا أعرف الفرق بالتحديد لكن الاثنين يخزنان بيانات."), essay(essayB, "")]),
    // Fully graded attempt: appears under the "graded" filter.
    attempt({ id: 305, name: "نور محمود", initials: "نم" }, 1, 4 * DAY, 9, [
      essay(essayA, "list قابلة للتعديل [1,2] و tuple غير قابلة (1,2).", { points: 4, feedback: "أحسنت، ينقص مثال أوضح.", ago: 3 * DAY }),
      essay(essayB, "while مع شرط غير معروف مسبقاً مثل انتظار إدخال صحيح.", { points: 4, feedback: null, ago: 3 * DAY }),
    ]),
  )
  return true
}

/** Placeholder course items for pickers: the demo has no access to real course content. */
function demoCourseItems(courseId: number): CourseItemOption[] {
  const base = courseId * 100
  return [
    { id: base + 1, title: "مقدمة في Python", kind: "video", lesson_id: base + 10, lesson_title: "الدرس الأول: البداية" },
    { id: base + 2, title: "ملخص الدرس الأول", kind: "file", lesson_id: base + 10, lesson_title: "الدرس الأول: البداية" },
    { id: base + 3, title: "المتغيرات والأنواع", kind: "video", lesson_id: base + 20, lesson_title: "الدرس الثاني: الأساسيات" },
    { id: base + 4, title: "الحلقات", kind: "video", lesson_id: base + 20, lesson_title: "الدرس الثاني: الأساسيات" },
    { id: base + 5, title: "الدوال", kind: "video", lesson_id: base + 30, lesson_title: "الدرس الثالث: الدوال" },
  ]
}

// ---------------------------------------------------------------------------
// Derived values (what the backend would compute)

const totalPoints = (test: { questions: TestQuestion[] }) => test.questions.reduce((sum, question) => sum + question.points, 0)
const isPending = (essay: DemoEssayAnswer) => essay.points_awarded === null
const attemptsOf = (state: DemoState, testId: number) => state.attempts.filter((attempt) => attempt.test_id === testId)

function attemptResult(attempt: DemoAttempt, passPercent: number): GradeResult {
  const graded = attempt.essays.every((essay) => !isPending(essay))
  if (!graded) return { attempt_id: attempt.id, attempt_status: "pending_grading", score_total: null, max_score: attempt.max_score, percent: null, passed: null }
  const total = attempt.auto_score + attempt.essays.reduce((sum, essay) => sum + (essay.points_awarded ?? 0), 0)
  const percent = attempt.max_score > 0 ? Math.round((total / attempt.max_score) * 100) : 0
  return { attempt_id: attempt.id, attempt_status: "graded", score_total: total, max_score: attempt.max_score, percent, passed: percent >= passPercent }
}

function toCourseTest(state: DemoState, test: DemoTest): CourseTest {
  const attempts = attemptsOf(state, test.id)
  return {
    ...clone(test),
    questions: clone(test.questions).sort((a, b) => a.position - b.position),
    question_count: test.questions.length,
    total_points: totalPoints(test),
    attempt_count: attempts.length,
    submission_count: attempts.length,
    pending_grading_count: attempts.reduce((sum, attempt) => sum + attempt.essays.filter(isPending).length, 0),
  }
}

function toRow(state: DemoState, test: DemoTest): CourseTestRow {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omitting fields
  const { questions: _questions, ...rest } = toCourseTest(state, test)
  const items = demoCourseItems(test.course_id)
  const lesson = items.find((item) => item.lesson_id === test.lesson_id)
  const parent = items.find((item) => item.id === test.parent_item_id)
  const graded = attemptsOf(state, test.id)
    .map((attempt) => attemptResult(attempt, test.pass_percent))
    .filter((result) => result.percent !== null)
  return {
    ...rest,
    placement_label: test.placement === "inside_item" && parent ? `داخل «${parent.title}»` : lesson ? lesson.lesson_title : null,
    average_percent: graded.length ? Math.round(graded.reduce((sum, result) => sum + (result.percent ?? 0), 0) / graded.length) : null,
  }
}

export function isScheduled(test: Pick<CourseTest, "status" | "opens_at">, now = Date.now()) {
  return test.status === "published" && !!test.opens_at && new Date(test.opens_at).getTime() > now
}

function computeStats(state: DemoState, courseId: number): TestStats {
  const tests = state.tests.filter((test) => test.course_id === courseId)
  const results = tests.flatMap((test) => attemptsOf(state, test.id).map((attempt) => attemptResult(attempt, test.pass_percent)))
  const graded = results.filter((result) => result.percent !== null)
  return {
    published_tests: tests.filter((test) => test.status === "published" && !isScheduled(test)).length,
    draft_tests: tests.filter((test) => test.status === "draft").length,
    scheduled_tests: tests.filter((test) => isScheduled(test)).length,
    pending_grading: tests.reduce((sum, test) => sum + attemptsOf(state, test.id).reduce((count, attempt) => count + attempt.essays.filter(isPending).length, 0), 0),
    average_score: graded.length ? Math.round(graded.reduce((sum, result) => sum + (result.percent ?? 0), 0) / graded.length) : null,
    pass_rate: graded.length ? Math.round((graded.filter((result) => result.passed).length / graded.length) * 100) : null,
  }
}

// ---------------------------------------------------------------------------
// Validation (mirrors the backend's publish rules)

const AUTO_GRADED: QuestionType[] = ["single", "multi", "true_false", "short_answer", "ordering", "matching"]

export function questionKeyIssue(question: Pick<TestQuestion, "type" | "options" | "answer_key">): string | null {
  const key = question.answer_key as Record<string, unknown>
  const optionIds = new Set(question.options.map((option) => option.id))
  switch (question.type) {
    case "single":
    case "true_false": {
      const id = key.option_id
      return typeof id === "string" && optionIds.has(id) ? null : "لم تُحدَّد الإجابة الصحيحة"
    }
    case "multi": {
      const ids = key.option_ids
      return Array.isArray(ids) && ids.length > 0 && ids.every((id) => optionIds.has(id as string)) ? null : "اختر إجابة صحيحة واحدة على الأقل"
    }
    case "ordering": {
      const ids = key.option_ids
      return Array.isArray(ids) && ids.length === optionIds.size && optionIds.size > 1 && new Set(ids).size === ids.length && ids.every((id) => optionIds.has(id as string)) ? null : "حدّد الترتيب الصحيح لكل العناصر"
    }
    case "matching": {
      const matches = (key.matches ?? {}) as Record<string, string>
      const right = Array.isArray(key.right_options) ? (key.right_options as Option[]) : []
      const rightIds = new Set(right.map((option) => option.id))
      if (question.options.length === 0 || right.length === 0) return "أضف عناصر للطرفين"
      const picked = question.options.map((option) => matches[option.id])
      if (!picked.every((id) => rightIds.has(id))) return "صِل كل عنصر بما يقابله"
      return new Set(picked).size === picked.length ? null : "لا يمكن توصيل عنصرين بالخيار نفسه"
    }
    case "short_answer": {
      const accepted = key.accepted
      return Array.isArray(accepted) && accepted.some((answer) => typeof answer === "string" && answer.trim() !== "") ? null : "أضف إجابة مقبولة واحدة على الأقل"
    }
    case "essay":
      return null
  }
}

export function publishIssues(test: Pick<CourseTest, "questions" | "pass_percent" | "opens_at" | "closes_at" | "random_pool_size" | "title">): PublishIssue[] {
  const issues: PublishIssue[] = []
  if (!test.title.trim()) issues.push({ code: "title_required", message: "أضف عنواناً للاختبار" })
  if (test.questions.length === 0) issues.push({ code: "no_questions", message: "أضف سؤالاً واحداً على الأقل" })
  for (const question of test.questions) {
    if (!question.text.trim()) issues.push({ code: "question_text_required", message: `السؤال ${question.position + 1}: نص السؤال فارغ`, question_id: question.id })
    if (question.points < 1 || !Number.isInteger(question.points)) issues.push({ code: "invalid_points", message: `السؤال ${question.position + 1}: الدرجة يجب أن تكون عدداً صحيحاً ≥ 1`, question_id: question.id })
    if (!AUTO_GRADED.includes(question.type)) continue
    const problem = questionKeyIssue(question)
    if (problem) issues.push({ code: "missing_answer_key", message: `السؤال ${question.position + 1}: ${problem}`, question_id: question.id })
  }
  if (!Number.isInteger(test.pass_percent) || test.pass_percent < 1 || test.pass_percent > 100) issues.push({ code: "invalid_pass_percent", message: "نسبة النجاح يجب أن تكون بين 1 و 100" })
  if (test.opens_at && test.closes_at && new Date(test.closes_at).getTime() <= new Date(test.opens_at).getTime()) issues.push({ code: "invalid_window", message: "موعد الإغلاق يجب أن يكون بعد موعد الفتح" })
  if (test.random_pool_size !== null && (test.random_pool_size < 1 || test.random_pool_size > test.questions.length)) issues.push({ code: "invalid_random_pool", message: "عدد الأسئلة العشوائية يجب ألا يتجاوز عدد أسئلة الاختبار" })
  return issues
}

function validateQuestionInput(input: QuestionInput): string | null {
  if (!input.text?.trim()) return "نص السؤال مطلوب"
  if (!Number.isInteger(input.points) || input.points < 1) return "الدرجة يجب أن تكون عدداً صحيحاً ≥ 1"
  const ids = input.options.map((option) => option.id)
  if (new Set(ids).size !== ids.length) return "معرّفات الخيارات مكررة"
  return null
}

// ---------------------------------------------------------------------------
// Mutations

function findTest(state: DemoState, testId: number) {
  return state.tests.find((test) => test.id === testId)
}

function findQuestion(state: DemoState, questionId: number) {
  for (const test of state.tests) {
    const question = test.questions.find((item) => item.id === questionId)
    if (question) return { test, question }
  }
  return null
}

function touch(test: DemoTest) {
  test.updated_at = new Date().toISOString()
}

function renumber(test: DemoTest) {
  test.questions.sort((a, b) => a.position - b.position).forEach((question, index) => (question.position = index))
}

function stripInput(input: QuestionInput): Omit<TestQuestion, "id" | "bank_question_id"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omitting fields
  const { save_to_bank: _save, ...rest } = input
  return clone(rest)
}

function saveToBank(state: DemoState, test: DemoTest, question: TestQuestion) {
  const bankQuestion: BankQuestion = { ...clone(question), id: nextId(state), bank_question_id: null, course_id: test.course_id, used_in_tests: 1 }
  state.bank.push(bankQuestion)
  question.bank_question_id = bankQuestion.id
}

function copyFromBank(state: DemoState, test: DemoTest, bankQuestion: BankQuestion): TestQuestion {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omitting fields
  const { course_id: _course, used_in_tests: _used, ...rest } = clone(bankQuestion)
  bankQuestion.used_in_tests += 1
  const question: TestQuestion = { ...rest, id: nextId(state), position: test.questions.length, bank_question_id: bankQuestion.id }
  test.questions.push(question)
  return question
}

function bankFor(state: DemoState, courseId?: number, search?: string) {
  const term = search?.trim().toLowerCase()
  return state.bank.filter((question) => (courseId === undefined || question.course_id === null || question.course_id === courseId) && (!term || question.text.toLowerCase().includes(term)))
}

async function run<T>(operation: (state: DemoState) => ActionResult<T>): Promise<ActionResult<T>> {
  await delay()
  const state = read()
  const before = JSON.stringify(state)
  const result = operation(state)
  if (JSON.stringify(state) !== before) write(state)
  return result
}

// ---------------------------------------------------------------------------
// Excel/CSV import (demo parses CSV; the API parses .xlsx and .csv)

export const IMPORT_COLUMNS = ["type", "text", "points", "option_a", "option_b", "option_c", "option_d", "correct", "explanation"] as const

const TYPE_ALIASES: Record<string, QuestionType> = {
  single: "single",
  "اختيار من متعدد": "single",
  "اختيار واحد": "single",
  multi: "multi",
  "اختيارات متعددة": "multi",
  "أكثر من إجابة": "multi",
  true_false: "true_false",
  "صح أو خطأ": "true_false",
  "صح وخطأ": "true_false",
  short_answer: "short_answer",
  "إجابة قصيرة": "short_answer",
  essay: "essay",
  "مقالي": "essay",
  "سؤال مقالي": "essay",
}

const LETTERS: Record<string, string> = { a: "a", b: "b", c: "c", d: "d", "أ": "a", "ب": "b", "ج": "c", "د": "d", "1": "a", "2": "b", "3": "c", "4": "d" }

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const source = text.replace(/^\uFEFF/, "")
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"'
        index++
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ",") {
      row.push(cell)
      cell = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += char
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""))
}

export function previewRows(rows: string[][]): ExcelImportPreview {
  const valid: QuestionInput[] = []
  const errors: ExcelRowError[] = []
  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2 // 1-based, after the header row
    const [rawType = "", text = "", rawPoints = "", a = "", b = "", c = "", d = "", correct = "", explanation = ""] = cells.map((cell) => cell.trim())
    const rowErrors: string[] = []
    const type = TYPE_ALIASES[rawType.toLowerCase()] ?? TYPE_ALIASES[rawType]
    if (!type) rowErrors.push(`نوع السؤال «${rawType || "فارغ"}» غير معروف`)
    if (!text) rowErrors.push("نص السؤال فارغ")
    const points = Number(rawPoints)
    if (!Number.isInteger(points) || points < 1) rowErrors.push("الدرجة يجب أن تكون عدداً صحيحاً ≥ 1")
    let options: Option[] = []
    let answer_key: AnswerKey = {}
    if (type === "single" || type === "multi") {
      options = [a, b, c, d].map((value, position) => ({ id: String.fromCharCode(97 + position), text: value })).filter((option) => option.text)
      if (options.length < 2) rowErrors.push("أضف خيارين على الأقل")
      const picked = correct.split(/[\s,،|]+/).filter(Boolean).map((value) => LETTERS[value.toLowerCase()] ?? LETTERS[value])
      if (picked.length === 0 || picked.some((id) => !id || !options.some((option) => option.id === id))) rowErrors.push("الإجابة الصحيحة يجب أن تكون حرف خيار موجود (أ، ب، ج، د)")
      else if (type === "single" && picked.length !== 1) rowErrors.push("سؤال الاختيار من متعدد له إجابة صحيحة واحدة")
      answer_key = type === "single" ? { option_id: picked[0] } : { option_ids: picked }
    } else if (type === "true_false") {
      options = opt("صح", "خطأ")
      const normalized = correct.toLowerCase()
      const id = ["صح", "صحيح", "true", "t", "1"].includes(normalized) ? "a" : ["خطأ", "خطا", "false", "f", "0"].includes(normalized) ? "b" : null
      if (!id) rowErrors.push("الإجابة الصحيحة يجب أن تكون «صح» أو «خطأ»")
      answer_key = { option_id: id ?? undefined }
    } else if (type === "short_answer") {
      const accepted = correct.split("|").map((value) => value.trim()).filter(Boolean)
      if (accepted.length === 0) rowErrors.push("أضف إجابة مقبولة واحدة على الأقل (افصل بين البدائل بـ |)")
      answer_key = { accepted, case_sensitive: false }
    } else if (type === "essay") {
      answer_key = { model_answer: correct || undefined, rubric: [], word_limit: null }
    }
    if (rowErrors.length) {
      errors.push({ row: rowNumber, errors: rowErrors })
      return
    }
    valid.push({ position: valid.length, type: type!, text, code_snippet: null, image_url: null, points, options, answer_key, explanation: explanation || null, shuffle_options: false, topic_ref: null })
  })
  if (rows.length <= 1) errors.push({ row: 1, errors: ["الملف لا يحتوي على أسئلة"] })
  return { valid, errors }
}

// ---------------------------------------------------------------------------
// Grading queue

function toQueueItem(state: DemoState, attempt: DemoAttempt, essay: DemoEssayAnswer): GradingQueueItem | null {
  const test = findTest(state, attempt.test_id)
  if (!test) return null
  const others = attempt.essays.filter((other) => other.answer_id !== essay.answer_id)
  return {
    answer_id: essay.answer_id,
    attempt_id: attempt.id,
    attempt_number: attempt.number,
    status: isPending(essay) ? "pending" : "graded",
    submitted_at: attempt.submitted_at,
    student: clone(attempt.student),
    test: { id: test.id, title: test.title, course_id: test.course_id, pass_percent: test.pass_percent },
    question: clone(essay.question),
    response: essay.response,
    feedback: essay.feedback,
    points_awarded: essay.points_awarded,
    score_rest: attempt.auto_score + others.reduce((sum, other) => sum + (other.points_awarded ?? 0), 0),
    max_score: attempt.max_score,
    remaining_essays_in_attempt: others.filter(isPending).length,
  }
}

// ---------------------------------------------------------------------------
// The client

export const demoCourseTestsClient: CourseTestsClient = {
  listTests: (courseId) =>
    run((state) => {
      seedCourse(state, courseId)
      const rows = state.tests
        .filter((test) => test.course_id === courseId)
        .sort((a, b) => a.position - b.position || a.id - b.id)
        .map((test) => toRow(state, test))
      return ok(rows)
    }),

  getStats: (courseId) =>
    run((state) => {
      seedCourse(state, courseId)
      return ok(computeStats(state, courseId))
    }),

  getTest: (testId) =>
    run((state) => {
      const test = findTest(state, testId)
      return test ? ok(toCourseTest(state, test)) : fail("الاختبار غير موجود.")
    }),

  listCourseItems: async (courseId) => {
    await delay()
    const state = read()
    const tests: CourseItemOption[] = state.tests
      .filter((test) => test.course_id === courseId && test.status !== "archived")
      .map((test) => ({ id: test.id, title: test.title, kind: "test", lesson_id: test.lesson_id ?? 0, lesson_title: demoCourseItems(courseId).find((item) => item.lesson_id === test.lesson_id)?.lesson_title ?? "" }))
    return ok([...demoCourseItems(courseId), ...tests])
  },

  createTest: (courseId, input) =>
    run((state) => {
      const title = input?.title?.trim() || "اختبار جديد"
      const test = makeTest(state, courseId, "draft", { title, position: state.tests.filter((row) => row.course_id === courseId).length }, [])
      state.tests.push(test)
      return ok({ id: test.id })
    }),

  duplicateTest: (testId, targetCourseId) =>
    run((state) => {
      const source = findTest(state, testId)
      if (!source) return fail("الاختبار غير موجود.")
      const courseId = targetCourseId ?? source.course_id
      const sameCourse = courseId === source.course_id
      const copy: DemoTest = {
        ...clone(source),
        id: nextId(state),
        course_id: courseId,
        status: "draft",
        title: `${source.title} (نسخة)`,
        // Course-specific references don't carry across courses.
        lesson_id: sameCourse ? source.lesson_id : null,
        parent_item_id: sameCourse ? source.parent_item_id : null,
        placement: sameCourse ? source.placement : "standalone_item",
        prerequisite: sameCourse ? source.prerequisite : "none",
        prerequisite_ids: sameCourse ? [...source.prerequisite_ids] : [],
        position: state.tests.filter((row) => row.course_id === courseId).length,
        updated_at: new Date().toISOString(),
        questions: source.questions.map((question) => ({ ...clone(question), id: nextId(state), topic_ref: sameCourse ? question.topic_ref : null })),
      }
      state.tests.push(copy)
      return ok({ id: copy.id })
    }),

  updateSettings: (testId, settings) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (test.status === "archived") return fail("لا يمكن تعديل اختبار مؤرشف.")
      const next = { ...test, ...clone(settings) }
      if (settings.pass_percent !== undefined && (!Number.isInteger(next.pass_percent) || next.pass_percent < 1 || next.pass_percent > 100)) return fail("نسبة النجاح يجب أن تكون بين 1 و 100")
      if (next.opens_at && next.closes_at && new Date(next.closes_at) <= new Date(next.opens_at)) return fail("موعد الإغلاق يجب أن يكون بعد موعد الفتح")
      if (next.random_pool_size !== null && (next.random_pool_size < 1 || next.random_pool_size > next.questions.length)) return fail("عدد الأسئلة العشوائية يجب ألا يتجاوز عدد أسئلة الاختبار")
      if (next.time_limit_minutes !== null && next.time_limit_minutes < 1) return fail("مدة الاختبار يجب أن تكون دقيقة على الأقل")
      if (next.max_attempts !== null && next.max_attempts < 1) return fail("عدد المحاولات يجب أن يكون 1 على الأقل")
      Object.assign(test, next)
      touch(test)
      return ok(toCourseTest(state, test))
    }),

  publishTest: (testId) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (test.status === "archived") return fail("لا يمكن نشر اختبار مؤرشف.")
      const issues = publishIssues(test)
      if (issues.length) return fail("لا يمكن نشر الاختبار قبل إصلاح المشكلات.", issues)
      test.status = "published"
      touch(test)
      return ok(toCourseTest(state, test))
    }),

  unpublishTest: (testId) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (attemptsOf(state, testId).length > 0) return fail("لا يمكن إلغاء نشر اختبار بدأ الطلاب محاولاته. يمكنك أرشفته بدلاً من ذلك.")
      test.status = "draft"
      touch(test)
      return ok(toCourseTest(state, test))
    }),

  archiveTest: (testId) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      test.status = "archived"
      touch(test)
      return ok(null)
    }),

  deleteTest: (testId) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (test.status !== "draft") return fail("يمكن حذف المسودات فقط. أرشف الاختبار المنشور بدلاً من ذلك.")
      if (attemptsOf(state, testId).length > 0) return fail("لا يمكن حذف اختبار له محاولات.")
      state.tests = state.tests.filter((item) => item.id !== testId)
      for (const other of state.tests) other.prerequisite_ids = other.prerequisite_ids.filter((id) => id !== testId)
      return ok(null)
    }),

  addQuestion: (testId, input) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (test.status === "archived") return fail("لا يمكن تعديل اختبار مؤرشف.")
      const problem = validateQuestionInput(input)
      if (problem) return fail(problem)
      const question: TestQuestion = { ...stripInput(input), id: nextId(state), position: test.questions.length, bank_question_id: null }
      test.questions.push(question)
      if (input.save_to_bank) saveToBank(state, test, question)
      touch(test)
      return ok(clone(question))
    }),

  updateQuestion: (questionId, input) =>
    run((state) => {
      const found = findQuestion(state, questionId)
      if (!found) return fail(NOT_FOUND)
      if (found.test.status === "archived") return fail("لا يمكن تعديل اختبار مؤرشف.")
      const problem = validateQuestionInput(input)
      if (problem) return fail(problem)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omitting fields
      const { position: _position, ...rest } = stripInput(input)
      Object.assign(found.question, rest)
      if (input.save_to_bank && !found.question.bank_question_id) saveToBank(state, found.test, found.question)
      touch(found.test)
      return ok(clone(found.question))
    }),

  deleteQuestion: (questionId) =>
    run((state) => {
      const found = findQuestion(state, questionId)
      if (!found) return fail(NOT_FOUND)
      found.test.questions = found.test.questions.filter((question) => question.id !== questionId)
      renumber(found.test)
      if (found.test.random_pool_size !== null && found.test.random_pool_size > found.test.questions.length) found.test.random_pool_size = found.test.questions.length || null
      touch(found.test)
      return ok(null)
    }),

  reorderQuestions: (testId, questionIds) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      const current = new Set(test.questions.map((question) => question.id))
      if (questionIds.length !== current.size || new Set(questionIds).size !== questionIds.length || !questionIds.every((id) => current.has(id))) return fail("ترتيب الأسئلة غير صالح.")
      for (const question of test.questions) question.position = questionIds.indexOf(question.id)
      renumber(test)
      touch(test)
      return ok(null)
    }),

  listBank: async (query) => {
    await delay()
    const state = read()
    return ok(clone(bankFor(state, query?.courseId, query?.search)))
  },

  importFromBank: (testId, bankQuestionIds) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      const picked = bankQuestionIds.map((id) => state.bank.find((question) => question.id === id))
      if (picked.length === 0 || picked.some((question) => !question)) return fail("بعض أسئلة البنك غير موجودة.")
      const added = picked.map((question) => copyFromBank(state, test, question!))
      touch(test)
      return ok(clone(added))
    }),

  drawFromBank: (testId, count, courseId) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      const used = new Set(test.questions.map((question) => question.bank_question_id).filter(Boolean))
      const pool = bankFor(state, courseId ?? test.course_id).filter((question) => !used.has(question.id))
      if (!Number.isInteger(count) || count < 1) return fail("عدد الأسئلة يجب أن يكون 1 على الأقل.")
      if (count > pool.length) return fail(`البنك يحتوي على ${pool.length} سؤال متاح فقط.`)
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
      const added = shuffled.map((question) => copyFromBank(state, test, question))
      touch(test)
      return ok(clone(added))
    }),

  previewExcel: async (testId, file) => {
    await delay()
    if (!findTest(read(), testId)) return fail("الاختبار غير موجود.")
    const name = file.name.toLowerCase()
    if (!name.endsWith(".csv")) return fail("وضع العرض التجريبي يقرأ ملفات CSV فقط. احفظ القالب بصيغة CSV (UTF-8).")
    if (file.size > EXCEL_MAX_BYTES) return fail("حجم الملف يتجاوز 900 كيلوبايت.")
    const text = await file.text()
    return ok(previewRows(parseCsv(text)))
  },

  importExcel: (testId, rows) =>
    run((state) => {
      const test = findTest(state, testId)
      if (!test) return fail("الاختبار غير موجود.")
      if (rows.length === 0) return fail("لا توجد أسئلة صالحة للاستيراد.")
      for (const row of rows) {
        const problem = validateQuestionInput(row)
        if (problem) return fail(problem)
      }
      const added = rows.map((row) => {
        const question: TestQuestion = { ...stripInput(row), id: nextId(state), position: test.questions.length, bank_question_id: null }
        test.questions.push(question)
        return question
      })
      touch(test)
      return ok(clone(added))
    }),

  getGradingQueue: async (query) => {
    await delay()
    const state = read()
    const items = state.attempts
      .filter((attempt) => query?.testId === undefined || attempt.test_id === query.testId)
      .flatMap((attempt) => attempt.essays.map((essay) => toQueueItem(state, attempt, essay)))
      .filter((item): item is GradingQueueItem => item !== null)
      .filter((item) => !query?.status || item.status === query.status)
      // Oldest submission first; stable within an attempt by answer id.
      .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at) || a.answer_id - b.answer_id)
    return ok(items)
  },

  getPendingGradingCount: async () => {
    await delay()
    const state = read()
    const liveTests = new Set(state.tests.map((test) => test.id))
    return ok(state.attempts.filter((attempt) => liveTests.has(attempt.test_id)).reduce((sum, attempt) => sum + attempt.essays.filter(isPending).length, 0))
  },

  gradeAnswer: (answerId, points, feedback) =>
    run((state) => {
      for (const attempt of state.attempts) {
        const essay = attempt.essays.find((item) => item.answer_id === answerId)
        if (!essay) continue
        const test = findTest(state, attempt.test_id)
        if (!test) return fail("الاختبار غير موجود.")
        if (!Number.isInteger(points) || points < 0 || points > essay.question.points) return fail(`الدرجة يجب أن تكون عدداً صحيحاً بين 0 و ${essay.question.points}.`)
        essay.points_awarded = points
        essay.feedback = feedback.trim() || null
        essay.graded_at = new Date().toISOString()
        return ok(attemptResult(attempt, test.pass_percent))
      }
      return fail("الإجابة غير موجودة.")
    }),
}
